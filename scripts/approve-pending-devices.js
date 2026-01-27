// Script para aprobar dispositivos pendientes en el emulador
import admin from 'firebase-admin'

// Conectar a emuladores
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

// Inicializar admin SDK contra emuladores sin credenciales
admin.initializeApp({ projectId: 'pos-tpvsolutions' })

const db = admin.firestore()

async function approvePendingDevices() {
  try {
    console.log('Buscando dispositivos pendientes...')

    const snapshot = await db.collection('devices').get()
    if (snapshot.empty) {
      console.log('No hay dispositivos registrados.')
      process.exit(0)
    }

    const pending = snapshot.docs.filter((doc) => {
      const d = doc.data() || {}
      const approved = d.isApproved === true
      const rejected = d.isRejected === true
      return !approved && !rejected
    })

    if (pending.length === 0) {
      console.log('No hay dispositivos pendientes de aprobación.')
      process.exit(0)
    }

    console.log(`Aprobando ${pending.length} dispositivo(s)...`)

    const batch = db.batch()
    pending.forEach((docRef) => {
      batch.update(docRef.ref, {
        isApproved: true,
        isRejected: false,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()

    console.log('✅ Dispositivos aprobados:')
    pending.forEach((docRef) => console.log(` - ${docRef.id}`))
    process.exit(0)
  } catch (err) {
    console.error('❌ Error aprobando dispositivos:', err)
    process.exit(1)
  }
}

approvePendingDevices()
