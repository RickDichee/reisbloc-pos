#!/bin/bash

set -e

echo "🏗️ Building Reisbloc POS Android APK..."

# 1. Build web app
echo "📦 Building web app..."
npm run build

# 2. Sync with Capacitor
echo "🔄 Syncing with Android..."
npx cap sync android

# 3. Build APK
echo "🤖 Building Android APK..."
cd android

# Check if release or debug
if [ "$1" == "release" ]; then
    echo "🚀 Building RELEASE APK..."
    
    # Verificar variables de entorno
    if [ -z "$KEYSTORE_PATH" ]; then
        echo "❌ Error: KEYSTORE_PATH no configurado"
        echo "💡 Configura las variables de entorno:"
        echo "   export KEYSTORE_PATH=~/.android-keys/reisbloc-pos.keystore"
        echo "   export KEYSTORE_PASSWORD='tu_password'"
        echo "   export KEY_ALIAS='reisbloc-pos-key'"
        echo "   export KEY_PASSWORD='tu_password'"
        exit 1
    fi
    
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
    echo "🔧 Building DEBUG APK..."
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..

echo "✅ Build complete!"
echo "📱 APK location: android/$APK_PATH"

# Copiar al root para fácil acceso
OUTPUT_NAME="reisbloc-pos-$(date +%Y%m%d).apk"
cp "android/$APK_PATH" "$OUTPUT_NAME"
echo "📦 Copiado a: $OUTPUT_NAME"

# Mostrar información de la APK
echo ""
echo "📊 APK Info:"
ls -lh "$OUTPUT_NAME"
