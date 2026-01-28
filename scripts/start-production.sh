#!/bin/bash

# 🚀 TPV Solutions - Script de Producción Onsite
# Este script inicia el sistema completo para uso en restaurante

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║          🍽️  TPV SOLUTIONS - PRODUCCIÓN  🍽️           ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo -e "${YELLOW}   Asegúrate de ejecutar este script desde el directorio del proyecto${NC}"
    exit 1
fi

# 2. Limpiar puertos ocupados
echo -e "${YELLOW}🧹 Limpiando puertos...${NC}"
lsof -ti:4000,4173,5001,8080,9099,9199 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

# 3. Verificar que exista emulator-data
if [ ! -d "emulator-data" ]; then
    echo -e "${YELLOW}⚠️  No se encontró emulator-data, creando datos iniciales...${NC}"
    mkdir -p emulator-data
fi

# 4. Build del frontend
echo -e "${YELLOW}🔨 Compilando aplicación...${NC}"
if ! npm run build > /tmp/tpv-build.log 2>&1; then
    echo -e "${RED}❌ Error al compilar${NC}"
    echo -e "${YELLOW}   Ver logs en: /tmp/tpv-build.log${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Aplicación compilada${NC}"

# 5. Crear backup de datos actuales
if [ -d "emulator-data" ] && [ "$(ls -A emulator-data 2>/dev/null)" ]; then
    BACKUP_DIR="backups/backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${YELLOW}💾 Creando backup en: $BACKUP_DIR${NC}"
    mkdir -p backups
    cp -r emulator-data "$BACKUP_DIR"
    echo -e "${GREEN}✅ Backup creado${NC}"
fi

# 6. Obtener IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi



# 8. Iniciar Vite preview en background
echo -e "${YELLOW}🌐 Iniciando servidor web...${NC}"
npm run preview -- --host --port 4173 > /tmp/tpv-vite.log 2>&1 &
VITE_PID=$!

# Esperar a que Vite esté listo
sleep 3
if ! curl -s http://localhost:4173 > /dev/null 2>&1; then
    echo -e "${RED}❌ Error al iniciar servidor web${NC}"
    echo -e "${YELLOW}   Ver logs en: /tmp/tpv-vite.log${NC}"
    kill $EMULATORS_PID $VITE_PID 2>/dev/null || true
    exit 1
fi

# 9. Mostrar información de acceso
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║              ✅  SISTEMA INICIADO  ✅                  ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📱 Acceso desde esta computadora:${NC}"
echo -e "   ${YELLOW}http://localhost:4173${NC}"
echo ""
echo -e "${BLUE}📱 Acceso desde tablets/móviles (misma red WiFi):${NC}"
echo -e "   ${YELLOW}http://${LOCAL_IP}:4173${NC}"
echo ""

echo ""
echo -e "${BLUE}📊 Logs en tiempo real:${NC}"
echo -e "   Emulators: ${YELLOW}tail -f /tmp/tpv-emulators.log${NC}"
echo -e "   Web:       ${YELLOW}tail -f /tmp/tpv-vite.log${NC}"
echo ""
echo -e "${BLUE}💾 Backups automáticos:${NC}"
echo -e "   Se guardan en: ${YELLOW}./backups/${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE:${NC}"
echo -e "   ${YELLOW}• Mantén esta ventana abierta${NC}"
echo -e "   ${YELLOW}• Para detener: Ctrl+C (datos se guardan automáticamente)${NC}"
echo -e "   ${YELLOW}• Conecta tablets a la misma red WiFi${NC}"
echo ""

# 10. Guardar PIDs para poder matar después
echo $EMULATORS_PID > /tmp/tpv-emulators.pid
echo $VITE_PID > /tmp/tpv-vite.pid

# 11. Función de limpieza al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Deteniendo sistema...${NC}"
    
    # Matar procesos
    kill $VITE_PID 2>/dev/null || true
    kill $EMULATORS_PID 2>/dev/null || true
    
    # Esperar a que se exporten los datos
    echo -e "${YELLOW}💾 Guardando datos...${NC}"
    sleep 5
    
    # Crear backup final
    if [ -d "emulator-data" ]; then
        FINAL_BACKUP="backups/backup-final-$(date +%Y%m%d-%H%M%S)"
        mkdir -p backups
        cp -r emulator-data "$FINAL_BACKUP"
        echo -e "${GREEN}✅ Backup final: $FINAL_BACKUP${NC}"
    fi
    
    echo -e "${GREEN}✅ Sistema detenido correctamente${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# 12. Mantener script corriendo
echo -e "${GREEN}🟢 Sistema en ejecución...${NC}"
echo -e "${YELLOW}   Presiona Ctrl+C para detener${NC}"
echo ""

# Mostrar estadísticas cada 30 segundos
while true; do
    sleep 30
    TIMESTAMP=$(date '+%H:%M:%S')
    echo -e "${BLUE}[${TIMESTAMP}] Sistema operando... (Ctrl+C para detener)${NC}"
done
