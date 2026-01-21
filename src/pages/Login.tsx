import { useState } from 'react'
import { useStore } from '@/store/appStore'
import deviceService from '@/services/deviceService'

function Login() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setCurrentUser, setCurrentDevice } = useStore()

  const handleLogin = async () => {
    try {
      setError('')
      setLoading(true)

      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setError('PIN debe ser 4 dígitos')
        return
      }

      // TODO: Validar PIN en Firebase
      // TODO: Registrar dispositivo
      // TODO: Verificar aprobación del dispositivo

      const deviceInfo = await deviceService.getDeviceInfo()
      console.log('Device info:', deviceInfo)

      // Simulación temporal
      setError('Configurar Firebase primero')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          TPV Solutions
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN de 4 dígitos
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              className="input-field text-center text-2xl tracking-widest"
              placeholder="0000"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="error-text text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || pin.length !== 4}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Sistema de Punto de Venta para Restaurantes
        </p>
      </div>
    </div>
  )
}

export default Login
