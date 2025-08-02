# Formless - PDF to Digital Forms

Transform your PDF documents into interactive, mobile-friendly digital forms with AI-powered field extraction.

## 🚀 Features

- **PDF Upload & AI Extraction**: Upload any PDF form and let AI automatically extract form fields
- **Smart Form Generation**: Generate responsive web forms from extracted JSON schema
- **Mobile-Friendly**: Forms work perfectly on any device
- **PDF Filling**: Automatically fill original PDFs with submitted data using pdf-lib
- **Submission Management**: Track all form submissions with a comprehensive dashboard
- **Email Notifications**: Automatic email notifications for form submissions
- **Security & Compliance**: HIPAA/FERPA ready with encrypted storage and audit trails

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, ShadCN UI, React Hook Form
- **AI/OCR**: OpenAI GPT-4o for field extraction
- **PDF Processing**: pdf-lib for filling PDFs
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for PDF files
- **Authentication**: Clerk
- **Email**: Resend
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Clerk account and application
- An OpenAI API key
- A Resend account (for email notifications)

## 🔧 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.local .env.local
   ```

   Required environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Resend
   RESEND_API_KEY=your_resend_api_key

   # Security (optional)
   ENCRYPTION_KEY=your_encryption_key
   ```

3. **Set up the database**
   
   In your Supabase project, run the SQL from `supabase/schema.sql` to create the necessary tables and policies.

4. **Configure Clerk**
   
   In your Clerk dashboard:
   - Set up your application
   - Configure sign-in/sign-up options
   - Add your domain to allowed origins

5. **Configure Supabase Storage**
   
   In your Supabase project:
   - Create a storage bucket named "pdfs"
   - Set up the storage policies as defined in the schema

## 🚀 Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   ├── form/             # Public form pages
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   └── DynamicForm.tsx   # Main form component
├── lib/                  # Utility functions
│   ├── ai-extraction.ts  # AI field extraction
│   ├── pdf-fill.ts       # PDF filling logic
│   ├── email.ts          # Email notifications
│   ├── security.ts       # Security utilities
│   └── supabase.ts       # Supabase client
├── types/                # TypeScript type definitions
└── middleware.ts         # Clerk middleware
```

## 🔒 Security Features

- **Authentication**: Clerk-based authentication with role-based access
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Data Encryption**: Sensitive data encryption capabilities
- **Audit Logging**: Comprehensive audit trail for all actions
- **Input Validation**: Sanitization and validation of all user inputs
- **File Validation**: Strict file type and size validation for uploads

## 📧 Email Notifications

The application automatically sends email notifications:

- **Submitter Confirmation**: Sent to form submitters upon successful submission
- **Admin Notification**: Sent to form owners when new submissions are received

Email templates are HTML-based and mobile-responsive.

## 🔄 AI Field Extraction

The AI extraction system:

1. Processes uploaded PDF files
2. Uses GPT-4o to identify form fields
3. Extracts field labels, types, and validation rules
4. Generates structured JSON schema for form rendering

Supported field types:
- Text input
- Email
- Phone
- Date
- Checkbox
- Radio buttons
- Select dropdowns
- Textarea
- Signature

## 📱 Form Features

Generated forms include:
- Responsive design for all devices
- Real-time validation
- Required field indicators
- Signature capture
- Automatic form submission
- PDF generation with filled data

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🎯 How It Works

1. **Upload PDF**: Users upload their PDF forms through the dashboard
2. **AI Extraction**: GPT-4o analyzes the PDF and extracts form fields
3. **Form Generation**: Dynamic forms are created from the extracted schema
4. **Public Sharing**: Forms are shared via unique URLs
5. **Data Collection**: Submissions are stored and can be exported as filled PDFs
6. **Notifications**: Email notifications keep everyone informed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ for small clinics, schools, nonprofits, and local offices
