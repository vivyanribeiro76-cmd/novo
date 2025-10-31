#!/bin/bash
# Script de instalação completa na VPS
# Execute este script após conectar via PuTTY

set -e  # Parar em caso de erro

echo "🚀 Iniciando instalação do MetricAI FZIA..."

# 1. Atualizar sistema
echo ""
echo "📦 Atualizando sistema..."
apt-get update
apt-get upgrade -y

# 2. Instalar Node.js 18
echo ""
echo "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
echo "✅ Node.js instalado: $(node --version)"
echo "✅ NPM instalado: $(npm --version)"

# 3. Instalar Nginx
echo ""
echo "🌐 Instalando Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
echo "✅ Nginx instalado: $(nginx -v 2>&1)"

# 4. Instalar Git
echo ""
echo "📦 Instalando Git..."
apt-get install -y git
echo "✅ Git instalado: $(git --version)"

# 5. Instalar Certbot para SSL
echo ""
echo "🔒 Instalando Certbot..."
apt-get install -y certbot python3-certbot-nginx
echo "✅ Certbot instalado"

# 6. Criar diretório do projeto
echo ""
echo "📁 Criando diretório do projeto..."
mkdir -p /var/www/metricai-fzia
cd /var/www/metricai-fzia

# 7. Clonar repositório
echo ""
echo "📥 Clonando repositório..."
git clone https://github.com/vivyanribeiro76-cmd/novo.git .
git checkout metricai-config-personalizacao

echo ""
echo "✅ Instalação básica concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure .env.production com suas credenciais Supabase"
echo "2. Execute: cd /var/www/metricai-fzia && bash vps-build.sh"
