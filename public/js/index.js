document.addEventListener("DOMContentLoaded", function() {
    // Muestra clave
    window.handleClick = function handleClick(cb) {
        if (cb.checked)
            $('#passwordInput').attr("type", "text");
        else
            $('#passwordInput').attr("type", "password");
    }

    // Manejar selección de archivos PDF
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('mergeButton').addEventListener('click', mergePDFs);

    // Inicializar la lista ordenable usando Sortable.js
    const sortable = new Sortable(document.getElementById('fileList'), {
        animation: 150,
    });

    // Función para manejar la selección de archivos
    function handleFileSelect(event) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';  // Limpiar la lista previa
        const files = event.target.files;
        Array.from(files).forEach((file, index) => {
            const li = document.createElement('li');
            li.textContent = file.name;
            li.dataset.fileIndex = index;  // Guardar el índice del archivo
            fileList.appendChild(li);
        });
    }

    // Función para unir PDFs y protegerlos con contraseña
    async function mergePDFs(event) {
        const fileInput = document.getElementById('fileInput');
        const passwordInput = document.getElementById('passwordInput');
        const files = fileInput.files;

        if (files.length === 0) {
            alert('No se han seleccionado archivos');
            return;
        }

        const fileList = document.getElementById('fileList');
        const orderedIndices = Array.from(fileList.children).map(li => li.dataset.fileIndex);  // Obtener el orden de los archivos

        const formData = new FormData();
        // Añadir los archivos en el orden correcto al formData
        orderedIndices.forEach(index => formData.append('pdfFiles', files[index]));

        // Añadir la contraseña (si se introdujo) al formData
        if (passwordInput.value) {
            formData.append('password', passwordInput.value);
        }

        // Enviar los archivos y la contraseña al servidor para unir y proteger
        try {
            const response = await fetch('http://localhost:3000/api/pdf/unify', {  // endpoint
                method: 'POST',
                body: formData
            });


            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                // Crear y hacer clic en un enlace para descargar el PDF protegido
                const link = document.createElement('a');
                link.href = url;
                link.download = 'protected_merged.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                alert('PDF unificado y protegido descargado correctamente.');
                window.location.href = "index.html";
            } else {
                alert('Hubo un problema al unificar o proteger los PDFs.');
            }
        } catch (error) {
            console.error('Error al unificar o proteger PDFs:', error);
            alert('Hubo un error en el proceso.');
        }
    }
});
