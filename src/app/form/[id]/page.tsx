'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import DynamicForm from '@/components/DynamicForm'
import { UploadedForm } from '@/types'
import { Loader2 } from 'lucide-react'

export default function PublicForm({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<UploadedForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchForm() {
      try {
        const response = await fetch(`/api/forms/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Form not found')
          } else {
            setError('Failed to load form')
          }
          return
        }
        const data = await response.json()
        setForm(data)
      } catch (err) {
        setError('Failed to load form')
      } finally {
        setLoading(false)
      }
    }

    fetchForm()
  }, [params.id])

  const handleSubmit = async (data: Record<string, any>) => {
    const response = await fetch(`/api/forms/${params.id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to submit form')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !form) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <DynamicForm 
          schema={form.schema} 
          onSubmit={handleSubmit}
          submitterEmail
        />
      </div>
    </div>
  )
}