const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PDFLib = require('pdf-lib');  // Para la unificación

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ruta completa al ejecutable qpdf
const qpdfPath = 'C:\\ProgramData\\chocolatey\\bin\\qpdf.exe';  // Ajusta esta ruta según tu instalación

app.use(express.static(__dirname));

// Ruta para cargar el formulario   
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index1.html'));
});

// Ruta para manejar la subida de PDF, unificación y protección
app.post('/unify-protect', upload.array('pdfFiles', 10), async (req, res) => {
    const password = req.body.password || '';
    const fileOrder = JSON.parse(req.body.fileOrder || '[]');

    console.log('File Order:', fileOrder);

    if (fileOrder.length !== req.files.length) {
        return res.status(400).send('El orden de los archivos es incorrecto.');
    }

    // Ordenar los archivos según el índice recibido
    const files = fileOrder.map(index => req.files[index]);
    const pdfDocs = [];

    try {
        console.log('Files:', files);

        // Cargar los PDFs en el orden correcto
        for (const file of files) {
            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            pdfDocs.push(pdfDoc);
        }

        // Crear nuevo PDF unificado
        const mergedPdf = await PDFLib.PDFDocument.create();
        for (const pdfDoc of pdfDocs) {
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        // Guardar el PDF unificado
        const mergedPdfBytes = await mergedPdf.save();
        const mergedPdfPath = path.join(__dirname, `merged_${Date.now()}.pdf`);
        fs.writeFileSync(mergedPdfPath, mergedPdfBytes);

        // Proteger con contraseña
        const protectedPdfPath = path.join(__dirname, `protected_merged_${Date.now()}.pdf`);
        const command = `"${qpdfPath}" "${mergedPdfPath}" --encrypt ${password} ${password} 256 -- "${protectedPdfPath}"`;

        console.log('Executing command:', command);

        // Ejecutar el comando qpdf
        exec(command, (err) => {
            if (err) {
                console.error('Error al proteger el PDF:', err);
                return res.status(500).send('Error al proteger el PDF.');
            }

            // Descargar PDF protegido
            res.download(protectedPdfPath, (err) => {
                if (err) console.error('Error al enviar el PDF:', err);
                
                // Eliminar archivos temporales
                fs.unlinkSync(mergedPdfPath);
                fs.unlinkSync(protectedPdfPath);
            });
        });
    } catch (error) {
        console.error('Error al unificar o proteger los PDFs:', error);
        res.status(500).send('Error en el proceso de unificación/protección.');
    } finally {
        // Eliminar archivos subidos
        req.files.forEach(file => fs.unlinkSync(file.path));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
