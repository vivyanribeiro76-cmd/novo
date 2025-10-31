#!/bin/bash
# Script de build e configuração
# Execute após configurar .env.production

set -e

echo "🔨 Iniciando build do projeto..."

cd /var/www/metricai-fzia

# 1. Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# 2. Build do projeto
echo ""
echo "🔨 Fazendo build..."
npm run build

# 3. Verificar build
if [ ! -d "dist" ]; then
  echo "❌ Erro: pasta dist não foi criada"
  exit 1
fi

echo ""
echo "✅ Build concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute: bash vps-configure-nginx.sh SEU_DOMINIO"
echo "   Exemplo: bash vps-configure-nginx.sh metricai.com"
