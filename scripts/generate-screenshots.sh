#!/bin/bash

# 🎨 Generador de Screenshots para Presentación al Cliente
# Toma capturas de pantalla de la interfaz sin exponer información sensible

set -e

SCREENSHOTS_DIR="docs/screenshots"
TEMP_DIR="/tmp/tpv-screenshots"

echo "📸 Generador de Screenshots Seguros"
echo "===================================="
echo ""

# Verificar que ImageMagick esté instalado (para censura)
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick no está instalado"
    echo "   Instalar con: sudo apt install imagemagick"
    echo ""
    echo "   Las screenshots se tomarán sin censura automática"
    CENSURE=false
else
    CENSURE=true
fi

# Crear directorios
mkdir -p "$SCREENSHOTS_DIR"
mkdir -p "$TEMP_DIR"

echo "📁 Screenshots se guardarán en: $SCREENSHOTS_DIR"
echo ""

cat << 'EOF'
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  🎯 INSTRUCCIONES PARA TOMAR SCREENSHOTS                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

1️⃣  Asegúrate de que el sistema esté corriendo:
   ./scripts/start-production.sh

2️⃣  Navega a cada pantalla y toma screenshot con:
   - Linux: gnome-screenshot -a (seleccionar área)
   - macOS: Cmd+Shift+4
   - Windows: Win+Shift+S

3️⃣  Guarda las capturas con estos nombres en docs/screenshots/:

   OBLIGATORIAS:
   ✅ 01-login.png              # Pantalla de login
   ✅ 02-pos-productos.png      # Vista POS con productos
   ✅ 03-pos-orden.png          # Vista POS con orden activa
   ✅ 04-cocina.png             # Vista de cocina
   ✅ 05-ordenes-listas.png     # Órdenes listas para servir
   ✅ 06-admin-dashboard.png    # Panel admin
   ✅ 07-cierre-caja.png        # Cierre de caja

   OPCIONALES:
   ✅ 08-reportes.png           # Vista de reportes
   ✅ 09-productos-admin.png    # Gestión de productos
   ✅ 10-usuarios-admin.png     # Gestión de usuarios

4️⃣  ⚠️  ANTES DE GUARDAR, VERIFICAR:
   • NO aparecen credenciales
   • NO aparece información real de clientes
   • NO aparecen URLs completas
   • NO aparece información personal

5️⃣  Ejecutar este script de nuevo para procesar:
   ./scripts/generate-screenshots.sh

═══════════════════════════════════════════════════════════

EOF

# Contar screenshots existentes
EXISTING=$(ls -1 "$SCREENSHOTS_DIR"/*.png 2>/dev/null | wc -l)

if [ "$EXISTING" -eq 0 ]; then
    echo "📭 No se encontraron screenshots todavía"
    echo "   Sigue las instrucciones arriba para tomarlas"
    exit 0
fi

echo "📊 Screenshots encontradas: $EXISTING"
echo ""

# Procesar cada screenshot
for img in "$SCREENSHOTS_DIR"/*.png; do
    filename=$(basename "$img")
    echo "🔍 Procesando: $filename"
    
    # Si ImageMagick está disponible, agregar marca de agua
    if [ "$CENSURE" = true ]; then
        convert "$img" \
            -gravity SouthEast \
            -pointsize 20 \
            -fill "rgba(100,100,100,0.3)" \
            -annotate +10+10 "TPV Solutions - Demo" \
            "$TEMP_DIR/$filename"
        
        # Reemplazar original con versión marcada
        mv "$TEMP_DIR/$filename" "$img"
        echo "   ✅ Marca de agua agregada"
    fi
done

echo ""
echo "✅ Procesamiento completado"
echo ""
echo "📂 Screenshots listas en: $SCREENSHOTS_DIR"
echo ""
echo "🎁 PRÓXIMOS PASOS:"
echo "   1. Revisar cada imagen manualmente"
echo "   2. Eliminar cualquiera que muestre info sensible"
echo "   3. Compartir carpeta completa con cliente"
echo ""

# Generar índice HTML para previsualización
cat > "$SCREENSHOTS_DIR/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TPV Solutions - Screenshots Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 40px;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        .screenshot {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .screenshot img {
            width: 100%;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .screenshot h3 {
            margin: 15px 0 5px;
            color: #555;
        }
        .screenshot p {
            color: #777;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <h1>🍽️ TPV Solutions - Capturas del Sistema</h1>
    <div class="gallery">
HTMLEOF

# Agregar cada screenshot al HTML
for img in "$SCREENSHOTS_DIR"/*.png; do
    filename=$(basename "$img")
    name="${filename%.*}"
    
    # Generar título descriptivo
    case "$filename" in
        01-login*)
            title="Login Seguro"
            desc="Autenticación por PIN de 4 dígitos"
            ;;
        02-pos-productos*)
            title="POS - Productos"
            desc="Grid de productos con filtros por categoría"
            ;;
        03-pos-orden*)
            title="POS - Orden Activa"
            desc="Vista de orden con productos agregados"
            ;;
        04-cocina*)
            title="Vista de Cocina"
            desc="Órdenes activas en preparación"
            ;;
        05-ordenes-listas*)
            title="Órdenes Listas"
            desc="Platillos listos para servir"
            ;;
        06-admin-dashboard*)
            title="Panel de Administración"
            desc="Dashboard con métricas y controles"
            ;;
        07-cierre-caja*)
            title="Cierre de Caja"
            desc="Reporte de ventas y distribución de propinas"
            ;;
        *)
            title="$name"
            desc="Captura del sistema"
            ;;
    esac
    
    cat >> "$SCREENSHOTS_DIR/index.html" << HTMLEOF2
        <div class="screenshot">
            <img src="$filename" alt="$title">
            <h3>$title</h3>
            <p>$desc</p>
        </div>
HTMLEOF2
done

cat >> "$SCREENSHOTS_DIR/index.html" << 'HTMLEOF3'
    </div>
</body>
</html>
HTMLEOF3

echo "🌐 Previsualización HTML generada:"
echo "   file://$PWD/$SCREENSHOTS_DIR/index.html"
echo ""
echo "   Abre en navegador para revisar todas las capturas"
echo ""

# Limpiar temporales
rm -rf "$TEMP_DIR"

echo "🔒 RECORDATORIO DE SEGURIDAD:"
echo "   ⚠️  Revisa cada imagen antes de compartir"
echo "   ⚠️  NO compartas si aparece información sensible"
echo "   ⚠️  Elimina cualquier captura con credenciales"
echo ""
