import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'
import { logger } from '../lib/logger'

// Rate limiting: máximo 5 tentativas a cada 15 minutos
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutos

interface LoginAttempt {
  count: number
  lastAttempt: number
}

function getRateLimitKey(email: string): string {
  return `login_attempts_${email}`
}

function checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
  const key = getRateLimitKey(email)
  const stored = localStorage.getItem(key)
  
  if (!stored) return { allowed: true }
  
  const attempt: LoginAttempt = JSON.parse(stored)
  const now = Date.now()
  const timeSinceLastAttempt = now - attempt.lastAttempt
  
  // Reset após lockout time
  if (timeSinceLastAttempt > LOCKOUT_TIME) {
    localStorage.removeItem(key)
    return { allowed: true }
  }
  
  // Bloqueado
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 1000 / 60)
    return { allowed: false, remainingTime }
  }
  
  return { allowed: true }
}

function recordLoginAttempt(email: string, success: boolean) {
  const key = getRateLimitKey(email)
  
  if (success) {
    localStorage.removeItem(key)
    return
  }
  
  const stored = localStorage.getItem(key)
  const now = Date.now()
  
  if (!stored) {
    const attempt: LoginAttempt = { count: 1, lastAttempt: now }
    localStorage.setItem(key, JSON.stringify(attempt))
    return
  }
  
  const attempt: LoginAttempt = JSON.parse(stored)
  attempt.count += 1
  attempt.lastAttempt = now
  localStorage.setItem(key, JSON.stringify(attempt))
}

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

    // Validação de inputs
    const emailTrimmed = username.trim()
    const passwordTrimmed = password.trim()

    if (!emailTrimmed || !passwordTrimmed) {
      setError('Email e senha são obrigatórios')
      setLoading(false)
      return
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      setError('Email inválido')
      setLoading(false)
      return
    }

    // Verificar rate limit ANTES de qualquer operação
    const rateLimit = checkRateLimit(emailTrimmed)
    if (!rateLimit.allowed) {
      setError(`Muitas tentativas de login. Tente novamente em ${rateLimit.remainingTime} minutos.`)
      setLoading(false)
      logger.warn('Login blocked by rate limit', { email: emailTrimmed, remainingTime: rateLimit.remainingTime })
      return // BLOQUEIA AQUI - não continua
    }

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
        .eq('email', emailTrimmed)
        .maybeSingle()

      if (fetchError || !user) {
        recordLoginAttempt(emailTrimmed, false)
        logger.warn('Failed login attempt - user not found', { email: emailTrimmed })
        setError('Usuário ou senha inválidos')
        setLoading(false)
        return
      }

      // Verificar senha
      const isValidPassword = await verifyPassword(passwordTrimmed, user.password_hash)
      
      if (!isValidPassword) {
        recordLoginAttempt(emailTrimmed, false)
        logger.warn('Failed login attempt - invalid password', { email: emailTrimmed })
        setError('Usuário ou senha inválidos')
        setLoading(false)
        return
      }

      // Autenticação bem-sucedida
      recordLoginAttempt(emailTrimmed, true)
      logger.info('Successful login', { email: emailTrimmed, userId: user.id })
      
      // Criar sessão com timestamp
      const sessionData = {
        authenticated: 'true',
        user: user.email,
        userId: user.id,
        userName: user.name,
        loginTime: new Date().toISOString()
      }
      
      Object.entries(sessionData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value)
      })
      
      navigate('/settings')
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro ao fazer login. Tente novamente.')
      recordLoginAttempt(emailTrimmed, false)
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
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decoração lateral esquerda */}
      <div className="absolute left-0 top-0 bottom-0 w-64 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-brand-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-5 w-40 h-40 bg-brand-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-15 w-36 h-36 bg-brand-300 rounded-full blur-3xl"></div>
      </div>
      
      {/* Decoração lateral direita */}
      <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10">
        <div className="absolute top-1/4 right-10 w-36 h-36 bg-brand-400 rounded-full blur-3xl"></div>
        <div className="absolute top-2/3 right-5 w-32 h-32 bg-brand-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-12 w-40 h-40 bg-brand-300 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo-fzia.png" 
            alt="FZIA - IA para Negócios" 
            className="h-24 mx-auto mb-4"
          />
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

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-brand-400 hover:text-brand-300 transition"
            >
              Esqueci minha senha
            </button>
            <p className="mt-4 text-sm text-gray-500">Entre com suas credenciais cadastradas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
