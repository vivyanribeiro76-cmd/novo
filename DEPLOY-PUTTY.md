# 🚀 Deploy usando PuTTY - Guia Passo a Passo

## 📋 Informações da VPS
- **IP**: 5.161.180.119
- **Usuário**: root
- **Senha**: 7Ji4qFPtqEem

## 🔧 Passo 1: Conectar via PuTTY

1. Abra o **PuTTY**
2. Em "Host Name (or IP address)", digite: `5.161.180.119`
3. Port: `22`
4. Connection type: `SSH`
5. Clique em **Open**
6. Se aparecer alerta de segurança, clique **Yes**
7. Login: `root`
8. Password: `7Ji4qFPtqEem`

## 📦 Passo 2: Instalar dependências

Copie e cole este comando no terminal PuTTY:

```bash
curl -o- https://raw.githubusercontent.com/vivyanribeiro76-cmd/novo/metricai-config-personalizacao/vps-install.sh | bash
```

**OU** copie e cole linha por linha:

```bash
# Atualizar sistema
apt-get update && apt-get upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar Nginx
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# Instalar Git
apt-get install -y git

# Instalar Certbot
apt-get install -y certbot python3-certbot-nginx

# Criar diretório e clonar projeto
mkdir -p /var/www/metricai-fzia
cd /var/www/metricai-fzia
git clone https://github.com/vivyanribeiro76-cmd/novo.git .
git checkout metricai-config-personalizacao
```

## ⚙️ Passo 3: Configurar variáveis de ambiente

```bash
cd /var/www/metricai-fzia
nano .env.production
```

Cole este conteúdo (substitua com suas credenciais Supabase):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
DATABASE_URL=postgresql://postgres:senha@db.seu-projeto.supabase.co:5432/postgres
```

**Salvar**: `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔨 Passo 4: Build do projeto

```bash
cd /var/www/metricai-fzia
npm install
npm run build
```

Aguarde o build terminar (pode levar alguns minutos).

## 🗄️ Passo 5: Configurar banco de dados

```bash
cd /var/www/metricai-fzia
node scripts/migrate.mjs
node scripts/create-user.mjs "admin@fzia.com" "SuaSenhaSegura123" "Admin FZIA"
```

## 🌐 Passo 6: Configurar Nginx

**Substitua `seu-dominio.com` pelo seu domínio real:**

```bash
DOMAIN="seu-dominio.com"

cat > /etc/nginx/sites-available/metricai-fzia << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/metricai-fzia/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

ln -sf /etc/nginx/sites-available/metricai-fzia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## 🔒 Passo 7: Configurar SSL (HTTPS)

**IMPORTANTE**: Antes de executar, certifique-se que o DNS do seu domínio aponta para o IP `5.161.180.119`

```bash
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Siga as instruções:
- Digite seu email
- Aceite os termos (Y)
- Escolha se quer compartilhar email (N ou Y)
- Escolha opção 2 para redirecionar HTTP para HTTPS

## ✅ Passo 8: Verificar

Acesse no navegador:
- `http://seu-dominio.com` (deve redirecionar para HTTPS)
- `https://seu-dominio.com`

Faça login com:
- Email: `admin@fzia.com`
- Senha: A senha que você definiu no Passo 5

## 🔄 Atualizar aplicação (futuro)

```bash
cd /var/www/metricai-fzia
git pull origin metricai-config-personalizacao
npm install
npm run build
systemctl reload nginx
```

## 🐛 Troubleshooting

### Erro no build
```bash
cd /var/www/metricai-fzia
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Nginx não inicia
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Ver logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 📞 Comandos úteis

```bash
# Ver status Nginx
systemctl status nginx

# Reiniciar Nginx
systemctl restart nginx

# Ver versão Node
node --version

# Ver processos
ps aux | grep node

# Espaço em disco
df -h

# Memória
free -h
```

## 🎉 Pronto!

Seu MetricAI FZIA está no ar em `https://seu-dominio.com`
