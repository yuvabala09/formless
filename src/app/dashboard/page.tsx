import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Eye, Download } from 'lucide-react'
import Link from 'next/link'
import { UploadedForm } from '@/types'

async function getForms(userId: string): Promise<UploadedForm[]> {
  const { data, error } = await supabaseAdmin
    .from('forms')
    .select(`
      *,
      submissions:form_submissions(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching forms:', error)
    return []
  }

  return data.map(form => ({
    ...form,
    submissions_count: form.submissions[0]?.count || 0
  }))
}

export default async function Dashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const forms = await getForms(userId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Manage your forms and submissions</p>
          </div>
          <Link href="/dashboard/upload">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload New Form
            </Button>
          </Link>
        </div>

        {forms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No forms yet</CardTitle>
              <CardDescription className="mb-4">
                Upload your first PDF to get started
              </CardDescription>
              <Link href="/dashboard/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="truncate">{form.name}</CardTitle>
                  <CardDescription>
                    {form.submissions_count} submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/forms/${form.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/form/${form.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}