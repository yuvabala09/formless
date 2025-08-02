import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractFormFields } from '@/lib/ai-extraction'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    const fileName = `${userId}/${Date.now()}-${file.name}`
    const fileBuffer = await file.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('pdfs')
      .getPublicUrl(fileName)

    try {
      const extractedFields = await extractFormFields(fileBuffer)
      
      const { data: formData, error: formError } = await supabaseAdmin
        .from('forms')
        .insert({
          user_id: userId,
          name: file.name.replace('.pdf', ''),
          original_filename: file.name,
          pdf_url: urlData.publicUrl,
          schema: {
            id: crypto.randomUUID(),
            title: file.name.replace('.pdf', ''),
            fields: extractedFields,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })
        .select()
        .single()

      if (formError) {
        console.error('Database error:', formError)
        return NextResponse.json({ error: 'Failed to save form data' }, { status: 500 })
      }

      return NextResponse.json({ 
        formId: formData.id,
        message: 'File uploaded and processed successfully' 
      })

    } catch (aiError) {
      console.error('AI extraction error:', aiError)
      
      const { data: formData, error: formError } = await supabaseAdmin
        .from('forms')
        .insert({
          user_id: userId,
          name: file.name.replace('.pdf', ''),
          original_filename: file.name,
          pdf_url: urlData.publicUrl,
          schema: {
            id: crypto.randomUUID(),
            title: file.name.replace('.pdf', ''),
            fields: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        })
        .select()
        .single()

      if (formError) {
        console.error('Database error:', formError)
        return NextResponse.json({ error: 'Failed to save form data' }, { status: 500 })
      }

      return NextResponse.json({ 
        formId: formData.id,
        message: 'File uploaded but field extraction failed. You can add fields manually.',
        warning: 'AI extraction failed'
      })
    }

  } catch (error) {
    console.error('General error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}