# Deploy completo na VPS
$VPS_IP = "5.161.180.119"
$VPS_USER = "root"
$VPS_PASS = "7Ji4qFPtqEem"

Write-Host "🚀 Iniciando deploy na VPS $VPS_IP..." -ForegroundColor Green

# 1. Verificar sistema
Write-Host "`n📋 Verificando sistema..." -ForegroundColor Cyan
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} 'uname -a'

# 2. Instalar Node.js se necessário
Write-Host "`n📦 Instalando Node.js..." -ForegroundColor Cyan
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} @'
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
node --version
npm --version
'@

# 3. Instalar Nginx
Write-Host "`n🌐 Instalando Nginx..." -ForegroundColor Cyan
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} @'
apt-get update
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
nginx -v
'@

# 4. Criar diretório do projeto
Write-Host "`n📁 Criando diretório do projeto..." -ForegroundColor Cyan
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} @'
mkdir -p /var/www/metricai-fzia
cd /var/www/metricai-fzia
'@

# 5. Clonar repositório
Write-Host "`n📥 Clonando repositório..." -ForegroundColor Cyan
sshpass -p $VPS_PASS ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} @'
cd /var/www/metricai-fzia
git clone https://github.com/vivyanribeiro76-cmd/novo.git .
git checkout metricai-config-personalizacao
'@

Write-Host "`n✅ Instalação básica concluída!" -ForegroundColor Green
Write-Host "`n📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure .env.production na VPS" -ForegroundColor White
Write-Host "2. Rode: npm install && npm run build" -ForegroundColor White
Write-Host "3. Configure Nginx" -ForegroundColor White
Write-Host "4. Configure SSL com certbot" -ForegroundColor White
