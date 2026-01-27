// Script para cargar datos de prueba en Firebase Cloud
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Leer credenciales desde firebase-admin-credentials.json
let serviceAccount;
try {
  const credentialsPath = path.join(__dirname, "firebase-admin-credentials.json");
  serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
} catch (error) {
  console.error("❌ No se encontró firebase-admin-credentials.json");
  console.error("   Obtén las credenciales en: Firebase Console > Project Settings > Service Accounts");
  process.exit(1);
}

// Inicializar admin SDK contra Firebase Cloud
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function setupTestData() {
  try {
    console.log("Creando datos de prueba...");
    
    const hashedPin = await bcrypt.hash("1234", 10);
    const hashedPinSupervisor = await bcrypt.hash("5678", 10);
    
    // Usuario Admin
    const adminUserRef = await db.collection("users").add({
      username: "admin",
      pin: hashedPin,
      role: "admin",
      active: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✓ Usuario admin creado:", adminUserRef.id);

    // Usuario Supervisor (solo lectura)
    const supervisorUserRef = await db.collection("users").add({
      username: "supervisor",
      pin: hashedPinSupervisor,
      role: "supervisor",
      active: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✓ Usuario supervisor creado:", supervisorUserRef.id);

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
        name: "Refresco",
        price: 30,
        category: "Bebidas",
        hasInventory: false,
        active: true,
      },
      {
        name: "Cerveza",
        price: 45,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 100,
        minimumStock: 10,
        active: true,
      },
      {
        name: "Tequila (Botella)",
        price: 850,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 20,
        minimumStock: 2,
        active: true,
      },
    ];

    for (const product of products) {
      await db.collection("products").add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    console.log("✓ Productos creados:", products.length);
    console.log("\n✅ Datos de prueba cargados exitosamente");
    console.log("\n📋 Credenciales:");
    console.log("  ┌─ Admin (acceso completo)");
    console.log("  │  Usuario: admin");
    console.log("  │  PIN: 1234");
    console.log("  │");
    console.log("  └─ Supervisor (solo lectura)");
    console.log("     Usuario: supervisor");
    console.log("     PIN: 5678");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setupTestData();
