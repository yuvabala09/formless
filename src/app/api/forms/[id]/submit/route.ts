import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSubmitterConfirmation, sendAdminNotification } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()

    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('*, users:user_id')
      .eq('id', id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    const submissionId = crypto.randomUUID()
    const submittedAt = new Date().toISOString()

    const { error: submitError } = await supabaseAdmin
      .from('form_submissions')
      .insert({
        id: submissionId,
        form_id: id,
        data: data,
        submitter_email: data.submitter_email || null,
        status: 'pending',
        submitted_at: submittedAt
      })

    if (submitError) {
      console.error('Submission error:', submitError)
      return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
    }

    try {
      if (data.submitter_email) {
        await sendSubmitterConfirmation({
          to: data.submitter_email,
          formName: form.name,
          submissionId,
          submittedAt,
          data
        })
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', form.user_id)
        .single()

      if (!userError && userData?.email) {
        await sendAdminNotification({
          to: userData.email,
          formName: form.name,
          submissionId,
          submittedAt,
          data,
          subject: `New submission for ${form.name}`
        })
      }
    } catch (emailError) {
      console.warn('Email notification failed:', emailError)
    }

    return NextResponse.json({ 
      message: 'Form submitted successfully',
      submissionId
    })

  } catch (error) {
    console.error('General error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}