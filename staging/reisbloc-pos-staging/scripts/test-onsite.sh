#!/bin/bash

# 🧪 SCRIPT DE TESTING ON-SITE - TPV Solutions
# Ejecutar en la laptop del restaurante

set -e  # Exit on any error

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 TESTING ON-SITE - TPV Solutions${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Paso 1: Verificar Node.js
echo -e "${YELLOW}1️⃣  Verificando Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js no instalado${NC}"
    exit 1
fi

echo ""


# Paso 3: Verificar estructura del proyecto
echo ""
echo -e "${YELLOW}3️⃣  Verificando estructura del proyecto...${NC}"
FILES=(
    "package.json"
    "vite.config.ts"
    "tsconfig.json"
    "src/pages/POS.tsx"
    "src/pages/Kitchen.tsx"
    "src/pages/Admin.tsx"

    "functions/src/index.ts"
    ".env.local"
    "scripts/start-production.sh"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ FALTA: $file${NC}"
        exit 1
    fi
done

# Paso 4: Verificar dependencias
echo ""
echo -e "${YELLOW}4️⃣  Verificando dependencias npm...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules existe${NC}"
else
    echo -e "${YELLOW}⚠ node_modules no existe, instalando...${NC}"
    npm install
fi

# Paso 5: Verificar build
echo ""
echo -e "${YELLOW}5️⃣  Comprobando compilación TypeScript...${NC}"
if npm run build 2>&1 | grep -q "built in"; then
    echo -e "${GREEN}✓ Build exitoso${NC}"
else
    echo -e "${RED}✗ Build falló${NC}"
    exit 1
fi

# Paso 6: Verificar función start-production.sh
echo ""
echo -e "${YELLOW}6️⃣  Verificando script de producción...${NC}"
if [ -x "scripts/start-production.sh" ]; then
    echo -e "${GREEN}✓ scripts/start-production.sh ejecutable${NC}"
else
    echo -e "${YELLOW}⚠ Haciendo scripts/start-production.sh ejecutable...${NC}"
    chmod +x scripts/start-production.sh
fi

# Paso 7: Verificar puertos disponibles
echo ""
echo -e "${YELLOW}7️⃣  Verificando puertos disponibles...${NC}"
PORTS=(4173 8080 9099 5001)
PORTS_AVAILABLE=true

for port in "${PORTS[@]}"; do
    if lsof -ti:$port &> /dev/null; then
        echo -e "${YELLOW}  ⚠ Puerto $port EN USO (proceso existente)${NC}"
        PORTS_AVAILABLE=false
    else
        echo -e "${GREEN}  ✓ Puerto $port disponible${NC}"
    fi
done

if [ "$PORTS_AVAILABLE" = false ]; then
    echo ""
    echo -e "${YELLOW}Puertos en uso detectados. Opciones:${NC}"
    echo "1. Matar procesos: pkill -f 'vite\|node'"
    echo "2. Cambiar puertos en scripts/start-production.sh"
fi

# Paso 8: Obtener IP local
echo ""
echo -e "${YELLOW}8️⃣  Obteniendo IP local...${NC}"
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo -e "${GREEN}✓ IP Local: $LOCAL_IP${NC}"

# Paso 9: Mostrar resumen
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ SISTEMA LISTO PARA TESTING ON-SITE${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}🚀 Para iniciar el sistema:${NC}"
echo ""
echo "  ./scripts/start-production.sh"
echo ""
echo -e "${YELLOW}📱 Acceso desde tablets:${NC}"
echo ""
echo "  http://${LOCAL_IP}:4173"
echo ""
echo -e "${YELLOW}⚙️  Credenciales de test:${NC}"
echo ""
echo "  👤 Admin: pin 1111"
echo "  👨‍💼 Capitán: pin 2222"
echo "  👨‍🍳 Cocina: pin 3333"
echo "  🍹 Bar: pin 4444"
echo ""
echo -e "${YELLOW}📊 Verificaciones a realizar:${NC}"
echo ""
echo "  ✓ Login con diferentes roles"
echo "  ✓ Crear orden (POS)"
echo "  ✓ Recibir en Cocina"
echo "  ✓ Marcar como listo"
echo "  ✓ Pago y reporte"
echo "  ✓ Notificaciones en tiempo real"
echo ""
echo -e "${BLUE}================================================${NC}"

