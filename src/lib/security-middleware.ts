import { NextRequest } from 'next/server'
import { RateLimiter, rateLimitKey, logAuditEvent } from './security'

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || 'unknown'
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

export async function applyRateLimit(
  request: NextRequest,
  identifier: string,
  action: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
): Promise<boolean> {
  const rateLimiter = RateLimiter.getInstance()
  const key = rateLimitKey(identifier, action)
  
  return rateLimiter.isAllowed(key, limit, windowMs)
}

export async function logSecurityEvent(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  request: NextRequest,
  details?: Record<string, any>
) {
  await logAuditEvent({
    userId,
    action,
    resource,
    resourceId,
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    timestamp: new Date().toISOString(),
    details
  })
}

export function validateContentType(request: NextRequest, allowedTypes: string[]): boolean {
  const contentType = request.headers.get('content-type')
  
  if (!contentType) {
    return false
  }
  
  return allowedTypes.some(type => contentType.includes(type))
}