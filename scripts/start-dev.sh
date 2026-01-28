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
killall -9 node 2>/dev/null
sleep 1

echo -e "${BLUE}⚙️  Cloud Functions eliminadas."

echo -e "${BLUE}🔧 Emuladores de Firebase eliminados."

echo -e "${BLUE}📦 Carga de datos de prueba eliminada."

# 5. Iniciar app de desarrollo
echo -e "${BLUE}🌐 Iniciando servidor de desarrollo...${NC}"
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

echo ""
echo -e "${GREEN}✅ Entorno iniciado correctamente!${NC}"
echo ""
echo -e "📊 Servicios corriendo:"
echo -e "  - Vite Dev Server: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "📋 Logs:"
echo -e "  - Vite: ${YELLOW}tail -f /tmp/vite-dev.log${NC}"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Esperar a que el usuario detenga el script
wait

# Cleanup on exit
trap "echo -e '\n${YELLOW}🛑 Deteniendo servicios...${NC}'; kill $VITE_PID 2>/dev/null; killall -9 node 2>/dev/null; exit 0" INT TERM
