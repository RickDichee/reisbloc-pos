// Script para limpiar historial de órdenes, ventas y datos de prueba
// MANTIENE: usuarios y productos
// ELIMINA: órdenes, ventas, auditoría, dispositivos de prueba
// Ejecutar con emuladores activos: node scripts/clean-history.js

import admin from 'firebase-admin'

// Inicializar Firebase Admin con emuladores
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'

admin.initializeApp({
  projectId: 'pos-tpvsolutions'
})

const db = admin.firestore()

async function cleanHistory() {
  try {
    console.log('🧹 Limpiando historial para ir onsite...\n')

    let totalDeleted = 0

    // 1. Limpiar órdenes
    console.log('🗑️  Eliminando órdenes...')
    const orders = await db.collection('orders').get()
    if (orders.size > 0) {
      const deleteOrders = orders.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteOrders)
      console.log(`   ✓ ${orders.size} órdenes eliminadas`)
      totalDeleted += orders.size
    } else {
      console.log('   ℹ️  No hay órdenes')
    }

    // 2. Limpiar ventas
    console.log('🗑️  Eliminando ventas...')
    const sales = await db.collection('sales').get()
    if (sales.size > 0) {
      const deleteSales = sales.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteSales)
      console.log(`   ✓ ${sales.size} ventas eliminadas`)
      totalDeleted += sales.size
    } else {
      console.log('   ℹ️  No hay ventas')
    }

    // 3. Limpiar auditoría
    console.log('🗑️  Eliminando logs de auditoría...')
    const audits = await db.collection('auditLogs').get()
    if (audits.size > 0) {
      const deleteAudits = audits.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteAudits)
      console.log(`   ✓ ${audits.size} logs eliminados`)
      totalDeleted += audits.size
    } else {
      console.log('   ℹ️  No hay logs')
    }

    // 4. Limpiar cierres de caja
    console.log('🗑️  Eliminando cierres de caja...')
    const closings = await db.collection('closings').get()
    if (closings.size > 0) {
      const deleteClosings = closings.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteClosings)
      console.log(`   ✓ ${closings.size} cierres eliminados`)
      totalDeleted += closings.size
    } else {
      console.log('   ℹ️  No hay cierres')
    }

    // 5. Limpiar dispositivos de prueba (mantener solo aprobados)
    console.log('🗑️  Limpiando dispositivos...')
    const devices = await db.collection('devices').where('isApproved', '==', false).get()
    if (devices.size > 0) {
      const deleteDevices = devices.docs.map(doc => doc.ref.delete())
      await Promise.all(deleteDevices)
      console.log(`   ✓ ${devices.size} dispositivos no aprobados eliminados`)
      totalDeleted += devices.size
    } else {
      console.log('   ℹ️  No hay dispositivos pendientes')
    }

    // 6. Verificar qué se mantiene
    console.log('\n✅ Limpieza completada!\n')
    console.log('📊 RESUMEN:')
    console.log(`   🗑️  Total eliminado: ${totalDeleted} documentos\n`)

    console.log('📋 DATOS MANTENIDOS:')
    const users = await db.collection('users').get()
    console.log(`   👥 Usuarios: ${users.size}`)
    
    const products = await db.collection('products').get()
    console.log(`   🍽️  Productos: ${products.size}`)
    
    const approvedDevices = await db.collection('devices').where('isApproved', '==', true).get()
    console.log(`   📱 Dispositivos aprobados: ${approvedDevices.size}`)

    console.log('\n🎉 Base de datos lista para ir onsite!')
    console.log('💡 Tip: Ahora puedes hacer una prueba rápida y todo quedará limpio\n')

  } catch (error) {
    console.error('❌ Error limpiando historial:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

cleanHistory()
