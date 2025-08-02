export interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'date' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'signature'
  required?: boolean
  placeholder?: string
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface FormSchema {
  id: string
  title: string
  description?: string
  fields: FormField[]
  created_at: string
  updated_at: string
}

export interface FormSubmission {
  id: string
  form_id: string
  data: Record<string, any>
  submitted_at: string
  submitter_email?: string
  status: 'pending' | 'completed' | 'archived'
}

export interface UploadedForm {
  id: string
  user_id: string
  name: string
  original_filename: string
  pdf_url: string
  schema: FormSchema
  public_url?: string
  created_at: string
  updated_at: string
  submissions_count: number
}