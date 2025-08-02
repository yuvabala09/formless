import { FormField, FieldType } from '@/types'
import { extractTextFromImage, extractTextFromPDF } from './ocr-service'

// Simple client-side form field extraction using pattern matching
// This is a fallback when AI extraction is not available
function extractFieldsWithPatterns(text: string): FormField[] {
  const fields: FormField[] = [];
  
  // Common form field patterns
  const patterns: Array<{
    type: FieldType;
    regex: RegExp;
    id: string;
    label: string;
  }> = [
    { type: 'text', regex: /(?:name|full name|first name|last name)\s*[:\-]?\s*$/i, id: 'name', label: 'Full Name' },
    { type: 'email', regex: /(?:email|e[- ]?mail)\s*[:\-]?\s*$/i, id: 'email', label: 'Email' },
    { type: 'tel', regex: /(?:phone|telephone|mobile|cell|phone number)\s*[:\-]?\s*$/i, id: 'phone', label: 'Phone Number' },
    { type: 'date', regex: /(?:date|dob|date of birth)\s*[:\-]?\s*$/i, id: 'date', label: 'Date' },
    { type: 'textarea', regex: /(?:address|street|city|state|zip|postal code|country)\s*[:\-]?\s*$/i, id: 'address', label: 'Address' },
    { type: 'text', regex: /(?:company|organization|employer)\s*[:\-]?\s*$/i, id: 'company', label: 'Company' },
    { type: 'text', regex: /(?:title|position|job title)\s*[:\-]?\s*$/i, id: 'title', label: 'Job Title' },
  ];

  // Split text into lines and look for field patterns
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    for (const pattern of patterns) {
      if (pattern.regex.test(trimmed)) {
        // Check if we already have this field
        if (!fields.some(f => f.id === pattern.id)) {
          fields.push({
            id: pattern.id,
            type: pattern.type as any,
            label: pattern.label,
            required: false,
            value: ''
          });
        }
        break;
      }
    }
  }

  // If no fields found, add some common ones as a fallback
  if (fields.length === 0) {
    return [
      { id: 'name', type: 'text' as FieldType, label: 'Full Name', required: false, value: '' },
      { id: 'email', type: 'email' as FieldType, label: 'Email', required: false, value: '' },
      { id: 'phone', type: 'tel' as FieldType, label: 'Phone', required: false, value: '' },
    ];
  }

  return fields;
}

// Unified extraction service using client-side OCR and pattern matching
export async function extractFormFields(
  file: File | Blob,
  onProgress?: (progress: number, status: string) => void
): Promise<FormField[]> {
  try {
    onProgress?.(0, 'Extracting text...');
    
    // Step 1: Extract text using client-side OCR
    let extractedText: string;
    const isPDF = file.type === 'application/pdf';
    
    try {
      if (isPDF) {
        onProgress?.(10, 'Processing PDF...');
        extractedText = await extractTextFromPDF(file, (progress) => {
          onProgress?.(10 + progress * 0.8, `Processing page ${progress}%`);
        });
      } else {
        onProgress?.(10, 'Processing image...');
        extractedText = await extractTextFromImage(file, (progress) => {
          onProgress?.(10 + progress * 0.8, `Extracting text ${progress}%`);
        });
      }
      
      onProgress?.(90, 'Analyzing form fields...');
      
      // Step 2: Extract fields using pattern matching
      const fields = extractFieldsWithPatterns(extractedText);
      
      onProgress?.(100, 'Done!');
      return fields;
      
    } catch (error) {
      console.error('Text extraction failed:', error);
      throw new Error('Failed to extract text from the document');
    }
  } catch (error) {
    console.error('Form field extraction failed:', error);
    throw new Error('Failed to process the document. Please try another file.');
  }
}

function generateSampleFields(): FormField[] {
  return [
    {
      id: 'full_name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name'
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Enter your email'
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      required: false,
      placeholder: 'Enter your phone number'
    },
    {
      id: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      required: true
    },
    {
      id: 'address',
      label: 'Address',
      type: 'textarea',
      required: false,
      placeholder: 'Enter your full address'
    },
    {
      id: 'emergency_contact',
      label: 'Emergency Contact',
      type: 'text',
      required: false,
      placeholder: 'Emergency contact name'
    },
    {
      id: 'signature',
      label: 'Signature',
      type: 'signature',
      required: true
    }
  ]
}
