import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailNotification {
  to: string
  subject: string
  formName: string
  submissionId: string
  submittedAt: string
  data: Record<string, any>
  pdfUrl?: string
}

export async function sendSubmissionNotification({
  to,
  subject,
  formName,
  submissionId,
  submittedAt,
  data,
  pdfUrl
}: EmailNotification) {
  try {
    const html = createSubmissionEmailHTML({
      formName,
      submissionId,
      submittedAt,
      data,
      pdfUrl
    })

    const { data: emailData, error } = await resend.emails.send({
      from: 'Formless <noreply@formless.app>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Email sending error:', error)
      throw error
    }

    return emailData
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendSubmitterConfirmation({
  to,
  formName,
  submissionId,
  submittedAt,
  data
}: Omit<EmailNotification, 'subject' | 'pdfUrl'>) {
  return sendSubmissionNotification({
    to,
    subject: `Thank you for submitting ${formName}`,
    formName,
    submissionId,
    submittedAt,
    data
  })
}

export async function sendAdminNotification({
  to,
  formName,
  submissionId,
  submittedAt,
  data,
  pdfUrl
}: EmailNotification) {
  return sendSubmissionNotification({
    to,
    subject: `New submission for ${formName}`,
    formName,
    submissionId,
    submittedAt,
    data,
    pdfUrl
  })
}

function createSubmissionEmailHTML({
  formName,
  submissionId,
  submittedAt,
  data,
  pdfUrl
}: Omit<EmailNotification, 'to' | 'subject'>) {
  const dataRows = Object.entries(data)
    .filter(([key, value]) => key !== 'submitter_email' && value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      const displayValue = typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No')
        : String(value)
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${displayValue}</td>
        </tr>
      `
    }).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Form Submission - ${formName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #1f2937; margin: 0 0 10px 0;">Form Submission Received</h1>
          <p style="color: #6b7280; margin: 0;">A new submission has been received for your form.</p>
        </div>
        
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0;">Form Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Form Name</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Submission ID</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${submissionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">Submitted At</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(submittedAt).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0;">Submission Data</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${dataRows}
          </table>
        </div>
        
        ${pdfUrl ? `
          <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0;">Download PDF</h2>
            <a href="${pdfUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: 500;">Download Completed Form</a>
          </div>
        ` : ''}
        
        <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
          <p>This email was sent by Formless - PDF to Digital Forms</p>
        </div>
      </body>
    </html>
  `
}