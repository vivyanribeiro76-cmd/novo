# Script para executar add-indexes.mjs na VPS via SSH
# Requer PuTTY instalado

Write-Host "📊 Executando criação de índices na VPS..." -ForegroundColor Green
Write-Host ""
Write-Host "Conecte-se na VPS via PuTTY e execute:" -ForegroundColor Yellow
Write-Host ""
Write-Host "cd /var/www/metricai-fzia" -ForegroundColor White
Write-Host "node scripts/add-indexes.mjs" -ForegroundColor White
Write-Host ""
Write-Host "Isso irá criar 5 índices para melhorar a performance:" -ForegroundColor Cyan
Write-Host "  1. idx_contabilizacao_timestamp" -ForegroundColor White
Write-Host "  2. idx_contabilizacao_remotejid" -ForegroundColor White
Write-Host "  3. idx_contabilizacao_timestamp_remotejid" -ForegroundColor White
Write-Host "  4. idx_contabilizacao_agendamento" -ForegroundColor White
Write-Host "  5. idx_users_email" -ForegroundColor White
Write-Host ""
Write-Host "Performance esperada: 5-10x mais rápido! 🚀" -ForegroundColor Green
