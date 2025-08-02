import crypto from 'crypto'

export function encryptSensitiveData(data: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  const algorithm = 'aes-256-gcm'
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipher(algorithm, encryptionKey)
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptSensitiveData(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  const algorithm = 'aes-256-gcm'
  
  const [ivHex, encrypted] = encryptedData.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  
  const decipher = crypto.createDecipher(algorithm, encryptionKey)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"']/g, '')
    .trim()
    .substring(0, 1000)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export interface AuditLogEntry {
  userId: string
  action: string
  resource: string
  resourceId: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  details?: Record<string, any>
}

export async function logAuditEvent(entry: AuditLogEntry) {
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    hash: hashData(`${entry.userId}:${entry.action}:${entry.resourceId}:${entry.timestamp}`)
  }
  
  console.log('Audit Log:', JSON.stringify(logEntry))
  
  return logEntry
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024
  const allowedTypes = ['application/pdf']
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF files are allowed' }
  }
  
  return { valid: true }
}

export function rateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${identifier}:${action}`
}

export class RateLimiter {
  private static instance: RateLimiter
  private requests: Map<string, { count: number; resetTime: number }>
  
  constructor() {
    this.requests = new Map()
  }
  
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter()
    }
    return RateLimiter.instance
  }
  
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = this.requests.get(key)
    
    if (!entry || now > entry.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (entry.count >= limit) {
      return false
    }
    
    entry.count++
    return true
  }
}