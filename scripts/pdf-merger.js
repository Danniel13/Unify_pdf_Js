// pdf-merger.js
async function mergePDFs() {
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('No se han seleccionado archivos');
        return;
    }

    const fileOrder = Array.from(fileList.children)
                           .map(li => parseInt(li.dataset.fileIndex))
                           .map(index => files[index]);

    const pdfDocs = [];

    // Carga de archivos en el orden seleccionado:
    for (const file of fileOrder) {
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        pdfDocs.push(pdfDoc);
    }

    // Creacion de pdf nuevo
    const mergedPdf = await PDFLib.PDFDocument.create();

    // Copy pages from each PDF into the new document
    for (const pdfDoc of pdfDocs) {
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Save the merged PDF and create a download link
    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    // Create and click a link to download the PDF
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Unificado.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    location.href="index.html";
}
