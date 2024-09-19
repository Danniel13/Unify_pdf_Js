document.addEventListener("DOMContentLoaded", function(){
    // alert("hola mundo ")



    //Muestra clave
    window.handleClick = function handleClick(cb) {
        if(cb.checked)
            $('#passwordInput').attr("type","text");
        else
            $('#passwordInput').attr("type","password");
        }
        
        
        
                document.getElementById('fileInput').addEventListener('change', handleFileSelect);
                document.getElementById('mergeButton').addEventListener('click', mergePDFs);


                //Organiza PDF
                function handleFileSelect(event) {
                    const fileList = document.getElementById('fileList');
                    fileList.innerHTML = '';  // Clear previous list
                    const files = event.target.files;
                    Array.from(files).forEach((file, index) => {
                        const li = document.createElement('li');
                        li.textContent = file.name;
                        li.dataset.fileIndex = index;
                        fileList.appendChild(li);
                    });
        
                    // Initialize drag and drop
                    new Sortable(fileList, {
                        animation: 150,
                        onEnd: function(evt) {
                            const items = fileList.querySelectorAll('li');
                            items.forEach((item, index) => {
                                item.dataset.fileIndex = index;
                            });
                        }
                    });
                }
                //Unfifica
                async function mergePDFs(event) {
                    const fileInput = document.getElementById('fileInput');
                    const fileList = document.getElementById('fileList');
                    const passwordInput = document.getElementById('passwordInput');
                    const files = fileInput.files;
        
                    if (files.length === 0) {
                        alert('No se han seleccionado archivos');
                        return;
                    }
        
                    const formData = new FormData();
                    const fileOrder = Array.from(fileList.children)
                        .map(li => parseInt(li.dataset.fileIndex));
        
                    // Añadir el orden de los archivos al formData
                    formData.append('fileOrder', JSON.stringify(fileOrder));
        
                    // Añadir los archivos seleccionados al formData en el orden correcto
                    fileOrder.forEach(index => formData.append('pdfFiles', files[index]));
        
                    // Añadir la contraseña (si se introdujo) al formData
                    if (passwordInput.value) {
                        formData.append('password', passwordInput.value);
                    }
        
                    // Enviar los archivos y la contraseña al servidor para unir y proteger
                    try {
                        const response = await fetch('/unify-protect', {
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
                            location.href ='index.html';
                        } else {
                            alert('Hubo un problema al unificar o proteger los PDFs.');
                        }
                    } catch (error) {
                        console.error('Error al unificar o proteger PDFs:', error);
                        alert('Hubo un error en el proceso.');
                    }
                }
            
})
//     $('#passwordInput').on("mousedown",function(event) {
// $(this).attr("type","text");
// });

// $('#passwordInput').on("mouseup",function(event) {
// $('#passwordInput').attr("type","password");
// });
