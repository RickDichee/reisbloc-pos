#!/bin/bash

# 🔍 Script de Verificación - TPV Solutions Setup

echo "================================================"
echo "🔍 Verificando Setup de TPV Solutions"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de verificaciones
PASS=0
FAIL=0

# Función auxiliar
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAIL++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/"
        ((FAIL++))
    fi
}

echo "📁 Estructura de Carpetas:"
check_dir "src"
check_dir "src/components"
check_dir "src/pages"
check_dir "src/services"
check_dir "src/hooks"
check_dir "src/types"
check_dir "src/store"
check_dir "src/styles"
check_dir "src/config"
check_dir "firebase"
check_dir "firebase/functions"
echo ""

echo "📄 Archivos de Configuración:"
check_file "package.json"
check_file "tsconfig.json"
check_file "vite.config.ts"
check_file "tailwind.config.js"
check_file ".env.example"
echo ""

echo "📚 Documentación:"
check_file "README.md"
check_file "QUICK_START.md"
check_file "ARCHITECTURE.md"
check_file "SECURITY.md"
check_file "FIRESTORE_SETUP.md"
check_file "CLIP_INTEGRATION.md"
check_file "GITHUB_SETUP.md"
check_file "PROJECT_STATUS.md"
check_file "SETUP_COMPLETE.md"
check_file "INDEX.md"
check_file "NEXT_STEPS.md"
echo ""

echo "⚙️ Servicios Core:"
check_file "src/services/deviceService.ts"
check_file "src/services/clipService.ts"
check_file "src/services/auditService.ts"
check_file "src/services/closingService.ts"
check_file "src/services/firebaseService.ts"
echo ""

echo "🔐 Firebase:"
check_file "src/config/firebase.ts"
check_file "firebase/firestore.rules"
check_file "firebase/functions/index.ts"
echo ""

echo "🎯 Páginas:"
check_file "src/pages/Login.tsx"
check_file "src/pages/POS.tsx"
check_file "src/pages/Admin.tsx"
check_file "src/pages/Kitchen.tsx"
check_file "src/pages/Reports.tsx"
check_file "src/pages/NotFound.tsx"
echo ""

echo "🪝 Hooks y Store:"
check_file "src/hooks/useAuth.ts"
check_file "src/store/appStore.ts"
echo ""

echo "📝 Tipos:"
check_file "src/types/index.ts"
echo ""

echo "================================================"
echo "📊 Resumen:"
echo -e "${GREEN}✓ Archivos correctos: $PASS${NC}"
echo -e "${RED}✗ Archivos faltantes: $FAIL${NC}"
echo "================================================"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✨ Todo listo para empezar!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Crear proyecto en Firebase Console"
    echo "2. Copiar credenciales a .env.local"
    echo "3. Crear Firestore Database"
    echo "4. Ejecutar: npm install"
    echo "5. Ejecutar: npm run dev"
else
    echo -e "${YELLOW}⚠️  Faltan algunos archivos, pero puede ser normal.${NC}"
    echo "Revisa que toda la estructura básica esté presente."
fi

echo ""
echo "Para más información: ver NEXT_STEPS.md"
