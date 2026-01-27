import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'dev-secret-change-in-production'
const JWT_EXPIRY = 24 * 60 * 60

interface GenerateTokenRequest {
  userId: string
  role: string
  deviceId: string
}

// Simple base64url encode without external deps
function base64url(buf: Uint8Array): string {
  let result = ''
  for (let i = 0; i < buf.length; i += 3) {
    const a = buf[i]
    const b = buf[i + 1]
    const c = buf[i + 2]

    const bitmap = (a << 16) | (b << 8) | c
    for (let j = 18; j >= 0; j -= 6) {
      const index = (bitmap >> j) & 63
      result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[index]
    }
  }

  // Remove padding
  return result.replace(/==?$/, '')
}

async function generateAccessToken(payload: GenerateTokenRequest) {
  try {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const now = Math.floor(Date.now() / 1000)
    const claims = btoa(JSON.stringify({
      sub: payload.userId,
      role: payload.role,
      deviceId: payload.deviceId,
      iat: now,
      exp: now + JWT_EXPIRY
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    const message = `${header}.${claims}`

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
    const signature = base64url(new Uint8Array(sig))

    return {
      accessToken: `${message}.${signature}`,
      expiresIn: JWT_EXPIRY,
      tokenType: 'Bearer'
    }
  } catch (error) {
    console.error('JWT error:', error)
    throw error
  }
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type'
      }
    })
  }

  try {
    const { userId, role, deviceId } = await req.json()

    if (!userId || !role || !deviceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = await generateAccessToken({ userId, role, deviceId })

    return new Response(JSON.stringify(token), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
