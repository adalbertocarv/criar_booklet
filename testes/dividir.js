const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;

async function createBlankPageWithText(pageNumber) {
    /**
     * Creates a blank page with text indicating the page number
     * @param {number} pageNumber - The page number to display
     * @returns {Promise<Uint8Array>} - The PDF bytes of the page
     */
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4 size in points
    const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
    
    page.setFont(helveticaFont);
    page.setFontSize(12);
    page.drawText(`Página em Branco - Página ${pageNumber}`, {
        x: 200,
        y: 400,
    });

    return await doc.save();
}

async function adjustToMultipleOf8(pdfDoc, totalPages) {
    /**
     * Adjusts the number of pages to be a multiple of 8 by adding blank pages
     * @param {PDFDocument} pdfDoc - The original PDF document
     * @param {number} totalPages - Total number of pages in the original document
     * @returns {Promise<PDFDocument>} - Adjusted PDF document
     */
    const adjustedDoc = await PDFDocument.create();
    
    // Copy all pages from original document
    const pages = await adjustedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach(page => adjustedDoc.addPage(page));
    
    // Add blank pages until total is multiple of 8
    while (adjustedDoc.getPageCount() % 8 !== 0) {
        const blankPageBytes = await createBlankPageWithText(adjustedDoc.getPageCount() + 1);
        const blankDoc = await PDFDocument.load(blankPageBytes);
        const [blankPage] = await adjustedDoc.copyPages(blankDoc, [0]);
        adjustedDoc.addPage(blankPage);
    }
    
    return adjustedDoc;
}

async function splitPDF(inputPath, outputPath1, outputPath2) {
    /**
     * Splits a PDF into two PDFs using the same custom logic for both parts
     * @param {string} inputPath - Path to the original PDF file
     * @param {string} outputPath1 - Path to save the first PDF
     * @param {string} outputPath2 - Path to save the second PDF
     */
    try {
        // Read the original PDF
        const pdfBytes = await fs.readFile(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Adjust to multiple of 8
        const adjustedDoc = await adjustToMultipleOf8(pdfDoc, pdfDoc.getPageCount());
        const totalPages = adjustedDoc.getPageCount();
        
        // Create new documents for each half
        const doc1 = await PDFDocument.create();
        const doc2 = await PDFDocument.create();
        
        let left = 0;
        let right = totalPages - 1;
        const half = Math.floor(totalPages / 2);
        let pageCounter = 0;
        
        // Create first PDF with the logic
        while (pageCounter < half) {
            if (pageCounter < half) {
                const [page] = await doc1.copyPages(adjustedDoc, [right]);
                doc1.addPage(page);
                right--;
                pageCounter++;
            }
            if (pageCounter < half) {
                const [page] = await doc1.copyPages(adjustedDoc, [left]);
                doc1.addPage(page);
                left++;
                pageCounter++;
            }
            if (pageCounter < half) {
                const [page] = await doc1.copyPages(adjustedDoc, [left]);
                doc1.addPage(page);
                left++;
                pageCounter++;
            }
            if (pageCounter < half) {
                const [page] = await doc1.copyPages(adjustedDoc, [right]);
                doc1.addPage(page);
                right--;
                pageCounter++;
            }
        }
        
        // Create second PDF with the same logic
        while (left <= right) {
            if (left <= right) {
                const [page] = await doc2.copyPages(adjustedDoc, [right]);
                doc2.addPage(page);
                right--;
            }
            if (left <= right) {
                const [page] = await doc2.copyPages(adjustedDoc, [left]);
                doc2.addPage(page);
                left++;
            }
            if (left <= right) {
                const [page] = await doc2.copyPages(adjustedDoc, [left]);
                doc2.addPage(page);
                left++;
            }
            if (left <= right) {
                const [page] = await doc2.copyPages(adjustedDoc, [right]);
                doc2.addPage(page);
                right--;
            }
        }
        
        // Save both PDFs
        await fs.writeFile(outputPath1, await doc1.save());
        await fs.writeFile(outputPath2, await doc2.save());
        
        console.log('PDF split successfully!');
        console.log(`First PDF saved to: ${outputPath1}`);
        console.log(`Second PDF saved to: ${outputPath2}`);
        
    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
}

// Example usage
const inputPdf = 'javascript.pdf';
const firstPdf = 'first_pdf.pdf';
const secondPdf = 'second_pdf.pdf';

splitPDF(inputPdf, firstPdf, secondPdf);