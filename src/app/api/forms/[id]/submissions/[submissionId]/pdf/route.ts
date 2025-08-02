import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateCompletedPDF } from '@/lib/pdf-fill'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    const { userId } = await auth()
    const { id: formId, submissionId } = params

    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (form.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('form_id', formId)
      .single()

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const pdfBytes = await generateCompletedPDF(
      form.pdf_url,
      submission.data,
      form.schema.fields,
      form.schema.title
    )

    const fileName = `${form.name}-submission-${submissionId}.pdf`

    const filePath = `completed/${userId}/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('pdfs')
      .getPublicUrl(filePath)

    await supabaseAdmin
      .from('form_submissions')
      .update({ 
        completed_pdf_url: urlData.publicUrl,
        status: 'completed'
      })
      .eq('id', submissionId)

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}