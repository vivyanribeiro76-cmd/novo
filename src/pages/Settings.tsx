import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getSupabase } from '../lib/supabase'

const schema = z.object({
  // Básico existente
  greeting_message: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  working_hours: z.string().optional().or(z.literal('')),

  // Identidade
  nome_assistente: z.string().optional().or(z.literal('')),
  tom: z.enum(['profissional', 'amigavel', 'objetivo']).optional(),
  idioma: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),

  // Encaminhamento (assuntos livres)
  assuntos_encaminhar: z.string().optional().or(z.literal('')),

  // Contatos
  telefone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  site: z.string().url().optional().or(z.literal('')),

  // Horários (MVP simplificado)
  horario_padrao_inicio: z.string().optional().or(z.literal('')),
  horario_padrao_fim: z.string().optional().or(z.literal('')),
  dias_fechado: z.array(z.enum(['sabado', 'domingo', 'feriado'])).optional(),
  excecoes: z.string().optional().or(z.literal('')), // multiline: YYYY-MM-DD: fechado|HH:MM-HH:MM

  // Respostas rápidas (CSV)
  respostas_rapidas: z.string().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue } = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      greeting_message: '',
      address: '',
      working_hours: '',
      // open_today removido da UI

      nome_assistente: '',
      tom: 'profissional',
      idioma: 'pt-BR',
      assuntos_encaminhar: '',
      telefone: '',
      whatsapp: '',
      email: '',
      site: '',
      horario_padrao_inicio: '',
      horario_padrao_fim: '',
      dias_fechado: [],
      excecoes: '',
      respostas_rapidas: '',
    }
  })

  const GLOBAL_ID = 'global'

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      if (!supabase) return
      setLoading(true)
      const { data, error } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('client_id', GLOBAL_ID)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!error && data) {
        const obs = (data.observacoes ?? {}) as any
        setValue('greeting_message', obs.greeting_message ?? '')
        setValue('address', obs.address ?? '')
        setValue('working_hours', obs.working_hours ?? '')
        setValue('nome_assistente', obs.nome_assistente ?? '')
        setValue('tom', obs.tom ?? 'profissional')
        setValue('idioma', obs.idioma ?? 'pt-BR')
        setValue('assuntos_encaminhar', Array.isArray(obs.assuntos_encaminhar) ? obs.assuntos_encaminhar.join('\n') : (obs.assuntos_encaminhar ?? ''))
        setValue('telefone', obs.telefone ?? '')
        setValue('whatsapp', obs.whatsapp ?? '')
        setValue('email', obs.email ?? '')
        setValue('site', obs.site ?? '')
        setValue('horario_padrao_inicio', obs.horario_padrao_inicio ?? '')
        setValue('horario_padrao_fim', obs.horario_padrao_fim ?? '')
        setValue('dias_fechado', obs.dias_fechado ?? [])
        setValue('excecoes', Array.isArray(obs.excecoes) ? obs.excecoes.join('\n') : (obs.excecoes ?? ''))
        setValue('respostas_rapidas', Array.isArray(obs.respostas_rapidas) ? obs.respostas_rapidas.join(', ') : (obs.respostas_rapidas ?? ''))
      }
      setLoading(false)
    }
    load()
  }, [setValue])

  const onSubmit = async (values: FormValues) => {
    const supabase = getSupabase()
    if (!supabase) {
      alert('Configure o Supabase (.env local) para salvar as configurações.')
      return
    }
    setLoading(true)
    const observacoes = {
      greeting_message: values.greeting_message || null,
      address: values.address || null,
      working_hours: values.working_hours || null,
      nome_assistente: values.nome_assistente || null,
      tom: values.tom || null,
      idioma: values.idioma || null,
      assuntos_encaminhar: (values.assuntos_encaminhar || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      telefone: values.telefone || null,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      site: values.site || null,
      horario_padrao_inicio: values.horario_padrao_inicio || null,
      horario_padrao_fim: values.horario_padrao_fim || null,
      dias_fechado: values.dias_fechado || [],
      excecoes: (values.excecoes || '')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      respostas_rapidas: (values.respostas_rapidas || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    }
    const payload = {
      client_id: GLOBAL_ID,
      observacoes,
      updated_at: new Date().toISOString(),
    }
    // Update-if-exists else insert (avoid requiring unique constraint on client_id)
    const { data: existing, error: findErr } = await supabase
      .from('assistant_settings')
      .select('id')
      .eq('client_id', GLOBAL_ID)
      .limit(1)
      .maybeSingle()

    let error = null as any
    if (!findErr && existing) {
      const resp = await supabase
        .from('assistant_settings')
        .update(payload as any)
        .eq('client_id', GLOBAL_ID)
      error = resp.error
    } else {
      const resp = await supabase
        .from('assistant_settings')
        .insert(payload as any)
      error = resp.error
    }
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      alert('Configurações salvas!')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {getSupabase() === null && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Variáveis do Supabase não configuradas. Informe VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o salvamento.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-semibold text-white">Configurações do Assistente</h1>
        <p className="text-sm text-brand-400/80">Personalize as mensagens e informações exibidas pelo seu assistente.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-6 max-w-3xl">
        {/* Identidade do Assistente */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-300">Nome do Assistente</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="ex: MetricAI" {...register('nome_assistente')} />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-300">Tom</label>
            <select className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white px-3 py-2" {...register('tom')}>
              <option value="profissional">Profissional</option>
              <option value="amigavel">Amigável</option>
              <option value="objetivo">Objetivo</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-300">Idioma</label>
            <select className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white px-3 py-2" {...register('idioma')}>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">Inglês (EUA)</option>
              <option value="es-ES">Espanhol (ES)</option>
            </select>
          </div>
        </div>

        {/* Mensagens / Encaminhamento */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Mensagem de Saudação</label>
          <textarea className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" rows={3} placeholder="Olá! Como posso ajudar?" {...register('greeting_message')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Assuntos para encaminhar ao humano (um por linha)</label>
          <textarea className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" rows={3} placeholder="Cancelamentos\nReclamações\nFinanceiro" {...register('assuntos_encaminhar')} />
        </div>

        {/* Contatos */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Telefone</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="(11) 9999-9999" {...register('telefone')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">WhatsApp</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="(11) 9999-9999" {...register('whatsapp')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">E-mail</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="contato@empresa.com" {...register('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Site</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="https://empresa.com" {...register('site')} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Endereço</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="Rua Exemplo, 123" {...register('address')} />
          </div>
        </div>

        {/* Horários */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Horário padrão - início</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="09:00" {...register('horario_padrao_inicio')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">Horário padrão - fim</label>
            <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="18:00" {...register('horario_padrao_fim')} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Dias fechados</label>
            <div className="mt-2 flex gap-6 flex-wrap text-gray-300">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" value="sabado" {...register('dias_fechado')} className="h-4 w-4 accent-brand-400" /> Sábado
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" value="domingo" {...register('dias_fechado')} className="h-4 w-4 accent-brand-400" /> Domingo
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" value="feriado" {...register('dias_fechado')} className="h-4 w-4 accent-brand-400" /> Feriado
              </label>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Exceções (um por linha)</label>
            <textarea className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" rows={3} placeholder="2025-12-25: fechado\n2025-12-31: 09:00-12:00" {...register('excecoes')} />
          </div>
        </div>


        {/* Respostas rápidas */}
        <div>
          <label className="block text-sm font-medium text-gray-300">Respostas rápidas (separadas por vírgula)</label>
          <input className="mt-1 w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2" placeholder="Endereço, Horários, Falar com humano" {...register('respostas_rapidas')} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className="px-4 py-2 rounded-md border border-gray-700 text-gray-300 bg-neutral-800 hover:bg-neutral-700 hover:shadow-lg hover:shadow-brand-500/20 transition" onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      </form>
    </div>
  )
}
