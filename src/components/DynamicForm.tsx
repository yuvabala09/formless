'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FormField, FormSchema } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField as UIFormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface DynamicFormProps {
  schema: FormSchema
  onSubmit: (data: Record<string, any>) => Promise<void>
  submitterEmail?: boolean
}

function createValidationSchema(fields: FormField[]) {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  fields.forEach((field) => {
    let validator: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        validator = z.string().email('Please enter a valid email address')
        break
      case 'phone':
        validator = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
        break
      case 'date':
        validator = z.string().min(1, 'Date is required')
        break
      case 'checkbox':
        validator = z.boolean()
        break
      case 'signature':
        validator = z.string().min(1, 'Signature is required')
        break
      default:
        validator = z.string()
    }

    if (field.required && field.type !== 'checkbox') {
      validator = validator.min(1, `${field.label} is required`)
    }

    if (field.validation) {
      if (field.validation.min && field.type === 'text') {
        validator = (validator as z.ZodString).min(field.validation.min, `Minimum ${field.validation.min} characters`)
      }
      if (field.validation.max && field.type === 'text') {
        validator = (validator as z.ZodString).max(field.validation.max, `Maximum ${field.validation.max} characters`)
      }
    }

    schemaObject[field.id] = validator
  })

  return z.object(schemaObject)
}

export default function DynamicForm({ schema, onSubmit, submitterEmail }: DynamicFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const validationSchema = createValidationSchema(schema.fields)
  
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: schema.fields.reduce((acc, field) => {
      acc[field.id] = field.type === 'checkbox' ? false : ''
      return acc
    }, {} as Record<string, any>)
  })

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      toast.success('Form submitted successfully!')
      form.reset()
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    return (
      <UIFormField
        key={field.id}
        control={form.control}
        name={field.id}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case 'textarea':
                    return (
                      <Textarea
                        placeholder={field.placeholder}
                        {...formField}
                        className="min-h-[80px]"
                      />
                    )
                  
                  case 'select':
                    return (
                      <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  
                  case 'radio':
                    return (
                      <RadioGroup onValueChange={formField.onChange} defaultValue={formField.value}>
                        {field.options?.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                            <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )
                  
                  case 'checkbox':
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          id={field.id}
                        />
                        <Label htmlFor={field.id} className="text-sm font-normal">
                          {field.placeholder || `I agree to ${field.label}`}
                        </Label>
                      </div>
                    )
                  
                  case 'signature':
                    return (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Type your full name as signature"
                          {...formField}
                        />
                        <p className="text-xs text-gray-500">
                          By typing your name, you agree this constitutes your electronic signature
                        </p>
                      </div>
                    )
                  
                  case 'date':
                    return (
                      <Input
                        type="date"
                        {...formField}
                      />
                    )
                  
                  case 'email':
                    return (
                      <Input
                        type="email"
                        placeholder={field.placeholder}
                        {...formField}
                      />
                    )
                  
                  case 'phone':
                    return (
                      <Input
                        type="tel"
                        placeholder={field.placeholder}
                        {...formField}
                      />
                    )
                  
                  default:
                    return (
                      <Input
                        type="text"
                        placeholder={field.placeholder}
                        {...formField}
                      />
                    )
                }
              })()}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
        {schema.description && (
          <CardDescription>{schema.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {schema.fields.map(renderField)}
            
            {submitterEmail && (
              <UIFormField
                control={form.control}
                name="submitter_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Email (for confirmation)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll send you a copy of your submission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Form'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}