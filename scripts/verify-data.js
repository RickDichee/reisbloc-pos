// Script para verificar datos en Firestore
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

async function verifyData() {
  try {
    console.log("🔍 Verificando datos en Firestore...\n");
    
    // Verificar productos
    const productsSnap = await db.collection("products").get();
    console.log(`📦 Productos activos: ${productsSnap.size}`);
    if (productsSnap.size > 0) {
      console.log("   Productos encontrados:");
      productsSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.name}: $${data.price} (Stock: ${data.currentStock || 'N/A'}, Activo: ${data.active})`);
      });
    } else {
      console.log("   ⚠️ No hay productos en la base de datos");
      console.log("   💡 Ejecuta: node seed.js");
    }
    
    console.log();
    
    // Verificar usuarios
    const usersSnap = await db.collection("users").get();
    console.log(`👥 Usuarios: ${usersSnap.size}`);
    if (usersSnap.size > 0) {
      console.log("   Usuarios encontrados:");
      usersSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.username} (${data.role}) - Activo: ${data.active}`);
      });
    }
    
    console.log();
    
    // Verificar órdenes activas
    const ordersSnap = await db.collection("orders")
      .where("status", "in", ["open", "sent", "ready", "served"])
      .get();
    console.log(`📋 Órdenes activas: ${ordersSnap.size}`);
    
    console.log();
    
    // Verificar ventas
    const salesSnap = await db.collection("sales").get();
    console.log(`💰 Ventas registradas: ${salesSnap.size}`);
    
    console.log("\n✅ Verificación completa");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    process.exit(0);
  }
}

verifyData();
