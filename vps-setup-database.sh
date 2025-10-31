#!/bin/bash
# Script para configurar banco de dados
# Execute após o build

set -e

cd /var/www/metricai-fzia

echo "🗄️  Configurando banco de dados..."

# 1. Rodar migrations
echo ""
echo "📊 Executando migrations..."
node scripts/migrate.mjs

echo ""
echo "✅ Migrations executadas!"
echo ""
echo "📋 Para criar usuário admin, execute:"
echo 'node scripts/create-user.mjs "admin@fzia.com" "sua-senha-segura" "Admin FZIA"'
