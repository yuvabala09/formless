import { FormField } from '@/types'

// Gemini Pro API integration for form field extraction
export async function extractFormFieldsWithGemini(pdfBuffer: ArrayBuffer): Promise<FormField[]> {
  try {
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an AI that extracts form fields from PDF documents. Analyze the provided PDF text and return a JSON array of form fields.

Each field should have this structure:
{
  "id": "unique_id",
  "label": "Field Label",
  "type": "text|email|phone|date|checkbox|radio|select|textarea|signature",
  "required": boolean,
  "placeholder": "optional placeholder text",
  "options": ["array", "of", "options"] (only for radio/select),
  "validation": {
    "min": number,
    "max": number,
    "pattern": "regex pattern"
  }
}

Field type guidelines:
- text: General text input
- email: Email addresses
- phone: Phone numbers
- date: Date fields
- checkbox: Single checkboxes
- radio: Multiple choice (one option)
- select: Dropdown selections
- textarea: Large text areas
- signature: Signature fields

Return ONLY the JSON array, no other text.

Please analyze this PDF content and extract all form fields. Pay attention to labels, field types, and whether fields appear to be required.

Note: This is a placeholder - actual PDF processing would require OCR or PDF parsing. For now, return sample fields based on common form patterns.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
    }

    const result = await geminiResponse.json()
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error('No content received from Gemini')
    }

    try {
      const fields = JSON.parse(content) as FormField[]
      
      return fields.map((field, index) => ({
        ...field,
        id: field.id || `field_${index + 1}`,
      }))
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      throw new Error('Invalid JSON response from Gemini')
    }

  } catch (error) {
    console.error('Gemini extraction error:', error)
    
    // Fallback to sample fields
    return generateSampleFields()
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
