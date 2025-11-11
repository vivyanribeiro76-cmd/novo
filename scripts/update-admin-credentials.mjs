import pg from 'pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
const { Client } = pg

// Script para atualizar credenciais do admin

async function main() {
  const newEmail = 'fbapaes@gmail.com'
  const newPassword = '1337Kids!'
  const newName = 'Admin FZIA'

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
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  
  console.log('🔐 Atualizando credenciais do admin...\n')

  try {
    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Buscar admin atual
    const { rows } = await client.query(`
      SELECT id, email FROM users WHERE email = 'admin@fzia.com' LIMIT 1
    `)

    if (rows.length === 0) {
      console.error('❌ Admin não encontrado. Execute create-user.mjs primeiro.')
      process.exit(1)
    }

    const adminId = rows[0].id

    // Atualizar credenciais
    await client.query(`
      UPDATE users 
      SET email = $1, password_hash = $2, name = $3
      WHERE id = $4
    `, [newEmail, passwordHash, newName, adminId])

    console.log('✅ Credenciais atualizadas com sucesso!\n')
    console.log('📧 Novo email:', newEmail)
    console.log('🔑 Nova senha:', newPassword)
    console.log('👤 Nome:', newName)
    console.log('\n⚠️  IMPORTANTE: Guarde essas credenciais em local seguro!')

  } catch (e) {
    console.error('❌ Erro ao atualizar credenciais:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
