// Script para limpiar productos duplicados y recargar datos limpios
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Leer credenciales
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "firebase-admin-credentials.json"), "utf8")
);

// Inicializar admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanAndReload() {
  try {
    console.log("🧹 Limpiando productos duplicados...\n");
    
    // Eliminar todos los productos
    const productsSnap = await db.collection("products").get();
    const batch = db.batch();
    productsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✓ ${productsSnap.size} productos eliminados`);
    
    // Crear productos limpios y únicos
    console.log("\n📦 Creando productos nuevos...\n");
    
    const products = [
      {
        name: "Tacos al Pastor",
        price: 85,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Quesadillas",
        price: 70,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Cerveza",
        price: 45,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 100,
        minimumStock: 20,
        active: true,
      },
      {
        name: "Refresco",
        price: 30,
        category: "Bebidas",
        hasInventory: false,
        active: true,
      },
      {
        name: "Tequila (Botella)",
        price: 850,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 20,
        minimumStock: 5,
        active: true,
      },
      {
        name: "Burrito de Carne",
        price: 95,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Nachos",
        price: 65,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Agua Mineral",
        price: 25,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 50,
        minimumStock: 10,
        active: true,
      },
      {
        name: "Enchiladas",
        price: 80,
        category: "Comida",
        hasInventory: false,
        active: true,
      },
      {
        name: "Margarita",
        price: 120,
        category: "Bebidas",
        hasInventory: false,
        active: true,
      },
    ];

    for (const product of products) {
      const docRef = await db.collection("products").add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✓ ${product.name} - $${product.price}`);
    }

    console.log(`\n✅ ${products.length} productos creados exitosamente`);
    console.log("\n🔄 Recarga la página del POS para ver los productos");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

cleanAndReload();
