// PM2 configuration for production
module.exports = {
  apps: [{
    name: 'metricai-fzia',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    cwd: '/var/www/metricai-fzia',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
