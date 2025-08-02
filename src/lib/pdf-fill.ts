import { PDFDocument, PDFTextField, PDFCheckBox, PDFForm, rgb } from 'pdf-lib'
import { FormField } from '@/types'

export async function fillPDF(
  originalPdfUrl: string,
  formData: Record<string, any>,
  fields: FormField[]
): Promise<Uint8Array> {
  try {
    const response = await fetch(originalPdfUrl)
    const pdfBytes = await response.arrayBuffer()
    
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const form = pdfDoc.getForm()
    
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    
    for (const field of fields) {
      const value = formData[field.id]
      
      if (value === undefined || value === null || value === '') {
        continue
      }

      try {
        if (field.type === 'checkbox') {
          try {
            const checkBox = form.getCheckBox(field.id)
            if (value === true) {
              checkBox.check()
            }
          } catch {
            if (value === true) {
              firstPage.drawText('✓', {
                x: field.position?.x || 50,
                y: field.position?.y || 700,
                size: 12,
                color: rgb(0, 0, 0),
              })
            }
          }
        } else {
          try {
            const textField = form.getTextField(field.id)
            textField.setText(String(value))
          } catch {
            firstPage.drawText(String(value), {
              x: field.position?.x || 50,
              y: field.position?.y || 700,
              size: 10,
              color: rgb(0, 0, 0),
            })
          }
        }
      } catch (fieldError) {
        console.warn(`Could not fill field ${field.id}:`, fieldError)
        
        firstPage.drawText(`${field.label}: ${String(value)}`, {
          x: 50,
          y: 700 - (fields.indexOf(field) * 20),
          size: 10,
          color: rgb(0, 0, 0),
        })
      }
    }

    form.flatten()
    
    return await pdfDoc.save()
  } catch (error) {
    console.error('Error filling PDF:', error)
    throw new Error('Failed to fill PDF')
  }
}

export async function generateCompletedPDF(
  originalPdfUrl: string,
  formData: Record<string, any>,
  fields: FormField[],
  formTitle: string
): Promise<Uint8Array> {
  try {
    return await fillPDF(originalPdfUrl, formData, fields)
  } catch (error) {
    console.error('Error generating completed PDF:', error)
    
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792])
    
    page.drawText(formTitle, {
      x: 50,
      y: 750,
      size: 16,
      color: rgb(0, 0, 0),
    })
    
    page.drawText('Form Submission', {
      x: 50,
      y: 720,
      size: 14,
      color: rgb(0, 0, 0),
    })
    
    let yPosition = 680
    for (const field of fields) {
      const value = formData[field.id]
      if (value !== undefined && value !== null && value !== '') {
        page.drawText(`${field.label}: ${String(value)}`, {
          x: 50,
          y: yPosition,
          size: 10,
          color: rgb(0, 0, 0),
        })
        yPosition -= 20
      }
    }
    
    page.drawText(`Submitted: ${new Date().toLocaleString()}`, {
      x: 50,
      y: yPosition - 40,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    return await pdfDoc.save()
  }
}