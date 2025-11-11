import { useState } from 'react'
import { getSupabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'
import { logger } from '../lib/logger'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos os campos são obrigatórios')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da atual')
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
      const userId = sessionStorage.getItem('userId')
      const userEmail = sessionStorage.getItem('user')

      if (!userId || !userEmail) {
        setError('Usuário não autenticado')
        setLoading(false)
        return
      }

      // Buscar usuário atual
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email, password_hash')
        .eq('id', userId)
        .maybeSingle()

      if (fetchError || !user) {
        setError('Erro ao buscar dados do usuário')
        logger.error('Error fetching user for password change', { error: fetchError?.message })
        setLoading(false)
        return
      }

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValidPassword) {
        setError('Senha atual incorreta')
        logger.warn('Failed password change - incorrect current password', { userId })
        setLoading(false)
        return
      }

      // Gerar hash da nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', userId)

      if (updateError) {
        setError('Erro ao atualizar senha')
        logger.error('Error updating password', { error: updateError.message })
        setLoading(false)
        return
      }

      // Sucesso
      setSuccess('Senha alterada com sucesso!')
      logger.info('Password changed successfully', { userId, email: userEmail })
      
      // Limpar campos
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

    } catch (err) {
      setError('Erro inesperado ao alterar senha')
      logger.error('Unexpected error changing password', { error: err instanceof Error ? err.message : 'Unknown' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Alterar Senha</h1>
        <p className="text-sm text-brand-400/80">Altere sua senha de acesso ao sistema</p>
      </div>

      <div className="card p-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Digite sua senha atual"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Digite sua nova senha (mínimo 6 caracteres)"
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
              className="w-full rounded-md border border-gray-700 bg-neutral-800 text-white placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Digite novamente a nova senha"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>

          <div className="text-sm text-gray-400">
            <p>💡 Dicas de segurança:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use no mínimo 6 caracteres</li>
              <li>Combine letras, números e símbolos</li>
              <li>Não use senhas óbvias ou pessoais</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}
