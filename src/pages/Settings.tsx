import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getSupabase } from '../lib/supabase'

const schema = z.object({
  client_id: z.string().min(1, 'Obrigatório'),
  greeting_message: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  working_hours: z.string().optional().or(z.literal('')),
  open_today: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export default function Settings() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: '',
      greeting_message: '',
      address: '',
      working_hours: '',
      open_today: false,
    }
  })

  const clientId = watch('client_id')

  useEffect(() => {
    async function load() {
      const supabase = getSupabase()
      if (!supabase) return
      if (!clientId) return
      setLoading(true)
      const { data, error } = await supabase
        .from('assistant_settings')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!error && data) {
        setValue('greeting_message', data.greeting_message ?? '')
        setValue('address', data.address ?? '')
        setValue('working_hours', data.working_hours ?? '')
        setValue('open_today', !!data.open_today)
      }
      setLoading(false)
    }
    load()
  }, [clientId, setValue])

  const onSubmit = async (values: FormValues) => {
    const supabase = getSupabase()
    if (!supabase) {
      alert('Configure o Supabase (.env local) para salvar as configurações.')
      return
    }
    setLoading(true)
    const payload = {
      client_id: values.client_id,
      greeting_message: values.greeting_message ?? null,
      address: values.address ?? null,
      working_hours: values.working_hours ?? null,
      open_today: values.open_today,
      updated_at: new Date().toISOString(),
    }
    // Update-if-exists else insert (avoid requiring unique constraint on client_id)
    const { data: existing, error: findErr } = await supabase
      .from('assistant_settings')
      .select('id')
      .eq('client_id', values.client_id)
      .limit(1)
      .maybeSingle()

    let error = null as any
    if (!findErr && existing) {
      const resp = await supabase
        .from('assistant_settings')
        .update(payload)
        .eq('client_id', values.client_id)
      error = resp.error
    } else {
      const resp = await supabase
        .from('assistant_settings')
        .insert(payload)
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
        <h1 className="text-2xl font-semibold">Configurações do Assistente</h1>
        <p className="text-sm text-neutral-600">Personalize as mensagens e informações exibidas pelo seu assistente.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium">Client ID</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="ex: cliente-123" {...register('client_id')} />
          {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Mensagem de Saudação</label>
          <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={3} placeholder="Olá! Como posso ajudar?" {...register('greeting_message')} />
        </div>
        <div>
          <label className="block text-sm font-medium">Endereço</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Rua Exemplo, 123" {...register('address')} />
        </div>
        <div>
          <label className="block text-sm font-medium">Horário de Funcionamento</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Seg-Sex 09:00-18:00" {...register('working_hours')} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4" {...register('open_today')} />
          <span className="text-sm">Vai funcionar hoje?</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className="px-4 py-2 rounded-md border" onClick={() => clientId && window.location.reload()}>Recarregar</button>
        </div>
      </form>
    </div>
  )
}
