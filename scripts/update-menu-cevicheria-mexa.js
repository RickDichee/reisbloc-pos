// Script para actualizar menú de Cevicheria Mexa
// Ejecutar con emuladores activos: node scripts/update-menu-cevicheria-mexa.js

import admin from 'firebase-admin'

// Inicializar Firebase Admin con emuladores
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'

admin.initializeApp({
  projectId: 'pos-tpvsolutions'
})

const db = admin.firestore()

// Menú de Cevicheria Mexa
const menu = [
  // ========== DESAYUNO ==========
  {
    name: 'Omelette al Gusto',
    category: 'Desayuno',
    subcategory: 'Omelettes',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Omelette personalizado con tus ingredientes favoritos'
  },
  {
    name: 'Omelette Rancheros',
    category: 'Desayuno',
    subcategory: 'Omelettes',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Omelette estilo ranchero'
  },
  {
    name: 'Omelette a la Mexicana',
    category: 'Desayuno',
    subcategory: 'Omelettes',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Con jitomate, cebolla y chile'
  },
  {
    name: 'Omelette Jamón y Queso',
    category: 'Desayuno',
    subcategory: 'Omelettes',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Clásico omelette con jamón y queso'
  },
  {
    name: 'Omelette Salmón Ahumado',
    category: 'Desayuno',
    subcategory: 'Omelettes',
    price: 200,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Con salmón ahumado premium'
  },
  {
    name: 'Burrito Arrachera',
    category: 'Desayuno',
    subcategory: 'Burritos',
    price: 210,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Burrito con arrachera'
  },
  {
    name: 'Burrito Pollo',
    category: 'Desayuno',
    subcategory: 'Burritos',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Burrito con pollo'
  },
  {
    name: 'Hot Cakes',
    category: 'Desayuno',
    subcategory: 'Tradicionales',
    price: 210,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Hot cakes esponjosos'
  },
  {
    name: 'Bowl de Avena',
    category: 'Desayuno',
    subcategory: 'Tradicionales',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Bowl de avena con frutas'
  },
  {
    name: 'Chilaquiles con Arrachera',
    category: 'Desayuno',
    subcategory: 'Chilaquiles',
    price: 230,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Chilaquiles con 100 grs de arrachera'
  },
  {
    name: 'Chilaquiles con Pollo',
    category: 'Desayuno',
    subcategory: 'Chilaquiles',
    price: 190,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Chilaquiles con 100 grs de pollo'
  },
  {
    name: 'Chilaquiles con Huevo',
    category: 'Desayuno',
    subcategory: 'Chilaquiles',
    price: 150,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Chilaquiles con huevo'
  },

  // ========== ESPECIALIDADES ==========
  {
    name: 'Ceviche de Camarón',
    category: 'Especialidades',
    subcategory: 'Ceviches',
    price: 310,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '200 grs de camarón fresco'
  },
  {
    name: 'Ceviche de Pescado',
    category: 'Especialidades',
    subcategory: 'Ceviches',
    price: 295,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '200 grs de pescado fresco'
  },
  {
    name: 'Ceviche Mixto',
    category: 'Especialidades',
    subcategory: 'Ceviches',
    price: 320,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '200 grs de camarón y pescado'
  },
  {
    name: 'Aguachile Verde de Camarón',
    category: 'Especialidades',
    subcategory: 'Aguachiles',
    price: 320,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '200 grs de camarón en salsa verde'
  },
  {
    name: 'Aguachile Rojo',
    category: 'Especialidades',
    subcategory: 'Aguachiles',
    price: 320,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '200 grs en salsa roja picante'
  },
  {
    name: 'Aguachile Mixto',
    category: 'Especialidades',
    subcategory: 'Aguachiles',
    price: 420,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '200 grs de camarón y pescado en aguachile'
  },
  {
    name: 'Tostada de Ceviche Pescado',
    category: 'Especialidades',
    subcategory: 'Tostadas',
    price: 140,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '100 grs de ceviche de pescado'
  },
  {
    name: 'Tostada de Camarón',
    category: 'Especialidades',
    subcategory: 'Tostadas',
    price: 150,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '100 grs de camarón'
  },
  {
    name: 'Tostada Mixta',
    category: 'Especialidades',
    subcategory: 'Tostadas',
    price: 160,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: '100 grs de ceviche mixto'
  },
  {
    name: 'Caldito de Camarón',
    category: 'Especialidades',
    subcategory: 'Entradas',
    price: 140,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Caldo caliente de camarón'
  },
  {
    name: 'Orden de Guacamole',
    category: 'Especialidades',
    subcategory: 'Entradas',
    price: 100,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Guacamole fresco con totopos'
  },
  {
    name: 'Ensalada de la Casa',
    category: 'Especialidades',
    subcategory: 'Entradas',
    price: 150,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Ensalada fresca con vinagreta'
  },

  // ========== BEBIDAS - COCKTELERÍA ==========
  {
    name: 'Mojito',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 160,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Mojito clásico cubano'
  },
  {
    name: 'Piña Colada',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 220,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Piña colada cremosa'
  },
  {
    name: 'Cuba Libre',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 210,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Ron con coca cola'
  },
  {
    name: 'Bloody Mary',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 230,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Cóctel con vodka y jugo de tomate'
  },
  {
    name: 'Sex on the Beach',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 260,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Vodka, durazno y cranberry'
  },
  {
    name: 'Margarita',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 180,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Margarita clásica'
  },
  {
    name: 'Tequila Sunrise',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 230,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Tequila con naranja y granadina'
  },
  {
    name: 'Gin Tonic',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 230,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Gin con agua tónica'
  },
  {
    name: 'Carajillo',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 260,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Licor 43 con café expresso'
  },
  {
    name: 'Mezcalita',
    category: 'Bebidas',
    subcategory: 'Cocktelería',
    price: 200,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Mezcal con limón'
  },

  // ========== BEBIDAS - SIN ALCOHOL ==========
  {
    name: 'Limonada',
    category: 'Bebidas',
    subcategory: 'Sin Alcohol',
    price: 80,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Limonada natural'
  },
  {
    name: 'Naranjada',
    category: 'Bebidas',
    subcategory: 'Sin Alcohol',
    price: 80,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Naranjada natural'
  },
  {
    name: 'Botella de Agua',
    category: 'Bebidas',
    subcategory: 'Sin Alcohol',
    price: 50,
    hasInventory: true,
    currentStock: 50,
    minStock: 10,
    description: 'Agua embotellada'
  },
  {
    name: 'Red Bull',
    category: 'Bebidas',
    subcategory: 'Sin Alcohol',
    price: 125,
    hasInventory: true,
    currentStock: 24,
    minStock: 6,
    description: 'Bebida energética'
  },
  {
    name: 'Clamato Preparado',
    category: 'Bebidas',
    subcategory: 'Sin Alcohol',
    price: 35,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Clamato preparado al gusto'
  },

  // ========== BEBIDAS - CERVEZA ==========
  {
    name: 'Cerveza 355 ml',
    category: 'Bebidas',
    subcategory: 'Cerveza',
    price: 80,
    hasInventory: true,
    currentStock: 100,
    minStock: 24,
    description: 'Cerveza lata o botella'
  },
  {
    name: 'Ampolletita 190 ml',
    category: 'Bebidas',
    subcategory: 'Cerveza',
    price: 50,
    hasInventory: true,
    currentStock: 60,
    minStock: 12,
    description: 'Cerveza pequeña'
  },
  {
    name: 'Ojo Rojo',
    category: 'Bebidas',
    subcategory: 'Cerveza',
    price: 210,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Cerveza con Clamato y limón'
  },

  // ========== BEBIDAS - VINOS ==========
  {
    name: 'Merlot Copa',
    category: 'Bebidas',
    subcategory: 'Vinos Tintos',
    price: 160,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Copa de vino tinto Merlot'
  },
  {
    name: 'Merlot Botella',
    category: 'Bebidas',
    subcategory: 'Vinos Tintos',
    price: 480,
    hasInventory: true,
    currentStock: 12,
    minStock: 3,
    description: 'Botella de vino tinto Merlot'
  },
  {
    name: 'Sauvignon Blanc Copa',
    category: 'Bebidas',
    subcategory: 'Vinos Blancos',
    price: 140,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Copa de vino blanco Sauvignon Blanc'
  },
  {
    name: 'Sauvignon Blanc Botella',
    category: 'Bebidas',
    subcategory: 'Vinos Blancos',
    price: 510,
    hasInventory: true,
    currentStock: 10,
    minStock: 3,
    description: 'Botella de vino blanco Sauvignon Blanc'
  },

  // ========== BEBIDAS - MEZCAL ==========
  {
    name: 'Mezcal 400 Conejos Shot',
    category: 'Bebidas',
    subcategory: 'Mezcal',
    price: 160,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Shot de mezcal 400 Conejos'
  },
  {
    name: 'Mezcal de la Casa Shot',
    category: 'Bebidas',
    subcategory: 'Mezcal',
    price: 90,
    hasInventory: false,
    currentStock: 0,
    minStock: 0,
    description: 'Shot de mezcal de la casa'
  }
]

