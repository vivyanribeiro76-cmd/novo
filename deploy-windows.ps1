# Script de deploy do Windows para VPS Linux
# Uso: .\deploy-windows.ps1

Write-Host "🚀 Preparando deploy do MetricAI FZIA..." -ForegroundColor Green

# 1. Verificar se .env.production existe
if (-not (Test-Path ".env.production")) {
    Write-Host "⚠️  Arquivo .env.production não encontrado!" -ForegroundColor Yellow
    Write-Host "Criando a partir do exemplo..." -ForegroundColor Yellow
    Copy-Item ".env.production.example" ".env.production"
    Write-Host "❗ IMPORTANTE: Edite .env.production com suas credenciais Supabase antes de continuar!" -ForegroundColor Red
    Write-Host "Pressione qualquer tecla após editar o arquivo..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# 2. Build do projeto
Write-Host ""
Write-Host "🔨 Fazendo build do projeto..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

# 3. Verificar se build foi criado
if (-not (Test-Path "dist")) {
    Write-Host "❌ Erro: pasta dist não foi criada" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos para deploy na VPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Enviar arquivos via SCP:" -ForegroundColor Yellow
Write-Host "   scp -r dist/* user@seu-servidor:/var/www/metricai-fzia/" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  OU usar Git na VPS:" -ForegroundColor Yellow
Write-Host "   git clone https://github.com/vivyanribeiro76-cmd/novo.git" -ForegroundColor White
Write-Host "   git checkout metricai-config-personalizacao" -ForegroundColor White
Write-Host "   npm install && npm run build" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Configurar Nginx (veja nginx.conf)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4️⃣  Configurar SSL:" -ForegroundColor Yellow
Write-Host "   sudo certbot --nginx -d seu-dominio.com" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Rodar migrations:" -ForegroundColor Yellow
Write-Host "   node scripts/migrate.mjs" -ForegroundColor White
Write-Host ""
Write-Host "📖 Veja DEPLOY.md para instruções completas" -ForegroundColor Cyan
