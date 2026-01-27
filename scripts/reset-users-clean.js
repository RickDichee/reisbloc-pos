// Script para limpiar usuarios y dejar solo 5 básicos
// Ejecutar con emuladores activos: node scripts/reset-users-clean.js

import admin from 'firebase-admin'
import bcrypt from 'bcryptjs'

// Inicializar Firebase Admin con emuladores
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'

admin.initializeApp({
  projectId: 'pos-tpvsolutions'
})

const db = admin.firestore()
const auth = admin.auth()

// Usuarios básicos para Cevicheria Mexa
const basicUsers = [
  {
    username: 'admin',
    pin: '1234',
    role: 'admin',
    isActive: true,
    fullName: 'Administrador',
    email: 'admin@cevicheriamexa.com'
  },
  {
    username: 'capitan',
    pin: '2222',
    role: 'capitan',
    isActive: true,
    fullName: 'Capitán de Meseros',
    email: 'capitan@cevicheriamexa.com'
  },
  {
    username: 'mesero',
    pin: '3333',
    role: 'mesero',
    isActive: true,
    fullName: 'Mesero',
    email: 'mesero@cevicheriamexa.com'
  },
  {
    username: 'cocina',
    pin: '4444',
    role: 'cocina',
    isActive: true,
    fullName: 'Cocinero',
    email: 'cocina@cevicheriamexa.com'
  },
  {
    username: 'bar',
    pin: '5555',
    role: 'bar',
    isActive: true,
    fullName: 'Bartender',
    email: 'bar@cevicheriamexa.com'
  }
]

async function resetUsers() {
  try {
    console.log('🚀 Limpiando usuarios de Cevicheria Mexa...\n')

    // 1. Borrar usuarios de Firestore
    console.log('🗑️  Eliminando usuarios de Firestore...')
    const existingUsers = await db.collection('users').get()
    const deleteFirestorePromises = existingUsers.docs.map(doc => doc.ref.delete())
    await Promise.all(deleteFirestorePromises)
    console.log(`   ✓ ${existingUsers.size} usuarios eliminados de Firestore\n`)

    // 2. Borrar usuarios de Auth (emulador)
    console.log('🗑️  Eliminando usuarios de Auth...')
    try {
      const authUsers = await auth.listUsers()
      const deleteAuthPromises = authUsers.users.map(user => 
        auth.deleteUser(user.uid).catch(err => {
          console.log(`   ⚠️  No se pudo eliminar ${user.email}: ${err.message}`)
        })
      )
      await Promise.all(deleteAuthPromises)
      console.log(`   ✓ ${authUsers.users.length} usuarios eliminados de Auth\n`)
    } catch (error) {
      console.log('   ⚠️  Auth cleanup opcional (emulator only)\n')
    }

    // 3. Crear usuarios básicos
    console.log('➕ Creando usuarios básicos...\n')
    
    for (const userData of basicUsers) {
      // Hash del PIN
      const hashedPin = await bcrypt.hash(userData.pin, 10)
      
      // Crear en Firestore
      const userDoc = await db.collection('users').add({
        username: userData.username,
        hashedPin,
        role: userData.role,
        isActive: userData.isActive,
        fullName: userData.fullName,
        email: userData.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null
      })

      console.log(`   ✓ ${userData.username.padEnd(10)} | Rol: ${userData.role.padEnd(10)} | PIN: ${userData.pin}`)
    }

    console.log('\n✅ Usuarios reseteados exitosamente!')
    console.log('\n📋 USUARIOS ACTIVOS:')
    console.log('┌──────────────┬──────────────┬──────────┐')
    console.log('│ Usuario      │ Rol          │ PIN      │')
    console.log('├──────────────┼──────────────┼──────────┤')
    basicUsers.forEach(user => {
      console.log(`│ ${user.username.padEnd(12)} │ ${user.role.padEnd(12)} │ ${user.pin.padEnd(8)} │`)
    })
    console.log('└──────────────┴──────────────┴──────────┘')

  } catch (error) {
    console.error('❌ Error reseteando usuarios:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

resetUsers()
