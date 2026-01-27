// Script para actualizar usuarios con PINs sin hashear en emuladores
import admin from "firebase-admin";
import bcrypt from "bcrypt";

// Configurar para usar emuladores
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({
  projectId: "pos-tpvsolutions",
});

const db = admin.firestore();

async function fixUnhashedPins() {
  try {
    console.log("🔍 Buscando usuarios con PINs sin hashear...\n");
    
    const usersSnap = await db.collection("users").get();
    let fixed = 0;
    let deleted = 0;

    for (const doc of usersSnap.docs) {
      const user = doc.data();
      
      // Verificar si el PIN NO está hasheado (no empieza con $2b$ o $2a$)
      if (user.pin && !user.pin.startsWith("$2")) {
        console.log(`⚠️  Usuario: ${user.username} - PIN sin hashear: "${user.pin}"`);
        
        // Si el PIN tiene 4 dígitos, hashearlo
        if (/^\d{4}$/.test(user.pin)) {
          const hashedPin = await bcrypt.hash(user.pin, 10);
          await doc.ref.update({ pin: hashedPin });
          console.log(`   ✅ PIN actualizado y hasheado`);
          fixed++;
        } else {
          // Si no es un PIN válido, eliminar el usuario
          console.log(`   ❌ PIN inválido - Eliminando usuario`);
          await doc.ref.delete();
          deleted++;
        }
      } else {
        console.log(`✓ Usuario: ${user.username} - PIN ya hasheado`);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Usuarios con PIN hasheado correctamente: ${usersSnap.size - fixed - deleted}`);
    console.log(`   - PINs actualizados: ${fixed}`);
    console.log(`   - Usuarios eliminados (PIN inválido): ${deleted}`);
    console.log(`\n✅ Proceso completado`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    process.exit(0);
  }
}

fixUnhashedPins();
