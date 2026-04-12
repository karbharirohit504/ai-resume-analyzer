/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB)
 * @param bytes - The size in bytes
 * @returns A formatted string with the appropriate unit
 */
export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    // Determine the appropriate unit
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Format with 2 decimal places
    const size = (bytes / Math.pow(k, i)).toFixed(2);

    return `${size} ${sizes[i]}`;
}
export const genrateUUID=() =>crypto.randomUUID();