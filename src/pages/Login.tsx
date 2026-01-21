import { LoginPin } from '../components/auth/LoginPin'

/**
 * Login Page
 * 
 * Punto de entrada al sistema
 * Utiliza el componente LoginPin para la interfaz de autenticación
 */

function Login() {
  return <LoginPin />
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