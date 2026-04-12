export async function pdfToImage(file: File) {
    // 1. Load PDF.js
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";

    // 2. Convert file → PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 3. Get first page
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2 });

    // 4. Draw on canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
        canvasContext: context,
        viewport,
    }).promise;

    // 5. Return image
    return canvas.toDataURL("image/png");
}