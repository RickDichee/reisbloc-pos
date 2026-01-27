#!/bin/bash

# Script para iniciar el entorno de desarrollo completo
# Uso: ./start-dev.sh

echo "🚀 Iniciando entorno de desarrollo TPV Solutions..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Limpiar procesos anteriores
echo -e "${YELLOW}🧹 Limpiando procesos anteriores...${NC}"
killall -9 firebase node 2>/dev/null
sleep 1

# 2. Compilar Cloud Functions
echo -e "${BLUE}⚙️  Compilando Cloud Functions...${NC}"
cd functions && npm run build
cd ..

# 3. Iniciar emuladores en background
echo -e "${BLUE}🔧 Iniciando emuladores de Firebase...${NC}"
firebase emulators:start --only functions,auth,firestore > /tmp/firebase-emulators.log 2>&1 &
EMULATOR_PID=$!

# Esperar a que los emuladores estén listos
echo -e "${YELLOW}⏳ Esperando a que emuladores estén listos...${NC}"
for i in {1..15}; do
  if lsof -ti:8080,9099,5001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Emuladores listos!${NC}"
    break
  fi
  sleep 1
  echo -n "."
done

# 4. Cargar datos de prueba
echo -e "${BLUE}📦 Cargando datos de prueba...${NC}"
node seed-emulators.js

# 5. Iniciar app de desarrollo
echo -e "${BLUE}🌐 Iniciando servidor de desarrollo...${NC}"
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

echo ""
echo -e "${GREEN}✅ Entorno iniciado correctamente!${NC}"
echo ""
echo -e "📊 Servicios corriendo:"
echo -e "  - Firebase Emulators UI: ${BLUE}http://localhost:4000${NC}"
echo -e "  - Vite Dev Server: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "📋 Logs:"
echo -e "  - Emulators: ${YELLOW}tail -f /tmp/firebase-emulators.log${NC}"
echo -e "  - Vite: ${YELLOW}tail -f /tmp/vite-dev.log${NC}"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Esperar a que el usuario detenga el script
wait

# Cleanup on exit
trap "echo -e '\n${YELLOW}🛑 Deteniendo servicios...${NC}'; kill $EMULATOR_PID $VITE_PID 2>/dev/null; killall -9 firebase node 2>/dev/null; exit 0" INT TERM
