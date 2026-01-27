import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { create } from 'https://deno.land/x/djwt@v2.4/mod.ts'

// Get JWT secret from environment
const JWT_SECRET = Deno.env.get('JWT_SECRET')

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable not set')
}

interface GenerateTokenPayload {
  userId: string
  role: string
  deviceId: string
}

interface TokenResponse {
  accessToken: string
  expiresIn: number
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
      },
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json() as GenerateTokenPayload

    if (!body.userId || !body.role || !body.deviceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, role, deviceId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = 24 * 60 * 60 // 24 hours in seconds

    const payload = {
      sub: body.userId,
      role: body.role,
      deviceId: body.deviceId,
      iat: now,
      exp: now + expiresIn,
      iss: 'reisbloc-pos',
    }

    // Sign JWT using HS256
    const accessToken = await create(
      { alg: 'HS256', typ: 'JWT' },
      payload,
      JWT_SECRET
    )

    return new Response(
      JSON.stringify({
        accessToken,
        expiresIn,
      } as TokenResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error generating token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
