#!/bin/bash

# 🚀 Quick Setup Script - TPV Solutions
# Este script automatiza los pasos básicos de setup

set -e  # Exit on error

echo "🚀 Iniciando setup de TPV Solutions..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Check Node.js
echo -e "${BLUE}Step 1: Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Descarga de https://nodejs.org (versión 16 o superior)"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version) encontrado${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Instalando dependencias...${NC}"
if [ -d "node_modules" ]; then
    echo "✓ Dependencias ya instaladas"
else
    npm install
fi
echo ""

# Step 3: Create .env.local
echo -e "${BLUE}Step 3: Configurando variables de entorno...${NC}"
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local no encontrado"
    echo "Necesitarás:"
    echo "1. Crear un proyecto en Firebase Console: https://console.firebase.google.com"
    echo "2. Obtener tus credenciales de Firebase"
    echo "3. Copiar el contenido de .env.example a .env.local"
    echo "4. Reemplazar los valores con tus credenciales"
    echo ""
    echo "Ejemplo:"
    echo "  cp .env.example .env.local"
    echo "  nano .env.local  # Editar con tus credenciales"
    echo ""
fi
echo ""

# Step 4: Verify structure
echo -e "${BLUE}Step 4: Verificando estructura del proyecto...${NC}"
bash verify-setup.sh
echo ""

# Step 5: Ready to start
echo -e "${GREEN}✨ Setup completado!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Editar .env.local con tus credenciales de Firebase"
echo "2. Crear Firestore Database en Firebase Console"
echo "3. Ejecutar: npm run dev"
echo "4. Visita: http://localhost:5173"
echo ""
echo -e "${YELLOW}⚠️  Importante:${NC}"
echo "- No commitees .env.local a Git"
echo "- Mantén tus credenciales seguras"
echo "- Usa Firebase Emulator para desarrollo local"
echo ""
