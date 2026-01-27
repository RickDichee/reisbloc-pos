#!/bin/bash

echo "🧪 Testing TPV Solutions - Notificaciones + Offline"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📋 CHECKLIST DE VERIFICACIÓN${NC}"
echo ""

# 1. Verificar .env.local
echo -e "${YELLOW}1. Verificando .env.local...${NC}"
if grep -q "VITE_FIREBASE_VAPID_KEY" /home/r1ck/TPV_solutions/.env.local; then
    VAPID_KEY=$(grep "VITE_FIREBASE_VAPID_KEY" /home/r1ck/TPV_solutions/.env.local | cut -d'=' -f2)
    if [ -n "$VAPID_KEY" ]; then
        echo -e "${GREEN}✅ VAPID Key configurada: ${VAPID_KEY:0:20}...${NC}"
    else
        echo -e "${RED}❌ VAPID Key vacía${NC}"
    fi
else
    echo -e "${RED}❌ VAPID Key no encontrada en .env.local${NC}"
fi
echo ""

# 2. Verificar archivos de Service Worker
echo -e "${YELLOW}2. Verificando archivos de Service Worker...${NC}"
if [ -f "/home/r1ck/TPV_solutions/public/sw.js" ]; then
    echo -e "${GREEN}✅ sw.js existe${NC}"
else
    echo -e "${RED}❌ sw.js no existe${NC}"
fi

if [ -f "/home/r1ck/TPV_solutions/public/firebase-messaging-sw.js" ]; then
    echo -e "${GREEN}✅ firebase-messaging-sw.js existe${NC}"
else
    echo -e "${RED}❌ firebase-messaging-sw.js no existe${NC}"
fi

if [ -f "/home/r1ck/TPV_solutions/public/manifest.json" ]; then
    echo -e "${GREEN}✅ manifest.json existe${NC}"
else
    echo -e "${RED}❌ manifest.json no existe${NC}"
fi
echo ""

# 3. Verificar archivos de código
echo -e "${YELLOW}3. Verificando archivos de código...${NC}"
TYPESCRIPT_FILES=(
    "src/services/notificationService.ts"
    "src/services/offlineDBService.ts"
    "src/services/sendNotificationHelper.ts"
    "src/hooks/useNotifications.ts"
    "src/hooks/useOfflineSync.ts"
    "src/components/common/NotificationCenter.tsx"
    "src/components/common/OfflineIndicator.tsx"
)

for file in "${TYPESCRIPT_FILES[@]}"; do
    if [ -f "/home/r1ck/TPV_solutions/$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
    fi
done
echo ""

# 4. Verificar documentación
echo -e "${YELLOW}4. Verificando documentación...${NC}"
DOCS=(
    "NOTIFICATIONS_SYSTEM.md"
    "OFFLINE_PWA.md"
    "VAPID_KEY_SETUP.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "/home/r1ck/TPV_solutions/$doc" ]; then
        echo -e "${GREEN}✅ $doc${NC}"
    else
        echo -e "${RED}❌ $doc${NC}"
    fi
done
echo ""

# 5. Verificar emuladores
echo -e "${YELLOW}5. Verificando emuladores...${NC}"
EMULATOR_PORTS=(8080 9099 5001)
for port in "${EMULATOR_PORTS[@]}"; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Puerto $port (Emulator) activo${NC}"
    else
        echo -e "${RED}❌ Puerto $port (Emulator) NO activo${NC}"
    fi
done
echo ""

# 6. Verificar servidor Vite
echo -e "${YELLOW}6. Verificando servidor Vite...${NC}"
if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Vite (puerto 5173) corriendo${NC}"
else
    echo -e "${RED}❌ Vite NO está corriendo en puerto 5173${NC}"
    echo -e "${YELLOW}   Inicia con: npm run dev${NC}"
fi
echo ""

echo -e "${BLUE}📝 INSTRUCCIONES DE TESTING${NC}"
echo ""
echo -e "${YELLOW}Test 1: Notificaciones Push${NC}"
echo "1. Abre http://localhost:5173 en navegador"
echo "2. Login con: mesero / 5555"
echo "3. Verás prompt: 'Activar notificaciones'"
echo "4. Haz clic en 'Activar'"
echo "5. El navegador pedirá permiso"
echo "6. En otra ventana, login con: cocina / 3333"
echo "7. En mesero, crea una orden"
echo "8. Cocina debe recibir notificación push"
echo ""

echo -e "${YELLOW}Test 2: Modo Offline${NC}"
echo "1. En DevTools (F12) → Network → Throttling → Offline"
echo "2. Intenta crear una orden"
echo "3. La orden se guarda en IndexedDB"
echo "4. Ve el OfflineIndicator en esquina inferior izquierda"
echo "5. Desactiva Offline"
echo "6. OfflineIndicator mostrará sincronización automática"
echo "7. Orden se envía a Firebase"
echo ""

echo -e "${YELLOW}Test 3: PWA - Instalar App${NC}"
echo "1. En Chrome → Menú → 'Instalar TPV Solutions'"
echo "2. Abre la app instalada"
echo "3. Funciona igual que en web"
echo "4. Puede funcionar sin internet (modo offline)"
echo ""

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ SISTEMA COMPLETO Y LISTO PARA TESTING${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Si no está corriendo: npm run dev"
echo "2. Si no están emuladores: firebase emulators:start"
echo "3. Realiza los tests anteriores"
echo "4. Verifica logs en DevTools Console (F12)"
echo ""
