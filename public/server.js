const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const { exec } = require('child_process');
const PDFLib = require('pdf-lib');  // Para la unificación

const app = express();
const upload = multer({ dest: 'uploads/' });

// LOGS:
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const appLogStream = fs.createWriteStream(path.join(logDirectory, 'app.log'), { flags: 'a' });

// Función para registrar en logs personalizados
function log(message) {
    const logMessage = `${new Date().toISOString()} - ${message}\n`;
    appLogStream.write(logMessage);
    console.log(logMessage);
}

// LOGS MORGAN
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    const errorLogStream = fs.createWriteStream(path.join(logDirectory, 'errors.log'), { flags: 'a' });
    const errorDetails = `${new Date().toISOString()} - Error: ${err.message}\nStack: ${err.stack}\n\n`;
    
    errorLogStream.write(errorDetails);
    console.error(errorDetails);
    res.status(500).send('Error interno del servidor');
    next();
});

// Manejar errores no controlados
process.on('uncaughtException', (err) => {
    const errorDetails = `${new Date().toISOString()} - Uncaught Exception: ${err.message}\nStack: ${err.stack}\n\n`;
    fs.appendFileSync(path.join(logDirectory, 'errors.log'), errorDetails);
    console.error(errorDetails);
    process.exit(1);
});

// Manejar promesas rechazadas
process.on('unhandledRejection', (reason, promise) => {
    const errorDetails = `${new Date().toISOString()} - Unhandled Rejection: ${reason.message || reason}\n\n`;
    fs.appendFileSync(path.join(logDirectory, 'errors.log'), errorDetails);
    console.error(errorDetails);
});

// Ruta completa al ejecutable qpdf
const qpdfPath = 'C:\\ProgramData\\chocolatey\\bin\\qpdf.exe';  // Ajusta esta ruta según tu instalación

app.use(express.static(__dirname));

// Ruta para cargar el formulario
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para manejar la subida de PDF, unificación y protección
app.post('/unify-protect', upload.array('pdfFiles', 10), async (req, res) => {
    const password = req.body.password || '';
    log(`Archivos subidos: ${req.files.map(file => file.originalname).join(', ')}`);

    try {
        const pdfDocs = [];

        // Cargar los PDFs
        for (const file of req.files) {
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
        log(`Unificación completada: ${mergedPdfPath}`);
        let protectedPdfPath = mergedPdfPath;

        if (password) {
            // Proteger con contraseña si se proporciona
            protectedPdfPath = path.join(__dirname, `protected_merged_${Date.now()}.pdf`);
            const command = `"${qpdfPath}" "${mergedPdfPath}" --encrypt ${password} ${password} 256 -- "${protectedPdfPath}"`;
            log(`Intentando proteger el PDF con contraseña: ${password}`);

            // Ejecutar el comando qpdf
            exec(command, (err) => {
                if (err) {
                    console.error('Error al proteger el PDF:', err);
                    log(`Error al proteger el PDF: ${err.message}`);
                    return res.status(500).send('Error al proteger el PDF.');
                }
                log(`Protección del PDF completada: ${protectedPdfPath}`);
                res.download(protectedPdfPath, (err) => {
                    if (err) log(`Error al enviar el PDF protegido: ${err.message}`);

                    // Eliminar archivos temporales
                    fs.unlinkSync(mergedPdfPath);
                    fs.unlinkSync(protectedPdfPath);
                });
            });
        } else {
            // Devolver el PDF unificado sin contraseña
            log(`PDF generado sin contraseña para los archivos: ${req.files.map(file => file.originalname).join(', ')}`);
            res.download(mergedPdfPath, (err) => {
                if (err) log(`Error al enviar el PDF unificado: ${err.message}`);

                // Eliminar archivo temporal
                fs.unlinkSync(mergedPdfPath);
            });
        }
    } catch (error) {
        console.error('Error al unificar o proteger los PDFs:', error);
        log(`Error al unificar o proteger los PDFs: ${error.message}`);
        res.status(500).send('Error en el proceso de unificación/protección.');
    } finally {
        // Eliminar archivos subidos
        req.files.forEach(file => fs.unlinkSync(file.path));
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
