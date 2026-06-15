// BackEnd/MSA/utils/docxToPdf.js
// SIMPLIFIED - MINIMAL DEPENDENCIES

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const { promisify } = require('util');
const mammoth = require('mammoth');
const PDFDocument = require('pdfkit');

const execAsync = promisify(exec);

/**
 * Convert DOCX to PDF using LibreOffice command line
 * LibreOffice must be installed on the system
 */
async function convertDocxToPdfLibreOffice(docxPath, outputPdfPath) {
  return new Promise((resolve, reject) => {
    try {
      // Check if input file exists
      if (!fs.existsSync(docxPath)) {
        throw new Error(`Input file not found: ${docxPath}`);
      }

      console.log(`📄 Converting DOCX to PDF using LibreOffice...`);
      console.log(`Input: ${docxPath}`);

      // Command to convert DOCX to PDF using libreoffice
      const outputDir = path.dirname(outputPdfPath);
      const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;

      const timeout = setTimeout(() => {
        reject(new Error('LibreOffice conversion timeout (30 seconds)'));
      }, 30000);

      exec(command, (error, stdout, stderr) => {
        clearTimeout(timeout);

        if (error) {
          console.error('❌ LibreOffice conversion error:', error.message);
          reject(new Error(`Conversion failed: ${error.message}`));
          return;
        }

        // LibreOffice outputs the PDF with same name as input
        const generatedPdfPath = docxPath.replace(/\.(docx|doc)$/i, '.pdf');

        if (fs.existsSync(generatedPdfPath)) {
          // Move to desired output path if different
          if (generatedPdfPath !== outputPdfPath) {
            try {
              fs.renameSync(generatedPdfPath, outputPdfPath);
            } catch (renameError) {
              console.warn('⚠️ Could not rename file, copying instead...');
              fs.copyFileSync(generatedPdfPath, outputPdfPath);
              try {
                fs.unlinkSync(generatedPdfPath);
              } catch (unlinkError) {
                console.warn('⚠️ Could not delete temp file');
              }
            }
          }
          console.log(`✅ PDF created successfully: ${outputPdfPath}`);
          resolve(outputPdfPath);
        } else {
          reject(new Error(`PDF file was not created by LibreOffice`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Fallback: Convert DOCX to HTML then to PDF
 */
async function convertDocxToPdfViaMammoth(docxPath, outputPdfPath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`📄 Converting DOCX to PDF via Mammoth (fallback method)...`);

      // Read DOCX and convert to HTML
      const docxBuffer = fs.readFileSync(docxPath);
      const result = await mammoth.convertToHtml({ buffer: docxBuffer });

      const htmlContent = result.value;

      // Create simple PDF from HTML using PDFKit
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const writeStream = fs.createWriteStream(outputPdfPath);
      doc.pipe(writeStream);

      // Add basic styling and content
      doc.font('Helvetica', 12);
      doc.fontSize(12);

      // Simple HTML text extraction and PDF writing
      const textContent = htmlContent.replace(/<[^>]*>/g, '');
      const lines = textContent.split('\n');

      let currentY = doc.y;
      const pageHeight = doc.page.height;
      const bottomMargin = 40;

      for (const line of lines) {
        if (currentY + 20 > pageHeight - bottomMargin) {
          doc.addPage();
          currentY = 40;
        }

        if (line.trim()) {
          doc.text(line, { width: 500 });
        }
        currentY = doc.y;
      }

      doc.end();

      writeStream.on('finish', () => {
        console.log(`✅ PDF created successfully: ${outputPdfPath}`);
        resolve(outputPdfPath);
      });

      writeStream.on('error', (err) => {
        reject(new Error(`Failed to write PDF: ${err.message}`));
      });
    } catch (error) {
      reject(new Error(`Mammoth conversion failed: ${error.message}`));
    }
  });
}

/**
 * Main conversion function - tries LibreOffice first, falls back to Mammoth
 */
async function convertDocxToPdf(docxPath, outputPdfPath) {
  try {
    // Validate input file
    if (!fs.existsSync(docxPath)) {
      throw new Error(`Input file not found: ${docxPath}`);
    }

    const fileExtension = path.extname(docxPath).toLowerCase();
    if (!['.docx', '.doc'].includes(fileExtension)) {
      throw new Error(`Invalid file type. Expected .docx or .doc, got ${fileExtension}`);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPdfPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`=== DOCX to PDF Conversion ===`);
    console.log(`Input: ${docxPath}`);
    console.log(`Output: ${outputPdfPath}`);

    try {
      // Try LibreOffice first (best quality)
      return await convertDocxToPdfLibreOffice(docxPath, outputPdfPath);
    } catch (libreError) {
      console.warn(`⚠️ LibreOffice conversion failed, trying fallback method...`);
      console.warn(`Error: ${libreError.message}`);

      // Fallback to Mammoth method
      try {
        return await convertDocxToPdfViaMammoth(docxPath, outputPdfPath);
      } catch (mammothError) {
        throw new Error(`Both conversion methods failed. LibreOffice: ${libreError.message}, Mammoth: ${mammothError.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Conversion error: ${error.message}`);
    throw error;
  }
}

/**
 * Get file size for validation
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Cannot get file size: ${error.message}`);
  }
}

/**
 * Validate DOCX file format
 */
async function validateDocxFile(filePath) {
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    return result.value ? true : false;
  } catch (error) {
    return false;
  }
}

module.exports = {
  convertDocxToPdf,
  convertDocxToPdfLibreOffice,
  convertDocxToPdfViaMammoth,
  getFileSize,
  validateDocxFile
};