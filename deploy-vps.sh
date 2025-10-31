#!/bin/bash
# Script de deploy para VPS
# Uso: ./deploy-vps.sh

echo "🚀 Iniciando deploy do MetricAI FZIA..."

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# 3. Verificar se build foi criado
if [ ! -d "dist" ]; then
  echo "❌ Erro: pasta dist não foi criada"
  exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copie a pasta 'dist' para sua VPS: scp -r dist/* user@seu-servidor:/var/www/metricai-fzia/"
echo "2. Configure o Nginx (veja nginx.conf)"
echo "3. Inicie o PM2: pm2 start ecosystem.config.cjs"
echo "4. Configure SSL com certbot"
