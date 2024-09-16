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

// Crear carpeta de logs si no existe
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const appLogStream = fs.createWriteStream(path.join(logDirectory, 'app.log'), { flags: 'a' });

// Función para registrar en logs personalizados
function log(message) {
  const logMessage = `${new Date().toISOString()} - ${message}\n`;
  appLogStream.write(logMessage);
  console.log(logMessage); // Para verlo también en consola
}

// FIN LOGS


//LOGS MORGAN
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// También loguea en consola para facilidad de desarrollo
app.use(morgan('dev'));

// Middleware de manejo de errores en Express
app.use((err, req, res, next) => {
  const errorLogStream = fs.createWriteStream(path.join(logDirectory, 'errors.log'), { flags: 'a' });
  const errorDetails = `${new Date().toISOString()} - Error: ${err.message}\nStack: ${err.stack}\n\n`;
  
  errorLogStream.write(errorDetails);  // Registrar en archivo
  console.error(errorDetails);  // Mostrar en consola

  res.status(500).send('Error interno del servidor');
  next();  // Asegurar que no bloquea otros middlewares
});

// Manejar errores no controlados
process.on('uncaughtException', (err) => {
  const errorDetails = `${new Date().toISOString()} - Uncaught Exception: ${err.message}\nStack: ${err.stack}\n\n`;
  fs.appendFileSync(path.join(logDirectory, 'errors.log'), errorDetails);
  console.error(errorDetails);
  process.exit(1);  // Cerrar la aplicación en caso de error grave
});

// Manejar promesas rechazadas
process.on('unhandledRejection', (reason, promise) => {
  const errorDetails = `${new Date().toISOString()} - Unhandled Rejection: ${reason.message || reason}\n\n`;
  fs.appendFileSync(path.join(logDirectory, 'errors.log'), errorDetails);
  console.error(errorDetails);
});

//FIN LOGS MORGAN




// Ruta completa al ejecutable qpdf
const qpdfPath = 'C:\\ProgramData\\chocolatey\\bin\\qpdf.exe';  // Ajusta esta ruta según tu instalación

app.use(express.static(__dirname));

// Ruta para cargar el formulario   
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para manejar la subida de PDF, unificación y protección
app.post('/unify-protect', upload.array('pdfFiles', 10), async (req, res) => {
    const password = req.body.password || '';  // Puede ser una cadena vacía si no se proporciona
    const fileOrder = JSON.parse(req.body.fileOrder || '[]');
    log(`Archivos subidos: ${req.files.map(file => file.originalname).join(', ')}`);
    log(`Orden de archivos: ${fileOrder.join(', ')}`);
    console.log('File Order:', fileOrder);

    if (fileOrder.length !== req.files.length) {
        return res.status(400).send('El orden de los archivos es incorrecto.');
    }

    // Ordenar los archivos según el índice recibido
    const files = fileOrder.map(index => req.files[index]);
    const pdfDocs = [];

    console.log('Files in Order:', files.map(file => file.originalname));

    try {
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
        log(`Unificación completada: ${mergedPdfPath}`);
        let protectedPdfPath = mergedPdfPath;

        if (password) {
            // Proteger con contraseña solo si se proporciona
            protectedPdfPath = path.join(__dirname, `protected_merged_${Date.now()}.pdf`);
            const command = `"${qpdfPath}" "${mergedPdfPath}" --encrypt ${password} ${password} 256 -- "${protectedPdfPath}"`;
            log(`Intentando proteger el PDF con contraseña: ${password}`);
            console.log('Executing command:', command);

            // Ejecutar el comando qpdf
            exec(command, (err) => {
                if (err) {
                    console.error('Error al proteger el PDF:', err);
                    log(`Error al proteger el PDF: ${err.message}`);
                    fs.appendFileSync(path.join(logDirectory, 'errors.log'), `Error al proteger el PDF: ${err.message}\n`);
                    return res.status(500).send('Error al proteger el PDF.');
                }
                log(`Protección del PDF completada, para los archivos: ${req.files.map(file => file.originalname).join(', ')}, Con la clave: ${password},   ${protectedPdfPath}`);
                // Descargar PDF protegido
                res.download(protectedPdfPath, (err) => {
                    if (err) log(`Error al enviar el PDF protegido: ${err.message}`);
                    if (err) console.error('Error al enviar el PDF:', err);

                    // Eliminar archivos temporales
                    fs.unlinkSync(mergedPdfPath);
                    fs.unlinkSync(protectedPdfPath);
                });
            });
        } else {
            // Si no se proporciona contraseña, simplemente devolver el PDF unificado
            log(`PDF generado sin contraseña para los archivos: ${req.files.map(file => file.originalname).join(', ')}`);
            res.download(mergedPdfPath, (err) => {
                if (err) console.error('Error al enviar el PDF:', err);
                
                if (err) log(`Error al enviar el PDF unificado: ${err.message}`);

                // Eliminar archivos temporales
                fs.unlinkSync(mergedPdfPath);
            });
        }
    } catch (error) {
        console.error('Error al unificar o proteger los PDFs:', error);
        log(`Error al unificar o proteger los PDFs: ${error.message}`);
        fs.appendFileSync(path.join(logDirectory, 'errors.log'), `Error al unificar o proteger los PDFs: ${error.message}\nStack: ${error.stack}\n`);
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
