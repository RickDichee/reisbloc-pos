// Script para enviar notificaciones push a usuarios registrados en Supabase
const { createClient } = require('@supabase/supabase-js')
const webpush = require('web-push')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

webpush.setVapidDetails(
  'mailto:admin@reisbloc.com',
  process.env.VITE_PUSH_PUBLIC_KEY,
  process.env.VITE_PUSH_PRIVATE_KEY
)

async function sendPushToUser(userId, title, body, data = {}) {
  // Obtener todas las suscripciones push del usuario
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  if (!subs || subs.length === 0) {
    console.log('No hay suscripciones push para el usuario')
    return
  }

  const payload = JSON.stringify({
    title,
    body,
    ...data
  })

  for (const sub of subs) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload)
      console.log('Push enviado a', sub.endpoint)
    } catch (err) {
      console.warn('Error enviando push:', err.message)
    }
  }
}

// USO: node scripts/send-push.js <userId> "Título" "Mensaje"
if (require.main === module) {
  const [userId, title, body] = process.argv.slice(2)
  if (!userId || !title || !body) {
    console.log('Uso: node scripts/send-push.js <userId> "Título" "Mensaje"')
    process.exit(1)
  }
  sendPushToUser(userId, title, body).then(() => process.exit(0))
}
