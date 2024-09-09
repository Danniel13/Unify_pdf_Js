const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ruta completa al ejecutable qpdf
const qpdfPath = 'C:\\ProgramData\\chocolatey\\bin\\qpdf.exe'; // Ajusta esta ruta según tu instalación

// Sirve archivos estáticos desde el directorio raíz del proyecto
app.use(express.static(__dirname));

// Ruta para cargar el formulario   
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index1.html'));
});

// Ruta para manejar la subida del PDF y agregar la contraseña
app.post('/protect', upload.single('pdfFile'), (req, res) => {
    const pdfPath = req.file.path;
    const password = req.body.password;
    const protectedPdfPath = path.join(__dirname, `protected_${req.file.originalname}`);

    // Escapa las barras invertidas en las rutas
    const escapedPdfPath = pdfPath.replace(/\\/g, '\\\\');
    const escapedProtectedPdfPath = protectedPdfPath.replace(/\\/g, '\\\\');

    // Construir el comando qpdf con la ruta completa
    const command = `"${qpdfPath}" "${escapedPdfPath}" --encrypt ${password} ${password} 256 -- "${escapedProtectedPdfPath}"`;

    console.log('Comando qpdf:', command); // Imprime el comando para depuración

    // Ejecutar el comando qpdf
    exec(command, (err) => {
        if (err) {
            console.error('Error al proteger el PDF:', err);
            return res.status(500).send('Error al proteger el PDF.');
        }

        // Enviar el PDF protegido como descarga
        res.download(protectedPdfPath, (err) => {
            if (err) {
                console.error('Error al enviar el PDF:', err);
            }

            // Eliminar archivos temporales
            fs.unlinkSync(pdfPath);
            fs.unlinkSync(protectedPdfPath);
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
