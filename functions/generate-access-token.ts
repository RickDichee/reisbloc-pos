import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'dev-secret-change-in-production'
const JWT_EXPIRY = 24 * 60 * 60 // 24 horas

interface GenerateTokenRequest {
  userId: string
  role: string
  deviceId: string
}

const encoder = new TextEncoder()

async function generateAccessToken(payload: GenerateTokenRequest) {
  try {
    // Crear JWT con información del usuario
    const jwt = await new jose.SignJWT({
      sub: payload.userId,
      role: payload.role,
      deviceId: payload.deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(encoder.encode(JWT_SECRET))

    return {
      accessToken: jwt,
      expiresIn: JWT_EXPIRY,
      tokenType: 'Bearer'
    }
  } catch (error) {
    console.error('Error generando JWT:', error)
    throw new Error(`JWT generation failed: ${error.message}`)
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
