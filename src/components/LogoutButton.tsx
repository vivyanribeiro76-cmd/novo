import { useNavigate } from 'react-router-dom'

export default function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Limpar todos os dados da sessão
    sessionStorage.clear()
    localStorage.removeItem('lastActivity')
    
    // Redirecionar para login
    navigate('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-neutral-800 rounded-md transition"
      title="Sair"
    >
      Sair
    </button>
  )
}
