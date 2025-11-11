import pg from 'pg'
import fs from 'fs'
import path from 'path'
const { Client } = pg

// Script para adicionar índices de performance no banco

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
  
  console.log('📊 Adicionando índices de performance...\n')

  try {
    // Índice na coluna timestamp da tabela contabilizacao (mais consultada)
    console.log('1. Criando índice em contabilizacao.timestamp...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contabilizacao_timestamp 
      ON public.contabilizacao(timestamp DESC);
    `)
    console.log('   ✅ Índice criado: idx_contabilizacao_timestamp')

    // Índice na coluna remotejid (usado em agrupamentos)
    console.log('2. Criando índice em contabilizacao.remotejid...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contabilizacao_remotejid 
      ON public.contabilizacao(remotejid);
    `)
    console.log('   ✅ Índice criado: idx_contabilizacao_remotejid')

    // Índice composto para queries com filtro de data + remotejid
    console.log('3. Criando índice composto timestamp + remotejid...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contabilizacao_timestamp_remotejid 
      ON public.contabilizacao(timestamp DESC, remotejid);
    `)
    console.log('   ✅ Índice criado: idx_contabilizacao_timestamp_remotejid')

    // Índice para agendamentos
    console.log('4. Criando índice em contabilizacao.agendamento...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contabilizacao_agendamento 
      ON public.contabilizacao(agendamento) 
      WHERE agendamento = true;
    `)
    console.log('   ✅ Índice criado: idx_contabilizacao_agendamento (partial index)')

    // Índice na tabela users (email usado no login)
    console.log('5. Criando índice em users.email...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON public.users(email);
    `)
    console.log('   ✅ Índice criado: idx_users_email')

    console.log('\n✅ Todos os índices foram criados com sucesso!')
    console.log('\n📈 Performance melhorada para:')
    console.log('   - Queries por período (timestamp)')
    console.log('   - Agrupamento por telefone (remotejid)')
    console.log('   - Filtros de agendamento')
    console.log('   - Login de usuários (email)')

  } catch (e) {
    console.error('❌ Erro ao criar índices:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
