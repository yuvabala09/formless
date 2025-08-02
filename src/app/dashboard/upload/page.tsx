'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useUser()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      toast.error('Please select a PDF file')
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setIsUploading(true)
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.id)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      toast.success('PDF uploaded successfully! Processing fields...')
      
      router.push(`/dashboard/forms/${result.formId}`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload PDF. Please try again.')
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload PDF Form</h1>
            <p className="text-gray-600">
              Upload your PDF document and we'll automatically extract form fields using AI
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select PDF File</CardTitle>
              <CardDescription>
                Choose a PDF form to convert into a digital form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="pdf-file"
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    {file ? (
                      <>
                        <FileText className="h-12 w-12 text-blue-600" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400" />
                        <div>
                          <p className="font-medium">Click to upload PDF</p>
                          <p className="text-sm text-gray-500">
                            or drag and drop your file here
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isProcessing ? 'Processing...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Process
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI will analyze your PDF and extract form fields</li>
                  <li>• Field types will be automatically detected</li>
                  <li>• You can review and edit the generated form</li>
                  <li>• Share the form link with others to collect responses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}