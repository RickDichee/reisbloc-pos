// Script rápido para crear usuarios en emuladores
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, connectFirestoreEmulator } from 'firebase/firestore';
import bcrypt from 'bcrypt';

const firebaseConfig = {
  apiKey: "AIzaSyCiBJy11Xejt7HA2B-BvM5DyTsA_xjuCPE",
  authDomain: "pos-tpvsolutions.firebaseapp.com",
  projectId: "pos-tpvsolutions",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Conectar a emuladores
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function createUsers() {
  try {
    console.log('🔧 Creando usuarios...\n');
    
    const users = [
      { username: 'admin', pin: '1234', role: 'admin', email: 'admin@tpv.com' },
      { username: 'capitan', pin: '2222', role: 'capitan', email: 'capitan@tpv.com' },
      { username: 'mesero', pin: '5555', role: 'mesero', email: 'mesero@tpv.com' },
      { username: 'cocina', pin: '3333', role: 'cocina', email: 'cocina@tpv.com' },
      { username: 'bar', pin: '4444', role: 'bar', email: 'bar@tpv.com' },
      { username: 'supervisor', pin: '5678', role: 'supervisor', email: 'supervisor@tpv.com' },
    ];
    
    for (const user of users) {
      const hashedPin = await bcrypt.hash(user.pin, 10);
      await addDoc(collection(db, 'users'), {
        username: user.username,
        pin: hashedPin,
        role: user.role,
        email: user.email,
        active: true,
        devices: [],
        createdAt: new Date(),
      });
      console.log(`✅ Usuario ${user.username} creado (PIN: ${user.pin})`);
    }
    
    console.log('\n✅ Todos los usuarios creados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createUsers();
