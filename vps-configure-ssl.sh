#!/bin/bash
# Script de configuração SSL
# Uso: bash vps-configure-ssl.sh seu-dominio.com

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Domínio não especificado"
  echo "Uso: bash vps-configure-ssl.sh seu-dominio.com"
  exit 1
fi

DOMAIN=$1

echo "🔒 Configurando SSL para $DOMAIN..."

# Obter certificado SSL
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo ""
echo "✅ SSL configurado com sucesso!"
echo ""
echo "🎉 Deploy concluído!"
echo "Acesse: https://$DOMAIN"
