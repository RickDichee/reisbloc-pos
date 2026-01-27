// Script para actualizar usuarios con PINs sin hashear en PRODUCCIÓN
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Leer credenciales de producción
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "firebase-admin-credentials.json"), "utf8")
);

// Inicializar admin SDK para PRODUCCIÓN
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixUnhashedPinsProduction() {
  try {
    console.log("🔍 Buscando usuarios con PINs sin hashear en PRODUCCIÓN...\n");
    console.log("⚠️  ADVERTENCIA: Este script modificará la base de datos de PRODUCCIÓN\n");
    
    const usersSnap = await db.collection("users").get();
    let fixed = 0;
    let alreadyHashed = 0;

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      
      // Verificar si el PIN NO está hasheado (no empieza con $2b$ o $2a$)
      if (user.pin && !user.pin.startsWith("$2")) {
        console.log(`⚠️  Usuario: ${user.username} (${doc.id})`);
        console.log(`   PIN actual: "${user.pin}"`);
        
        // Si el PIN tiene 4 dígitos, hashearlo
        if (/^\d{4}$/.test(user.pin)) {
          const hashedPin = await bcrypt.hash(user.pin, 10);
          await doc.ref.update({ pin: hashedPin });
          console.log(`   ✅ PIN actualizado y hasheado: ${hashedPin.substring(0, 20)}...`);
          fixed++;
        } else {
          console.log(`   ❌ PIN inválido (no son 4 dígitos numéricos) - NO se actualizará`);
          console.log(`   💡 Acción manual requerida: Eliminar o corregir manualmente este usuario\n`);
        }
      } else {
        console.log(`✓ Usuario: ${user.username} - PIN ya hasheado`);
        alreadyHashed++;
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Total usuarios: ${usersSnap.size}`);
    console.log(`   - Usuarios con PIN ya hasheado: ${alreadyHashed}`);
    console.log(`   - PINs actualizados: ${fixed}`);
    console.log(`\n✅ Proceso completado`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

fixUnhashedPinsProduction();
