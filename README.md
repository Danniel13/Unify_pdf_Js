# Unify & Protect PDF with Node.js

This project allows users to unify multiple PDF files into one and optionally protect the resulting PDF with a password. It is built using Node.js, Express, and PDF-lib for handling PDF operations. The frontend is a simple HTML interface that allows users to upload PDFs, choose the order of unification, and set a password for protection.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Backend Code](#backend-code)
- [Frontend Code](#frontend-code)
- [PDF Organization and Functionality](#pdf-organization-and-functionality)
- [Contributing](#contributing)
- [License](#license)

## Features

- Upload multiple PDF files.
- Reorder the PDF files before unification.
- Protect the unified PDF with a password.
- Logs for tracking requests and errors.

## Technologies Used

- **Node.js**: Server-side JavaScript runtime.
- **Express**: Web framework for Node.js.
- **Multer**: Middleware for handling multipart/form-data, used for uploading files.
- **PDF-lib**: Library for creating and manipulating PDF documents.
- **CORS**: Middleware for enabling Cross-Origin Resource Sharing.
- **Morgan**: HTTP request logger middleware for Node.js.
- **fs**: Node.js File System module for file operations.
- **child_process**: Node.js module for executing shell commands (e.g., for password protection).

## PDF Organization and Functionality

This project includes functionality to upload, unify, and protect PDF files using passwords. The following are the key features and how they work:

### Endpoints

- **GET /**: Serves the main HTML interface for uploading PDF files.
  
- **POST /api/pdf/unify**: 
  - **Description**: This endpoint accepts multiple PDF files and combines them into a single PDF. Optionally, a password can be provided to protect the unified PDF.
  - **Request Parameters**:
    - `pdfFiles`: An array of PDF files to be unified (up to 10 files).
    - `password` (optional): A string that serves as the password for protecting the unified PDF.
  - **Response**:
    - If a password is provided, the server returns the protected unified PDF for download.
    - If no password is provided, the server returns the unprotected unified PDF for download.

### How It Works

1. **File Upload**: Users can upload multiple PDF files through the provided HTML form.
2. **PDF Unification**: The backend receives the uploaded files and uses the `pdf-lib` library to merge them into a single PDF document.
3. **Password Protection**: If a password is specified, the `qpdf` command-line tool is invoked to encrypt the unified PDF using the provided password.
4. **Download**: After processing, the unified (and potentially protected) PDF is made available for download.

### File Handling

- Uploaded PDF files are temporarily stored in the `uploads/` directory.
- After processing, both the merged PDF and the protected PDF (if applicable) are also stored temporarily until they are downloaded.
- All temporary files are deleted after they are no longer needed to ensure efficient file management and to save storage space.

### Logging

The application includes detailed logging for various events such as:
- Successful uploads and PDF unifications.
- Errors encountered during the processing of PDFs.
- Access logs for tracking requests made to the server.

### Error Handling

The application implements error handling to catch and log any issues that arise during the upload, unification, or protection of PDF files, ensuring that users receive appropriate feedback and the server remains stable.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Danniel13/Unify_pdf_Js.git
   cd unify-protect-pdf


---

**By Danni_dev**