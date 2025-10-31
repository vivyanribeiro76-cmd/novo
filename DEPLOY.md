# 🚀 Guia de Deploy - MetricAI FZIA

## Pré-requisitos na VPS

1. **Node.js** (v18 ou superior)
2. **Nginx**
3. **PM2** (opcional, para gerenciar processo)
4. **Certbot** (para SSL)

## 📦 Passo 1: Preparar o projeto localmente

```bash
# 1. Criar arquivo .env.production com suas credenciais Supabase
cp .env.production.example .env.production
# Edite .env.production com suas credenciais reais

# 2. Fazer build do projeto
npm install
npm run build
```

## 🌐 Passo 2: Configurar VPS

### 2.1 Instalar dependências na VPS

```bash
# Conectar na VPS
ssh user@seu-servidor

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (opcional)
sudo npm install -g pm2

# Instalar Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2.2 Criar diretório do projeto

```bash
sudo mkdir -p /var/www/metricai-fzia
sudo chown -R $USER:$USER /var/www/metricai-fzia
```

## 📤 Passo 3: Enviar arquivos para VPS

### Opção A: Via SCP (do seu computador local)

```bash
# Enviar pasta dist
scp -r dist/* user@seu-servidor:/var/www/metricai-fzia/

# Enviar ecosystem.config.cjs (se usar PM2)
scp ecosystem.config.cjs user@seu-servidor:/var/www/metricai-fzia/
```

### Opção B: Via Git (recomendado)

```bash
# Na VPS
cd /var/www/metricai-fzia
git clone https://github.com/vivyanribeiro76-cmd/novo.git .
git checkout metricai-config-personalizacao

# Criar .env.production
nano .env.production
# Cole suas credenciais Supabase

# Build
npm install
npm run build
```

## 🔧 Passo 4: Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/metricai-fzia

# Editar com seu domínio
sudo nano /etc/nginx/sites-available/metricai-fzia
# Substitua "seu-dominio.com" pelo seu domínio real

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/metricai-fzia /etc/nginx/sites-enabled/

# Remover configuração padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 Passo 5: Configurar SSL (HTTPS)

```bash
# Obter certificado SSL gratuito
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Certbot vai configurar automaticamente o Nginx
# Escolha opção 2 para redirecionar HTTP para HTTPS

# Testar renovação automática
sudo certbot renew --dry-run
```

## 🚀 Passo 6: Iniciar aplicação (Opcional com PM2)

```bash
# Instalar serve globalmente
npm install -g serve

# Iniciar com PM2
cd /var/www/metricai-fzia
pm2 start ecosystem.config.cjs

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
# Execute o comando que o PM2 mostrar

# Ver logs
pm2 logs metricai-fzia

# Ver status
pm2 status
```

## 🗄️ Passo 7: Configurar banco de dados

```bash
# Rodar migrations no Supabase
node scripts/migrate.mjs

# Criar usuário admin
node scripts/create-user.mjs "admin@fzia.com" "sua-senha-segura" "Admin FZIA"
```

## ✅ Verificar deploy

1. Acesse: `http://seu-dominio.com` (ou `https://` se configurou SSL)
2. Faça login com as credenciais criadas
3. Teste Dashboard e Settings

## 🔄 Atualizar aplicação

```bash
# Na VPS
cd /var/www/metricai-fzia
git pull origin metricai-config-personalizacao
npm install
npm run build

# Se usar PM2
pm2 restart metricai-fzia

# Se usar Nginx direto
sudo systemctl reload nginx
```

## 🐛 Troubleshooting

### Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Ver logs
pm2 logs metricai-fzia
```

### Erro de permissão
```bash
sudo chown -R $USER:$USER /var/www/metricai-fzia
sudo chmod -R 755 /var/www/metricai-fzia
```

### Nginx não inicia
```bash
# Ver erro
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

## 📊 Monitoramento

```bash
# Ver logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Ver logs PM2
pm2 logs metricai-fzia

# Monitorar recursos
pm2 monit
```

## 🔐 Segurança adicional

1. **Firewall**:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Fail2ban** (proteção contra brute force):
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

3. **Atualizações automáticas**:
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📞 Suporte

Se tiver problemas, verifique:
- Logs do Nginx: `/var/log/nginx/`
- Logs do PM2: `pm2 logs`
- Status dos serviços: `sudo systemctl status nginx`
