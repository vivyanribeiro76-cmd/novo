import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

type Conv = { id: string; client_id: string; conversation_id: string; started_at: string }

type Filters = { client_id: string; start: string; end: string }

export default function Dashboard() {
  const today = useMemo(() => new Date(), [])
  const firstDayMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])
  const [filters, setFilters] = useState<Filters>({ client_id: '', start: formatDate(firstDayMonth), end: formatDate(today) })
  const [loading, setLoading] = useState(false)
  const [convs, setConvs] = useState<Conv[]>([])

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      if (!supabase) return
      setLoading(true)
      let query = supabase.from('conversations').select('*').order('started_at', { ascending: true })
      if (filters.client_id) query = query.eq('client_id', filters.client_id)
      if (filters.start) query = query.gte('started_at', filters.start)
      if (filters.end) query = query.lte('started_at', filters.end + 'T23:59:59')
      const { data, error } = await query
      if (!error && data) setConvs(data as any)
      setLoading(false)
    }
    load()
  }, [filters])

  const totals = useMemo(() => {
    const now = new Date()
    const dayStr = formatDate(now)
    const monthStr = now.toISOString().slice(0, 7) // YYYY-MM
    let day = 0, month = 0, all = convs.length
    for (const c of convs) {
      const ds = c.started_at.slice(0, 10)
      if (ds === dayStr) day++
      if (c.started_at.startsWith(monthStr)) month++
    }
    return { day, month, all }
  }, [convs])

  const series = useMemo(() => {
    // group by day
    const map = new Map<string, number>()
    for (const c of convs) {
      const ds = c.started_at.slice(0, 10)
      map.set(ds, (map.get(ds) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
  }, [convs])

  return (
    <div className="space-y-6">
      {getSupabase() === null && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Variáveis do Supabase não configuradas. Informe VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar o dashboard.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-600">Contagem de conversas por período e cliente.</p>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium">Client ID</label>
          <input className="mt-1 w-56 rounded-md border px-3 py-2" value={filters.client_id} onChange={(e)=>setFilters(f=>({...f, client_id: e.target.value}))} placeholder="cliente-123" />
        </div>
        <div>
          <label className="block text-sm font-medium">Início</label>
          <input type="date" className="mt-1 rounded-md border px-3 py-2" value={filters.start} onChange={(e)=>setFilters(f=>({...f, start: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium">Fim</label>
          <input type="date" className="mt-1 rounded-md border px-3 py-2" value={filters.end} onChange={(e)=>setFilters(f=>({...f, end: e.target.value}))} />
        </div>
        <button className="btn-primary" onClick={()=>setFilters({...filters})} disabled={loading}>{loading ? 'Carregando...' : 'Aplicar'}</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-sm text-neutral-500">Hoje</div>
          <div className="text-3xl font-semibold">{totals.day}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-neutral-500">Este mês</div>
          <div className="text-3xl font-semibold">{totals.month}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-neutral-500">Total</div>
          <div className="text-3xl font-semibold">{totals.all}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm font-medium mb-2">Conversas por dia</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} tickMargin={8} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#5b8cff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