async function updateMenu() {
  try {
    console.log('🚀 Actualizando menú de Cevicheria Mexa...\n')

    // 1. Borrar productos actuales
    console.log('🗑️  Eliminando productos actuales...')
    const existingProducts = await db.collection('products').get()
    const deletePromises = existingProducts.docs.map(doc => doc.ref.delete())
    await Promise.all(deletePromises)
    console.log(`   ✓ ${existingProducts.size} productos eliminados\n`)

    // 2. Agregar nuevos productos
    console.log('➕ Agregando nuevo menú...')
    const addPromises = menu.map(product => 
      db.collection('products').add({
        ...product,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })
    )
    await Promise.all(addPromises)
    console.log(`   ✓ ${menu.length} productos agregados\n`)

    // 3. Resumen por categoría
    console.log('📊 RESUMEN DEL MENÚ:\n')
    const categories = {}
    menu.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = []
      }
      categories[item.category].push(item)
    })

    Object.entries(categories).forEach(([category, items]) => {
      console.log(`   ${category}: ${items.length} productos`)
      const subcategories = {}
      items.forEach(item => {
        if (!subcategories[item.subcategory]) {
          subcategories[item.subcategory] = 0
        }
        subcategories[item.subcategory]++
      })
      Object.entries(subcategories).forEach(([sub, count]) => {
        console.log(`      - ${sub}: ${count}`)
      })
    })

    console.log('\n✅ Menú actualizado exitosamente!')
    console.log(`\n📋 Total: ${menu.length} productos`)

  } catch (error) {
    console.error('❌ Error actualizando menú:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

updateMenu()
