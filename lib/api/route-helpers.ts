import { z } from 'zod'

const UUID_SCHEMA = z.string().uuid()

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

function isPrivateIpv4(hostname: string): boolean {
  const segments = hostname.split('.')
  if (segments.length !== 4) return false

  const octets = segments.map(seg => Number(seg))
  if (octets.some(oct => Number.isNaN(oct) || oct < 0 || oct > 255)) return false

  const [a, b] = octets
  if (a === 10) return true
  if (a === 127) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 169 && b === 254) return true
  return false
}

function isPrivateIpv6(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')
}

export function parseUuidParam(
  value: string,
  paramName: string,
  options?: { allowPattern?: RegExp },
): { ok: true; value: string } | { ok: false; response: Response } {
  if (options?.allowPattern?.test(value)) {
    return { ok: true, value }
  }

  const parsed = UUID_SCHEMA.safeParse(value)
  if (!parsed.success) {
    return {
      ok: false,
      response: Response.json({ error: `Invalid ${paramName}` }, { status: 400 }),
    }
  }
  return { ok: true, value: parsed.data }
}

export function internalServerError(message = 'Internal server error'): Response {
  return Response.json({ error: message }, { status: 500 })
}

export function logServerError(message: string, error: unknown, meta?: Record<string, unknown>): void {
  console.error(message, {
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    ...(meta ?? {}),
  })
}

export function isSafeExternalMediaUrl(urlString: string): boolean {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return false
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false

  const hostname = url.hostname.toLowerCase()
  if (LOCAL_HOSTNAMES.has(hostname)) return false
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false
  if (isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) return false

  return true
}
