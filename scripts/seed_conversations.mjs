import pg from 'pg'
import fs from 'fs'
import path from 'path'

const { Client } = pg

async function getDbUrl() {
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
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set')
  return DATABASE_URL
}

function makeRows(clientId) {
  const now = new Date()
  const days = [0, 1, 2, 3, 4, 5, 6, 7]
  let i = 1
  return days.flatMap(d => {
    const date = new Date(now)
    date.setDate(now.getDate() - d)
    const ts = date.toISOString()
    const n = Math.floor(Math.random() * 3) + 1 // 1..3 conversas por dia
    return Array.from({ length: n }).map(() => ({
      client_id: clientId,
      conversation_id: `seed-${clientId}-${i++}`,
      started_at: ts,
    }))
  })
}

async function main() {
  const clientId = process.argv[3] || '123'
  const DATABASE_URL = await getDbUrl()
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query('begin')
    const rows = makeRows(clientId)
    const insertText = `insert into public.conversations (client_id, conversation_id, started_at) values ${rows.map((_, idx) => `($${idx*3+1}, $${idx*3+2}, $${idx*3+3})`).join(',')}`
    const values = rows.flatMap(r => [r.client_id, r.conversation_id, r.started_at])
    await client.query(insertText, values)
    await client.query('commit')
    console.log(`Seeded ${rows.length} conversations for client_id='${clientId}'.`)
  } catch (e) {
    await client.query('rollback')
    console.error('Seeding failed:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
