#!/usr/bin/env node
/**
 * Reisbloc POS - Sistema POS Profesional
 * Copyright (C) 2026 Reisbloc POS
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Script de migración de datos: Firebase → Supabase
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// ⚠️ IMPORTANTE: Usar credenciales de producción
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '' // ⚠️ SERVICE ROLE, no anon key

if (!firebaseConfig.apiKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Falta configuración. Necesitas:')
  console.error('   - Variables de Firebase (VITE_FIREBASE_*)')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (⚠️ No usar anon key!)')
  process.exit(1)
}

const firebaseApp = initializeApp(firebaseConfig)
const firestore = getFirestore(firebaseApp)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MigrationStats {
  total: number
  success: number
  failed: number
  errors: string[]
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(question + ' (y/n): ', answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function migrateCollection(collectionName: string): Promise<MigrationStats> {
  console.log(`\n📦 Migrando colección: ${collectionName}...`)
  
  const stats: MigrationStats = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  }

  try {
    // 1. Obtener datos de Firebase
    const snapshot = await getDocs(collection(firestore, collectionName))
    stats.total = snapshot.docs.length
    
    if (stats.total === 0) {
      console.log(`   ℹ️  Colección vacía, omitiendo...`)
      return stats
    }

    console.log(`   📊 ${stats.total} documentos encontrados`)

    // 2. Transformar datos (Firebase IDs → Supabase UUIDs)
    const data = snapshot.docs.map(doc => {
      const docData = doc.data()
      
      // Convertir timestamps de Firebase
      const transformed: any = { ...docData }
      
      // Mapear campos específicos según la colección
      if (collectionName === 'users') {
        transformed.id = doc.id // Mantener ID original
        transformed.created_at = docData.createdAt?.toDate?.() || new Date()
        transformed.updated_at = docData.updatedAt?.toDate?.() || new Date()
        delete transformed.createdAt
        delete transformed.updatedAt
      }
      
      if (collectionName === 'devices') {
        transformed.id = doc.id
        transformed.last_seen = docData.lastAccess?.toDate?.() || new Date()
        transformed.created_at = docData.registeredAt?.toDate?.() || new Date()
        delete transformed.lastAccess
        delete transformed.registeredAt
      }
      
      if (collectionName === 'products') {
        transformed.id = doc.id
        transformed.available = docData.isActive !== false
        transformed.created_at = docData.createdAt?.toDate?.() || new Date()
        transformed.updated_at = docData.updatedAt?.toDate?.() || new Date()
        delete transformed.isActive
        delete transformed.createdAt
        delete transformed.updatedAt
      }
      
      if (collectionName === 'orders') {
        transformed.id = doc.id
        transformed.waiter_id = docData.waiterId
        transformed.table_number = docData.tableNumber
        transformed.payment_method = docData.paymentMethod
        transformed.tip_amount = docData.tipAmount || 0
        transformed.tip_percentage = docData.tipPercentage || 0
        transformed.created_at = docData.createdAt?.toDate?.() || new Date()
        transformed.updated_at = docData.updatedAt?.toDate?.() || new Date()
        transformed.completed_at = docData.completedAt?.toDate?.() || null
        delete transformed.waiterId
        delete transformed.tableNumber
        delete transformed.paymentMethod
        delete transformed.tipAmount
        delete transformed.tipPercentage
        delete transformed.createdAt
        delete transformed.updatedAt
        delete transformed.completedAt
      }
      
      if (collectionName === 'sales') {
        transformed.id = doc.id
        transformed.order_id = docData.orderId
        transformed.waiter_id = docData.waiterId
        transformed.table_number = docData.tableNumber
        transformed.payment_method = docData.paymentMethod
        transformed.tip_amount = docData.tipAmount || 0
        transformed.tip_percentage = docData.tipPercentage || 0
        transformed.device_id = docData.deviceId
        transformed.created_at = docData.createdAt?.toDate?.() || new Date()
        delete transformed.orderId
        delete transformed.waiterId
        delete transformed.tableNumber
        delete transformed.paymentMethod
        delete transformed.tipAmount
        delete transformed.tipPercentage
        delete transformed.deviceId
        delete transformed.createdAt
      }
      
      return transformed
    })

    // 3. Insertar en Supabase en lotes (100 a la vez)
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from(collectionName)
        .upsert(batch, { onConflict: 'id' })
      
      if (error) {
        console.error(`   ❌ Error en batch ${i}-${i + batch.length}:`, error.message)
        stats.failed += batch.length
        stats.errors.push(`${collectionName}[${i}-${i + batch.length}]: ${error.message}`)
      } else {
        stats.success += batch.length
        console.log(`   ✅ Batch ${i}-${i + batch.length} migrado`)
      }
    }

    console.log(`   📊 Resumen: ${stats.success}/${stats.total} exitosos, ${stats.failed} fallidos`)

  } catch (error: any) {
    console.error(`   ❌ Error fatal en ${collectionName}:`, error.message)
    stats.errors.push(`${collectionName}: ${error.message}`)
  }

  return stats
}

async function verifyMigration(collectionName: string, expectedCount: number) {
  console.log(`\n🔍 Verificando ${collectionName}...`)
  
  const { count, error } = await supabase
    .from(collectionName)
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error(`   ❌ Error verificando: ${error.message}`)
    return false
  }
  
  const match = count === expectedCount
  if (match) {
    console.log(`   ✅ ${count}/${expectedCount} registros (100%)`)
  } else {
    console.warn(`   ⚠️  ${count}/${expectedCount} registros (${Math.round((count || 0) / expectedCount * 100)}%)`)
  }
  
  return match
}

async function main() {
  console.log('🗄️  Migración Firebase → Supabase')
  console.log('=====================================\n')
  
  console.log('⚙️  Configuración:')
  console.log(`   Firebase Project: ${firebaseConfig.projectId}`)
  console.log(`   Supabase URL: ${supabaseUrl}`)
  console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`)
  
  // Confirmar migración
  const confirmed = await confirm('\n⚠️  ¿Continuar con la migración?')
  if (!confirmed) {
    console.log('❌ Migración cancelada')
    return
  }

  const collections = ['users', 'devices', 'products', 'orders', 'sales']
  const allStats: Record<string, MigrationStats> = {}

  // Migrar cada colección
  for (const collectionName of collections) {
    allStats[collectionName] = await migrateCollection(collectionName)
  }

  // Verificar migración
  console.log('\n🔍 Verificando migración...')
  for (const collectionName of collections) {
    await verifyMigration(collectionName, allStats[collectionName].total)
  }

  // Resumen final
  console.log('\n📊 Resumen Final')
  console.log('=================')
  
  let totalRecords = 0
  let totalSuccess = 0
  let totalFailed = 0
  
  for (const [collection, stats] of Object.entries(allStats)) {
    totalRecords += stats.total
    totalSuccess += stats.success
    totalFailed += stats.failed
    
    const percentage = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
    console.log(`${collection.padEnd(15)} ${stats.success}/${stats.total} (${percentage}%)`)
  }
  
  console.log('─────────────────────────────────')
  console.log(`TOTAL: ${totalSuccess}/${totalRecords} exitosos`)
  console.log(`Fallidos: ${totalFailed}`)
  
  if (totalFailed === 0) {
    console.log('\n✅ ¡Migración completada con éxito!')
    console.log('\nPróximos pasos:')
    console.log('1. Actualizar .env.local: VITE_SUPABASE_DB_ENABLED=true')
    console.log('2. Probar la app con Supabase')
    console.log('3. Si todo funciona, desactivar Firebase')
  } else {
    console.log('\n⚠️  Migración completada con errores')
    console.log('\nErrores encontrados:')
    for (const [collection, stats] of Object.entries(allStats)) {
      if (stats.errors.length > 0) {
        console.log(`\n${collection}:`)
        stats.errors.forEach(err => console.log(`  - ${err}`))
      }
    }
  }
}

// Ejecutar migración
main().catch(error => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
