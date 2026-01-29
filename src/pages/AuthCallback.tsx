import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import logger from '@/utils/logger'

export const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession()
      
      if (error) {
        logger.error('auth', 'Error en el callback de autenticación', error)
        navigate('/login?error=auth_failed')
        return
      }

      // Si llegamos aquí, la sesión es válida
      logger.info('auth', 'Sesión social establecida correctamente')
      navigate('/dashboard') // O a la ruta de admin
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4">Verificando credenciales...</p>
    </div>
  )
}