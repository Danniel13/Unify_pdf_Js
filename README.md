# Unify & Protect PDF with Node.js

This project allows users to unify multiple PDF files into one and optionally protect the resulting PDF with a password. It is built using Node.js, Express, and PDF-lib for handling PDF operations. The frontend is a simple HTML interface that allows users to upload PDFs, choose the order of unification, and set a password for protection.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Backend Code](#backend-code)
- [Frontend Code](#frontend-code)
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

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Danniel13/Unify_pdf_Js.git
   cd unify-protect-pdf

