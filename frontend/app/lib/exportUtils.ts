export const exportHTMLToWord = (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // We clone the element to clean up non-printable things
    const clone = element.cloneNode(true) as HTMLElement;

    const htmlContent = clone.innerHTML;

    // Basic CSS for Word Doc to respect A4 and table borders
    const style = `
        <style>
            @page { size: 21cm 29.7cm; margin: 2cm; }
            body { font-family: 'Arial', sans-serif; font-size: 11pt; color: black; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid black; padding: 5px; text-align: left; }
            .hidden, .print\\\\:hidden { display: none !important; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            h2, h3 { color: black; margin-bottom: 15px; }
            .grid { display: block; } /* Word doesn't support CSS grid well, fallback to block */
            .border { border: 1px solid black; }
        </style>
    `;

    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <meta charset='utf-8'>
        <title>${filename}</title>
        ${style}
    </head>
    <body>`;
    const postHtml = "</body></html>";
    const html = preHtml + htmlContent + postHtml;

    const blob = new Blob(['\\ufeff', html], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename + '.doc';

    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
};
