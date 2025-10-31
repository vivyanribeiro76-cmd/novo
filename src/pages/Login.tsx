import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = getSupabase()
    if (!supabase) {
      setError('Supabase não configurado. Configure as variáveis de ambiente.')
      setLoading(false)
      return
    }

    try {
      // Buscar usuário por email
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email, password_hash, name')
        .eq('email', username)
        .maybeSingle()

      if (fetchError || !user) {
        setError('Usuário ou senha inválidos')
        setLoading(false)
        return
      }

      // Verificar senha (comparação simples - em produção use bcrypt)
      // Para criar hash: await bcrypt.hash(password, 10)
      const isValidPassword = await verifyPassword(password, user.password_hash)
      
      if (!isValidPassword) {
        setError('Usuário ou senha inválidos')
        setLoading(false)
        return
      }

      // Autenticação bem-sucedida
      sessionStorage.setItem('authenticated', 'true')
      sessionStorage.setItem('user', user.email)
      sessionStorage.setItem('userId', user.id)
      navigate('/settings')
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Verificação de senha com bcrypt
  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    try {
      return await bcrypt.compare(password, hash)
    } catch (err) {
      console.error('Erro ao verificar senha:', err)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="FZ.IA" 
            className="h-16 mx-auto mb-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <h1 className="text-3xl font-bold text-white">FZIA</h1>
          <p className="text-gray-400 mt-2">Faça login para continuar</p>
        </div>

        {/* Card de Login */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-dark-secondary border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-secondary border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                placeholder="Digite sua senha"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-400 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-900/50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Entre com suas credenciais cadastradas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
