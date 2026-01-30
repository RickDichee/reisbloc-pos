#!/bin/bash

# Script de configuración para MercadoPago
# Uso: ./setup-mercadopago.sh

echo "🚀 Configuración de MercadoPago para TPV Solutions"
echo "=================================================="
echo ""

# Verificar si existe .env.local
if [ -f ".env.local" ]; then
    echo "✅ Archivo .env.local encontrado"
else
    echo "⚠️  Creando .env.local desde .env.example..."
    cp .env.example .env.local
    echo "✅ Archivo .env.local creado"
fi

echo ""
echo "📝 Necesitas configurar las siguientes variables en .env.local:"
echo ""
echo "1. VITE_MERCADOPAGO_PUBLIC_KEY"
echo "   - Obtén tu Public Key en: https://www.mercadopago.com.mx/developers/panel/app"
echo ""
echo "2. VITE_MERCADOPAGO_ACCESS_TOKEN"
echo "   - Obtén tu Access Token en: https://www.mercadopago.com.mx/developers/panel/app"
echo ""
echo "3. VITE_APP_URL (opcional)"
echo "   - Para desarrollo: http://localhost:5173"
echo "   - Para producción: tu dominio"
echo ""

# Preguntar si desea abrir el editor
read -p "¿Deseas editar .env.local ahora? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Intentar abrir con el editor preferido
    if command -v code &> /dev/null; then
        echo "📝 Abriendo en VS Code..."
        code .env.local
    elif command -v nano &> /dev/null; then
        echo "📝 Abriendo en nano..."
        nano .env.local
    elif command -v vim &> /dev/null; then
        echo "📝 Abriendo en vim..."
        vim .env.local
    else
        echo "⚠️  No se encontró un editor. Edita manualmente .env.local"
    fi
fi

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📚 Próximos pasos:"
echo "   1. Edita .env.local con tus credenciales de MercadoPago"
echo "   2. Ejecuta: npm install"
echo "   3. Ejecuta: npm run dev"
echo "   4. Consulta MERCADOPAGO_INTEGRATION.md para más detalles"
echo ""
