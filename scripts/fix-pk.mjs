import pg from 'pg'
import fs from 'fs'
import path from 'path'
const { Client } = pg

async function main() {
  let { DATABASE_URL } = process.env
  if ((!DATABASE_URL || DATABASE_URL === '') && process.argv[2]) {
    DATABASE_URL = process.argv[2]
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
    console.log('Dropping and recreating contabilizacao table...')
    await client.query('DROP TABLE IF EXISTS public.contabilizacao CASCADE')
    await client.query(`
      CREATE TABLE public.contabilizacao (
        id SERIAL PRIMARY KEY,
        remotejid TEXT NOT NULL,
        mensagens TEXT,
        agendamento BOOLEAN DEFAULT false,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await client.query('CREATE INDEX idx_contabilizacao_remotejid ON public.contabilizacao(remotejid)')
    await client.query('CREATE INDEX idx_contabilizacao_timestamp ON public.contabilizacao(timestamp)')
    await client.query('ALTER TABLE public.contabilizacao ENABLE ROW LEVEL SECURITY')
    await client.query(`CREATE POLICY "public read contabilizacao" ON public.contabilizacao FOR SELECT USING (true)`)
    await client.query(`CREATE POLICY "public insert contabilizacao" ON public.contabilizacao FOR INSERT WITH CHECK (true)`)
    await client.query(`CREATE POLICY "public update contabilizacao" ON public.contabilizacao FOR UPDATE USING (true)`)
    await client.query("SELECT pg_notify('pgrst', 'reload schema')")
    console.log('Table contabilizacao fixed successfully!')
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
