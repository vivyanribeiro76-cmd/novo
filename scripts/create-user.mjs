import pg from 'pg'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
const { Client } = pg

// Script para criar usuário inicial
// Uso: node scripts/create-user.mjs email@example.com senha123 "Nome do Usuário"

async function main() {
  const [email, password, name] = process.argv.slice(2)
  
  if (!email || !password) {
    console.error('Uso: node scripts/create-user.mjs <email> <senha> [nome]')
    console.error('Exemplo: node scripts/create-user.mjs admin@fzia.com senha123 "Admin FZIA"')
    process.exit(1)
  }

  let { DATABASE_URL } = process.env
  if ((!DATABASE_URL || DATABASE_URL === '') && process.argv[5]) {
    DATABASE_URL = process.argv[5]
  }
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
    // Gerar hash bcrypt da senha (10 rounds)
    console.log('Gerando hash da senha...')
    const passwordHash = await bcrypt.hash(password, 10)
    
    const result = await client.query(
      'INSERT INTO public.users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name || null]
    )
    
    console.log('✓ Usuário criado com sucesso!')
    console.log('  Email:', result.rows[0].email)
    console.log('  Nome:', result.rows[0].name || '(não informado)')
    console.log('  ID:', result.rows[0].id)
    console.log('\nVocê pode fazer login com:')
    console.log('  Email:', email)
    console.log('  Senha:', password)
  } catch (e) {
    if (e.code === '23505') {
      console.error('✗ Erro: Email já cadastrado')
    } else {
      console.error('✗ Erro ao criar usuário:', e.message)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
