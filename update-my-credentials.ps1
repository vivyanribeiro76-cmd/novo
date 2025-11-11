Write-Host "🔐 Atualizando credenciais do admin..." -ForegroundColor Green
Write-Host ""
Write-Host "Novo email: fbapaes@gmail.com" -ForegroundColor Cyan
Write-Host "Nova senha: 1337Kids!" -ForegroundColor Cyan
Write-Host ""

node scripts/update-admin-credentials.mjs

Write-Host ""
Write-Host "✅ Credenciais atualizadas!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora você pode fazer login com:" -ForegroundColor Yellow
Write-Host "  Email: fbapaes@gmail.com" -ForegroundColor White
Write-Host "  Senha: 1337Kids!" -ForegroundColor White
