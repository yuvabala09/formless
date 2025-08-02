import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, ArrowLeft, Calendar, Mail } from 'lucide-react'
import Link from 'next/link'
import { FormSubmission, UploadedForm } from '@/types'

async function getSubmissionDetails(formId: string, submissionId: string, userId: string) {
  const { data: form, error: formError } = await supabaseAdmin
    .from('forms')
    .select('*')
    .eq('id', formId)
    .eq('user_id', userId)
    .single()

  if (formError || !form) {
    return null
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('form_submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('form_id', formId)
    .single()

  if (submissionError || !submission) {
    return null
  }

  return { form, submission }
}

export default async function SubmissionDetails({ 
  params 
}: { 
  params: { id: string; submissionId: string } 
}) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const data = await getSubmissionDetails(params.id, params.submissionId, userId)

  if (!data) {
    notFound()
  }

  const { form, submission } = data

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Form Submission</h1>
              <p className="text-gray-600">{form.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/forms/${form.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Form
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/api/forms/${form.id}/submissions/${submission.id}/pdf`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {new Date(submission.submitted_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitter</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium">
                  {submission.submitter_email || 'Anonymous'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(submission.status)}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submission Data</CardTitle>
            <CardDescription>
              All field values submitted in this form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {form.schema.fields.map((field) => {
                const value = submission.data[field.id]
                const displayValue = field.type === 'checkbox' 
                  ? (value ? 'Yes' : 'No')
                  : (value || 'Not provided')

                return (
                  <div key={field.id} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{field.label}</h3>
                        <p className="text-sm text-gray-500 capitalize">{field.type}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-gray-900">{displayValue}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}