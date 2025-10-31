import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Legend } from 'recharts'

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

type Registro = { remotejid: string; mensagens: string; agendamento: boolean; timestamp: string }

type Filters = { start: string; end: string }

export default function Dashboard() {
  const today = useMemo(() => new Date(), [])
  const firstDayMonth = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today])
  const [filters, setFilters] = useState<Filters>({ start: formatDate(firstDayMonth), end: formatDate(today) })
  const [loading, setLoading] = useState(false)
  const [registros, setRegistros] = useState<Registro[]>([])

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      if (!supabase) return
      setLoading(true)
      let query = supabase.from('contabilizacao').select('*').order('timestamp', { ascending: true })
      if (filters.start) query = query.gte('timestamp', filters.start)
      if (filters.end) query = query.lte('timestamp', filters.end + 'T23:59:59')
      const { data, error } = await query
      if (!error && data) setRegistros(data as any)
      setLoading(false)
    }
    load()
  }, [filters])

  // Agrupar conversas: mesmo remotejid em janela de 24h = 1 conversa
  const conversas = useMemo(() => {
    const groups = new Map<string, { remotejid: string; firstMsg: Date; lastMsg: Date }[]>()
    for (const r of registros) {
      const ts = new Date(r.timestamp)
      if (!groups.has(r.remotejid)) groups.set(r.remotejid, [])
      const arr = groups.get(r.remotejid)!
      // Encontrar grupo existente dentro de 24h
      let found = false
      for (const g of arr) {
        const diff = Math.abs(ts.getTime() - g.lastMsg.getTime())
        if (diff <= 24 * 60 * 60 * 1000) {
          g.lastMsg = ts > g.lastMsg ? ts : g.lastMsg
          g.firstMsg = ts < g.firstMsg ? ts : g.firstMsg
          found = true
          break
        }
      }
      if (!found) arr.push({ remotejid: r.remotejid, firstMsg: ts, lastMsg: ts })
    }
    const allConvs: { remotejid: string; firstMsg: Date; lastMsg: Date }[] = []
    for (const arr of groups.values()) allConvs.push(...arr)
    return allConvs
  }, [registros])

  const totalMensagens = registros.length
  const totalConversas = conversas.length
  
  // Agendamentos: contar 1 vez por remotejid único que tenha pelo menos 1 agendamento
  const totalAgendamentos = useMemo(() => {
    const set = new Set<string>()
    for (const r of registros) {
      if (r.agendamento === true) set.add(r.remotejid)
    }
    return set.size
  }, [registros])

  const telefonesUnicos = useMemo(() => {
    const set = new Set<string>()
    for (const r of registros) set.add(r.remotejid)
    return set.size
  }, [registros])

  const seriesLinhas = useMemo(() => {
    // Agrupar por dia: conversas e mensagens
    const mapConvs = new Map<string, number>()
    const mapMsgs = new Map<string, number>()
    for (const c of conversas) {
      const ds = formatDate(c.firstMsg)
      mapConvs.set(ds, (mapConvs.get(ds) ?? 0) + 1)
    }
    for (const r of registros) {
      const ds = r.timestamp.slice(0, 10)
      mapMsgs.set(ds, (mapMsgs.get(ds) ?? 0) + 1)
    }
    const allDates = new Set([...mapConvs.keys(), ...mapMsgs.keys()])
    return Array.from(allDates).sort().map(date => ({
      date,
      conversas: mapConvs.get(date) ?? 0,
      mensagens: mapMsgs.get(date) ?? 0
    }))
  }, [conversas, registros])

  const pieData = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of conversas) {
      map.set(c.remotejid, (map.get(c.remotejid) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort(([,a],[,b]) => b - a).map(([name, value]) => ({ name, value }))
  }, [conversas])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0']

  return (
    <div className="space-y-6">
      {getSupabase() === null && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Variáveis do Supabase não configuradas. Informe VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar o dashboard.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
<p className="text-sm text-brand-400/80">Análise de conversas e mensagens por período.</p>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Início</label>
          <input type="date" className="mt-1 rounded-md border border-gray-700 bg-neutral-800 text-white px-3 py-2" value={filters.start} onChange={(e)=>setFilters(f=>({...f, start: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Fim</label>
          <input type="date" className="mt-1 rounded-md border border-gray-700 bg-neutral-800 text-white px-3 py-2" value={filters.end} onChange={(e)=>setFilters(f=>({...f, end: e.target.value}))} />
        </div>
        <button className="btn-primary" onClick={()=>setFilters({...filters})} disabled={loading}>{loading ? 'Carregando...' : 'Aplicar'}</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card p-4">
          <div className="text-sm text-gray-400">Conversas (período)</div>
          <div className="text-3xl font-semibold text-white">{totalConversas}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Mensagens (período)</div>
          <div className="text-3xl font-semibold text-white">{totalMensagens}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Agendamentos (período)</div>
          <div className="text-3xl font-semibold text-white">{totalAgendamentos}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Telefones únicos</div>
          <div className="text-3xl font-semibold text-white">{telefonesUnicos}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-400">Média msgs/conversa</div>
          <div className="text-3xl font-semibold text-white">{totalConversas > 0 ? (totalMensagens / totalConversas).toFixed(1) : 0}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="text-sm font-medium mb-2 text-gray-300">Evolução diária</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriesLinhas} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" fontSize={12} tickMargin={8} stroke="#bbb" />
                <YAxis allowDecimals={false} fontSize={12} stroke="#bbb" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="conversas" stroke="#1e90ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mensagens" stroke="#00C49F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm font-medium mb-2 text-gray-300">Telefones (conversas)</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
