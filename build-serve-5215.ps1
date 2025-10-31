npm run build
if ($LASTEXITCODE -eq 0) {
    npx --yes serve -s dist -l 5215
}
