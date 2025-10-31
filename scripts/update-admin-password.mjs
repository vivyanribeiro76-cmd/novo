import pg from 'pg'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
const { Client } = pg

// Script para atualizar senha do admin com hash bcrypt

async function main() {
  let { DATABASE_URL } = process.env
  if (!DATABASE_URL) {
    try {
      const p = path.resolve(process.cwd(), 'scripts', 'dburl.txt')
      if (fs.existsSync(p)) {
        DATABASE_URL = fs.readFileSync(p, 'utf8').trim()
      }
    } catch {}
  }
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  
  try {
    console.log('Atualizando senha do admin@fzia.com com hash bcrypt...')
    const passwordHash = await bcrypt.hash('admin123', 10)
    
    const result = await client.query(
      'UPDATE public.users SET password_hash = $1 WHERE email = $2 RETURNING email',
      [passwordHash, 'admin@fzia.com']
    )
    
    if (result.rowCount > 0) {
      console.log('✓ Senha atualizada com sucesso!')
      console.log('  Email: admin@fzia.com')
      console.log('  Nova senha: admin123 (com hash bcrypt)')
    } else {
      console.log('✗ Usuário admin@fzia.com não encontrado')
    }
  } catch (e) {
    console.error('✗ Erro ao atualizar senha:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
