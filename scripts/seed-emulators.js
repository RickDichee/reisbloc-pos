// Script para cargar datos de prueba en Firebase Emulators (local)
import admin from "firebase-admin";
import bcrypt from "bcrypt";

// Configurar para usar emuladores
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

// Inicializar admin SDK sin credenciales (emuladores)
admin.initializeApp({
  projectId: "pos-tpvsolutions",
});

const db = admin.firestore();

async function setupEmulatorData() {
  try {
    console.log("🔧 Cargando datos de prueba en emuladores locales...\n");
    
    const hashedPin = await bcrypt.hash("1234", 10);
    const hashedPinSupervisor = await bcrypt.hash("5678", 10);
    const hashedPinCapitan = await bcrypt.hash("2222", 10);
    const hashedPinCocina = await bcrypt.hash("3333", 10);
    const hashedPinBar = await bcrypt.hash("4444", 10);
    const hashedPinMesero = await bcrypt.hash("5555", 10);
    
    // Usuario Admin
    const adminUserRef = await db.collection("users").add({
      username: "admin",
      hashedPin: hashedPin,
      role: "admin",
      isActive: true,
      devices: [],
      email: "admin@tpvsolutions.com",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✓ Usuario admin creado:", adminUserRef.id);

    // Usuario Supervisor
    const supervisorUserRef = await db.collection("users").add({
      username: "supervisor",
      hashedPin: hashedPinSupervisor,
      role: "supervisor",
      isActive: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✓ Usuario supervisor creado:", supervisorUserRef.id);

    // Usuario Capitán
    const capitanUserRef = await db.collection("users").add({
      username: "capitan",
      hashedPin: hashedPinCapitan,
      role: "capitan",
      isActive: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✓ Usuario capitán creado:", capitanUserRef.id);

    // Usuario Cocina
    const cocinaUserRef = await db.collection("users").add({
      username: "cocina",
      hashedPin: hashedPinCocina,
      role: "cocina",
      isActive: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✓ Usuario cocina creado:", cocinaUserRef.id);

    // Usuario Bar
    const barUserRef = await db.collection("users").add({
      username: "bar",
      hashedPin: hashedPinBar,
      role: "bar",
      isActive: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✓ Usuario bar creado:", barUserRef.id);

    // Usuario Mesero
    const meseroUserRef = await db.collection("users").add({
      username: "mesero",
      hashedPin: hashedPinMesero,
      role: "mesero",
      isActive: true,
      devices: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✓ Usuario mesero creado:", meseroUserRef.id);

    // Productos
    const products = [
      {
        name: "Tacos al Pastor",
        price: 85,
        category: "Comida",
        hasInventory: false,
        isActive: true,
      },
      {
        name: "Quesadillas",
        price: 70,
        category: "Comida",
        hasInventory: false,
        isActive: true,
      },
      {
        name: "Cerveza",
        price: 45,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 100,
        minimumStock: 20,
        isActive: true,
      },
      {
        name: "Refresco",
        price: 30,
        category: "Bebidas",
        hasInventory: false,
        isActive: true,
      },
      {
        name: "Tequila (Botella)",
        price: 850,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 20,
        minimumStock: 5,
        isActive: true,
      },
      {
        name: "Burrito de Carne",
        price: 95,
        category: "Comida",
        hasInventory: false,
        isActive: true,
      },
      {
        name: "Nachos",
        price: 65,
        category: "Comida",
        hasInventory: false,
        isActive: true,
      },
      {
        name: "Agua Mineral",
        price: 25,
        category: "Bebidas",
        hasInventory: true,
        currentStock: 50,
        minimumStock: 10,
        isActive: true,
      },
      {
        name: "Enchiladas",
        price: 80,
        category: "Comida",
        hasInventory: false,
        isActive: true,
      },
      {
        name: "Margarita",
        price: 120,
        category: "Bebidas",
        hasInventory: false,
        isActive: true,
      },
    ];

    for (const product of products) {
      await db.collection("products").add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    console.log(`✓ ${products.length} productos creados\n`);

    console.log("✅ Datos de prueba cargados exitosamente en emuladores\n");
    console.log("📋 Credenciales:");
    console.log("  ┌─ Admin (acceso completo)");
    console.log("  │  Usuario: admin");
    console.log("  │  PIN: 1234");
    console.log("  │");
    console.log("  ├─ Capitán (gestión de mesas)");
    console.log("  │  Usuario: capitan");
    console.log("  │  PIN: 2222");
    console.log("  │");
    console.log("  ├─ Mesero (toma órdenes)");
    console.log("  │  Usuario: mesero");
    console.log("  │  PIN: 5555");
    console.log("  │");
    console.log("  ├─ Cocina");
    console.log("  │  Usuario: cocina");
    console.log("  │  PIN: 3333");
    console.log("  │");
    console.log("  ├─ Bar");
    console.log("  │  Usuario: bar");
    console.log("  │  PIN: 4444");
    console.log("  │");
    console.log("  └─ Supervisor (solo lectura)");
    console.log("     Usuario: supervisor");
    console.log("     PIN: 5678");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

setupEmulatorData();
