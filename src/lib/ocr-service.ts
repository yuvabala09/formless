import { createWorker, PSM } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
// @ts-ignore - pdf.js types are a bit wonky with workers
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Simple type for text items from PDF.js
interface TextItem {
  str: string;
}

// Simple worker initialization with minimal configuration
async function createTesseractWorker(onProgress?: (progress: number) => void) {
  // Create worker with minimal configuration
  const worker = await createWorker();
  
  // Set up progress reporting if callback is provided
  if (onProgress) {
    // @ts-ignore - progress reporting is available but not in types
    worker.onProgress = (m) => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100));
      }
    };
  }
  
  // Initialize with English language
  await worker.load();
  // Use reinitialize instead of initialize as it's the correct method name
  await worker.reinitialize('eng');
  
  return worker;
}

/**
 * Extracts text from an image using client-side Tesseract.js
 * @param imageFile - File or Blob containing the image
 * @param onProgress - Optional progress callback
 * @returns Extracted text from the image
 */
export async function extractTextFromImage(
  imageFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createTesseractWorker(onProgress);

  try {
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(imageFile);
    return text?.trim() || '';
  } catch (error) {
    console.error('Client-side OCR failed:', error);
    throw new Error('Failed to extract text from image. Please try another image.');
  } finally {
    // Always terminate the worker to free up resources
    await worker.terminate();
  }
}

/**
 * Extracts text from a PDF using client-side Tesseract.js
 * @param pdfFile - File or Blob containing the PDF
 * @param onProgress - Optional progress callback
 * @returns Extracted text from the PDF
 */
export async function extractTextFromPDF(
  pdfFile: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Convert PDF to text using PDF.js
    const pdfUrl = URL.createObjectURL(pdfFile);
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    let fullText = '';
    
    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      let pageText = '';
      
      // Extract text from each text item
      textContent.items.forEach((item: unknown) => {
        const textItem = item as TextItem;
        if (textItem.str) {
          pageText += textItem.str + ' ';
        }
      });
      
      fullText += `\n\n--- Page ${i} ---\n${pageText.trim()}`;
      
      // Update progress between pages
      onProgress?.(Math.min(99, Math.floor((i / pdf.numPages) * 100)));
    }
    
    // Clean up object URL
    URL.revokeObjectURL(pdfUrl);
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    throw new Error('Failed to extract text from PDF. Please try another file.');
  }
}
