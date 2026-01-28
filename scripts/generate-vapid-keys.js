// Script para generar claves VAPID para Web Push
const webpush = require('web-push')
const vapidKeys = webpush.generateVAPIDKeys()
console.log('VITE_PUSH_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VITE_PUSH_PRIVATE_KEY=' + vapidKeys.privateKey)
