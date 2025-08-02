import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
import { FormField } from '@/types'

export interface FormData {
  [fieldId: string]: string | boolean | string[]
}

// Generate a filled PDF using pdf-lib
export async function generateFilledPDF(
  originalPdfBuffer: ArrayBuffer,
  formFields: FormField[],
  formData: FormData
): Promise<Uint8Array> {
  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(originalPdfBuffer)
    const form = pdfDoc.getForm()

    // Fill the form fields based on the extracted fields and user data
    formFields.forEach((field) => {
      const value = formData[field.id]
      if (value === undefined || value === null) return

      try {
        switch (field.type) {
          case 'text':
          case 'email':
          case 'phone':
          case 'textarea':
            const textField = form.getTextField(field.id)
            textField.setText(String(value))
            break

          case 'checkbox':
            const checkbox = form.getCheckBox(field.id)
            if (value === true || value === 'true') {
              checkbox.check()
            } else {
              checkbox.uncheck()
            }
            break

          case 'radio':
            const radioGroup = form.getRadioGroup(field.id)
            if (typeof value === 'string') {
              radioGroup.select(value)
            }
            break

          case 'select':
            const dropdown = form.getDropdown(field.id)
            if (typeof value === 'string') {
              dropdown.select(value)
            }
            break

          case 'date':
            const dateField = form.getTextField(field.id)
            dateField.setText(String(value))
            break

          case 'signature':
            // For signature fields, we'd typically embed an image
            // For now, just add text placeholder
            const sigField = form.getTextField(field.id)
            sigField.setText('[Signature]')
            break
        }
      } catch (fieldError) {
        console.warn(`Could not fill field ${field.id}:`, fieldError)
        // Continue with other fields even if one fails
      }
    })

    // Flatten the form to prevent further editing
    form.flatten()

    // Save the PDF
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate filled PDF')
  }
}

// Create a new PDF form from scratch based on extracted fields
export async function createNewPDFForm(formFields: FormField[]): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Standard letter size
    const form = pdfDoc.getForm()
    
    const { width, height } = page.getSize()
    let yPosition = height - 100 // Start from top with margin

    formFields.forEach((field, index) => {
      const fieldHeight = 25
      const labelHeight = 15
      const spacing = 40

      // Add field label
      page.drawText(field.label + (field.required ? ' *' : ''), {
        x: 50,
        y: yPosition,
        size: 12,
      })

      yPosition -= labelHeight + 5

      // Add form field based on type
      switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'date':
          const textField = form.createTextField(field.id)
          textField.addToPage(page, {
            x: 50,
            y: yPosition - fieldHeight,
            width: 300,
            height: fieldHeight,
          })
          if (field.placeholder) {
            textField.setText(field.placeholder)
          }
          break

        case 'textarea':
          const textareaField = form.createTextField(field.id)
          textareaField.addToPage(page, {
            x: 50,
            y: yPosition - fieldHeight * 2,
            width: 400,
            height: fieldHeight * 2,
          })
          textareaField.enableMultiline()
          if (field.placeholder) {
            textareaField.setText(field.placeholder)
          }
          yPosition -= fieldHeight // Extra space for textarea
          break

        case 'checkbox':
          const checkbox = form.createCheckBox(field.id)
          checkbox.addToPage(page, {
            x: 50,
            y: yPosition - fieldHeight,
            width: 15,
            height: 15,
          })
          break

        case 'radio':
          if (field.options && field.options.length > 0) {
            const radioGroup = form.createRadioGroup(field.id)
            field.options.forEach((option, optionIndex) => {
              radioGroup.addOptionToPage(option, page, {
                x: 50 + (optionIndex * 100),
                y: yPosition - fieldHeight,
                width: 15,
                height: 15,
              })
              page.drawText(option, {
                x: 70 + (optionIndex * 100),
                y: yPosition - fieldHeight + 2,
                size: 10,
              })
            })
          }
          break

        case 'select':
          if (field.options && field.options.length > 0) {
            const dropdown = form.createDropdown(field.id)
            dropdown.addToPage(page, {
              x: 50,
              y: yPosition - fieldHeight,
              width: 200,
              height: fieldHeight,
            })
            dropdown.addOptions(field.options)
          }
          break

        case 'signature':
          const sigField = form.createTextField(field.id)
          sigField.addToPage(page, {
            x: 50,
            y: yPosition - fieldHeight,
            width: 300,
            height: fieldHeight,
          })
          page.drawText('(Digital Signature)', {
            x: 360,
            y: yPosition - fieldHeight + 8,
            size: 10,
          })
          break
      }

      yPosition -= spacing

      // Add new page if we're running out of space
      if (yPosition < 100 && index < formFields.length - 1) {
        const newPage = pdfDoc.addPage([612, 792])
        yPosition = height - 100
      }
    })

    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('PDF creation error:', error)
    throw new Error('Failed to create PDF form')
  }
}
