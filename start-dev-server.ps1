Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
Write-Host ""
Write-Host "Servidor será iniciado em: http://localhost:5176" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
npx vite --port 5176 --host
