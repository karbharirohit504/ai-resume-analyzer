import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker?url";
GlobalWorkerOptions.workerSrc = worker;

import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router-dom";
import { pdfToImage } from "~/lib/pdf2img";
import {genrateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const{auth, isLoading,fs,ai,kv}= usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    };

    const handleAnalyze= async ({companyName,jobTitle,jobDescription,file}:{companyName: string,jobTitle:string,jobDescription:string,file:File}) =>{
        setIsProcessing(true);
        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error:Failed to upload file');

        setStatusText('converting to image..');
        const imageFile = await pdfToImage(file);
        if(!imageFile) return setStatusText('Error:Failed to convert pdf to image');

        setStatusText('Uploading to image..');
        // convert base64 → file
        function base64ToFile(base64: string, filename: string) {
            const arr = base64.split(",");
            const mime = arr[0].match(/:(.*?);/)![1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);

            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }

            return new File([u8arr], filename, { type: mime });
        }

        const imageAsFile = base64ToFile(imageFile, "resume.png");

        const uploadedImage = await fs.upload([imageAsFile]);
        if(!uploadedImage) return setStatusText('Error:Failed to upload image');

        setStatusText('preparing data...');

        const uuid=genrateUUID();
        const data={
            id:uuid,
            resumepath: uploadedFile.path,
            imagepath: uploadedImage.path,
            companyName,jobTitle,jobDescription,
            feedback: ''
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');

        const feedback=await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle,jobDescription })
        )
        if(!feedback) return setStatusText('Error: Failed to analyze resume');

        const feedbackText=typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        data.feedback=JSON.parse(feedbackText);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        console.log(data);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const companyName: FormDataEntryValue | null = formData.get("company-name") as string;
        const jobTitle: FormDataEntryValue | null = formData.get("job-title") as string;
        const jobDescription: FormDataEntryValue | null = formData.get("job-description") as string;

        if (!file) return;

        handleAnalyze({companyName,jobTitle,jobDescription,file});

    }
    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart Feedback For Your Dream Job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/loading.gif" alt="processing" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea
                                    rows={5}
                                    name="job-description"
                                    placeholder="Job Description"
                                    id="job-description"
                                />
                            </div>

                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className="primary-button" type="submit">
                                Analyse Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Upload;