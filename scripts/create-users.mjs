import admin from 'firebase-admin';
import bcrypt from 'bcrypt';

// Conectar a emuladores
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'pos-tpvsolutions',
});

const db = admin.firestore();

const users = [
  { username: 'mesero', pin: '5555', role: 'mesero' },
  { username: 'cocina', pin: '3333', role: 'cocina' },
  { username: 'bar', pin: '4444', role: 'bar' },
  { username: 'capitan', pin: '2222', role: 'capitan' },
  { username: 'admin', pin: '1234', role: 'admin' },
  { username: 'supervisor', pin: '5678', role: 'supervisor' },
];

async function createUsers() {
  console.log('🔧 Creando usuarios...\n');
  
  for (const user of users) {
    try {
      const hashedPin = await bcrypt.hash(user.pin, 10);
      await db.collection('users').add({
        username: user.username,
        pin: hashedPin,
        role: user.role,
        email: `${user.username}@tpv.com`,
        active: true,
        devices: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ ${user.username} / ${user.pin}`);
    } catch (error) {
      console.log(`❌ Error creando ${user.username}:`, error.message);
    }
  }
  
  console.log('\n✅ Proceso completado');
  process.exit(0);
}

createUsers().catch(console.error);
