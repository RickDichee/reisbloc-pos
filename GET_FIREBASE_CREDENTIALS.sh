#!/bin/bash

# 📋 Guía para obtener credenciales de Firebase

echo "🔐 Obtener credenciales de Firebase"
echo "===================================="
echo ""
echo "Tu proyecto: pos-tpvsolutions"
echo ""
echo "Pasos:"
echo "1. Ve a: https://console.firebase.google.com"
echo "2. Selecciona el proyecto: pos-tpvsolutions"
echo "3. Haz clic en ⚙️ (engranaje) → Configuración del proyecto"
echo "4. Ve a la pestaña: General"
echo "5. Desplázate hacia abajo hasta 'Tus apps'"
echo "6. Busca la app de WEB (ícono </> )"
echo "7. Haz clic en ella para ver el código"
echo ""
echo "Copiarás valores como estos:"
echo "---"
echo '  const firebaseConfig = {'
echo '    apiKey: "AIza...",                         ← VITE_FIREBASE_API_KEY'
echo '    authDomain: "pos-tpvsolutions.firebaseapp.com",    ← VITE_FIREBASE_AUTH_DOMAIN'
echo '    projectId: "pos-tpvsolutions",             ← VITE_FIREBASE_PROJECT_ID'
echo '    storageBucket: "pos-tpvsolutions.appspot.com",     ← VITE_FIREBASE_STORAGE_BUCKET'
echo '    messagingSenderId: "123456789",            ← VITE_FIREBASE_MESSAGING_SENDER_ID'
echo '    appId: "1:123456789:web:abc...",           ← VITE_FIREBASE_APP_ID'
echo '    measurementId: "G-ABC..."                  ← VITE_FIREBASE_MEASUREMENT_ID'
echo '  };'
echo "---"
echo ""
echo "Luego:"
echo "1. Abre .env.local"
echo "2. Completa los valores vacíos con los que copiaste"
echo "3. Guarda el archivo"
echo ""
echo "✅ ¡Listo!"
