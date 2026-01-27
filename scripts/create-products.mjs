import admin from 'firebase-admin'

// Conectar a emulador Firestore
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'

admin.initializeApp({ projectId: 'pos-tpvsolutions' })
const db = admin.firestore()

const products = [
  { name: 'Tacos al Pastor', price: 85, category: 'Comida', hasInventory: false },
  { name: 'Hamburguesa Clásica', price: 120, category: 'Comida', hasInventory: false },
  { name: 'Ensalada César', price: 95, category: 'Comida', hasInventory: false },
  { name: 'Papas a la Francesa', price: 70, category: 'Comida', hasInventory: false },
  { name: 'Nachos con Queso', price: 90, category: 'Comida', hasInventory: false },
  { name: 'Brownie', price: 60, category: 'Postres', hasInventory: false },
  { name: 'Café Americano', price: 35, category: 'Bebidas', hasInventory: true, currentStock: 50, minimumStock: 10 },
  { name: 'Jugo de Naranja', price: 45, category: 'Bebidas', hasInventory: true, currentStock: 30, minimumStock: 8 },
  { name: 'Cerveza Lager', price: 55, category: 'Bebidas', hasInventory: true, currentStock: 60, minimumStock: 15 },
  { name: 'Agua 600ml', price: 25, category: 'Bebidas', hasInventory: true, currentStock: 80, minimumStock: 20 }
]

async function seedProducts() {
  console.log('🔧 Creando productos...')
  for (const p of products) {
    try {
      await db.collection('products').add({
        ...p,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      })
      console.log(`✅ ${p.name}`)
    } catch (err) {
      console.error(`❌ Error creando ${p.name}:`, err.message)
    }
  }
  console.log('✅ Productos listos')
  process.exit(0)
}

seedProducts().catch(err => {
  console.error('❌ Error general:', err)
  process.exit(1)
})
