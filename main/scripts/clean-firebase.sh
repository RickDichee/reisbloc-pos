#!/bin/bash
# Limpia archivos y referencias de Firebase del proyecto

echo "🧹 Limpiando archivos y referencias de Firebase..."

# Elimina archivos y carpetas conocidos de Firebase
rm -rf public/firebase-messaging-sw.js public/sw.js
rm -rf src/config/firebase.ts src/services/firebaseService.ts
rm -rf firebase/
rm -rf scripts/reset-users-clean.js scripts/migrate-firebase-to-supabase.ts
rm -rf docs/setup/FIRESTORE_SETUP.md
rm -rf functions/src/index.ts

# Opcional: marca como legacy cualquier referencia en el código fuente
find src/ -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l 'firebase' | xargs -r sed -i 's/firebase/LEGACY_FIREBASE/g'

echo "✅ Limpieza de Firebase completada."
