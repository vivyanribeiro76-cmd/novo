import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'
import { logger } from '../lib/logger'

// Email configurado do administrador
const ADMIN_EMAIL = 'fbapaes@gmail.com'

export default function ForgotPassword() {
  const [step, setStep] = useState<'code' | 'newPassword'>('code')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const navigate = useNavigate()

  // Gerar código de 6 dígitos
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Enviar código automaticamente ao carregar a página
  useEffect(() => {
    const sendCodeAutomatically = async () => {
      setLoading(true)
      
      const supabase = getSupabase()
      if (!supabase) {
        setError('Supabase não configurado')
        setLoading(false)
        return
      }

      try {
        // Verificar se email existe
        const { data: user, error: fetchError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', ADMIN_EMAIL)
          .maybeSingle()

        if (fetchError || !user) {
          setError('Email não encontrado')
          logger.warn('Password recovery - admin email not found')
          setLoading(false)
          return
        }

        // Gerar código
        const recoveryCode = generateCode()
        setGeneratedCode(recoveryCode)

        // Armazenar código temporariamente (15 minutos)
        const codeData = {
          email: ADMIN_EMAIL,
          code: recoveryCode,
          expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutos
        }
        localStorage.setItem('recovery_code', JSON.stringify(codeData))

        logger.info('Password recovery code generated automatically', { email: ADMIN_EMAIL })
        setCodeSent(true)

        // Em produção, enviar email aqui para fbapaes@gmail.com

      } catch (err) {
        setError('Erro ao processar solicitação')
        logger.error('Error in password recovery', { error: err instanceof Error ? err.message : 'Unknown' })
      } finally {
        setLoading(false)
      }
    }

    sendCodeAutomatically()
  }, [])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const codeTrimmed = code.trim()

    if (!codeTrimmed) {
      setError('Código é obrigatório')
      setLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem('recovery_code')
      if (!stored) {
        setError('Código expirado. Solicite um novo código.')
        setLoading(false)
        return
      }

      const codeData = JSON.parse(stored)

      // Verificar expiração
      if (Date.now() > codeData.expiresAt) {
        localStorage.removeItem('recovery_code')
        setError('Código expirado. Solicite um novo código.')
        setLoading(false)
        return
      }

      // Verificar código
      if (codeTrimmed !== codeData.code) {
        setError('Código inválido')
        logger.warn('Invalid recovery code attempt', { email: codeData.email })
        setLoading(false)
        return
      }

      // Código válido
      logger.info('Recovery code verified', { email: codeData.email })
      setStep('newPassword')

    } catch (err) {
      setError('Erro ao verificar código')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    const supabase = getSupabase()
    if (!supabase) {
      setError('Supabase não configurado')
      setLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem('recovery_code')
      if (!stored) {
        setError('Sessão expirada')
        setLoading(false)
        return
      }

      const codeData = JSON.parse(stored)

      // Gerar hash da nova senha
      const passwordHash = await bcrypt.hash(newPassword, 10)

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('email', codeData.email)

      if (updateError) {
        setError('Erro ao atualizar senha')
        logger.error('Error updating password in recovery', { error: updateError.message })
        setLoading(false)
        return
      }

      // Limpar código
      localStorage.removeItem('recovery_code')

      logger.info('Password reset successfully', { email: codeData.email })

      // Redirecionar para login
      alert('Senha alterada com sucesso! Faça login com sua nova senha.')
      navigate('/login')

    } catch (err) {
      setError('Erro ao redefinir senha')
      logger.error('Error in password reset', { error: err instanceof Error ? err.message : 'Unknown' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo-fzia.png" 
            alt="FZIA - IA para Negócios" 
            className="h-24 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h1>
          <p className="text-gray-400 text-sm">
            {step === 'code' && 'Digite o código de 6 dígitos'}
            {step === 'newPassword' && 'Defina sua nova senha'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-gray-800 rounded-lg p-8 shadow-xl">
          {/* Etapa 1: Código */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {loading && (
                <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-md text-sm">
                  <p className="font-semibold">⏳ Gerando código...</p>
                </div>
              )}

              {!loading && codeSent && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-md text-sm">
                  <p className="font-semibold mb-1">📧 Código enviado para: {ADMIN_EMAIL}</p>
                  <p className="text-xs">Código: <span className="font-mono text-lg">{generatedCode}</span></p>
                  <p className="text-xs mt-2 text-green-300">⚠️ Em produção, este código será enviado por email</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-dark-secondary border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-400 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-md transition disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Voltar para login
                </button>
              </div>
            </form>
          )}

          {/* Etapa 2: Nova Senha */}
          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-dark-secondary border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-dark-secondary border border-gray-700 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Digite novamente"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-400 hover:bg-brand-500 text-white font-semibold py-3 px-4 rounded-md transition disabled:opacity-50"
              >
                {loading ? 'Alterando...' : 'Redefinir Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
