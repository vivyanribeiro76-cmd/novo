#!/bin/bash
# Script de configuração do Nginx
# Uso: bash vps-configure-nginx.sh seu-dominio.com

set -e

if [ -z "$1" ]; then
  echo "❌ Erro: Domínio não especificado"
  echo "Uso: bash vps-configure-nginx.sh seu-dominio.com"
  exit 1
fi

DOMAIN=$1

echo "🌐 Configurando Nginx para $DOMAIN..."

# 1. Criar configuração Nginx
cat > /etc/nginx/sites-available/metricai-fzia << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/metricai-fzia/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# 2. Criar link simbólico
ln -sf /etc/nginx/sites-available/metricai-fzia /etc/nginx/sites-enabled/

# 3. Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# 4. Testar configuração
nginx -t

# 5. Reiniciar Nginx
systemctl restart nginx

echo ""
echo "✅ Nginx configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Certifique-se que o DNS do domínio $DOMAIN aponta para este servidor"
echo "2. Execute: bash vps-configure-ssl.sh $DOMAIN"
