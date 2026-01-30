import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/appStore';
import { Lock, Loader, UserCheck } from 'lucide-react';

/**
 * LoginPin Component
 * 
 * Interfaz de login PIN para acceso al sistema POS
 * - Entrada de PIN de 4-6 dígitos
 * - Validación en tiempo real
 * - Manejo de errores
 * - Detección de dispositivo automática
 * - Feedback visual
 */

export const LoginPin: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthenticated, setCurrentUser, setCurrentDevice } = useAppStore();
  
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Manejo de bloqueo temporal por intentos fallidos
  useEffect(() => {
    if (lockoutUntil) {
      const now = Date.now();
      if (now < lockoutUntil) {
        const timer = setTimeout(() => setLockoutUntil(null), lockoutUntil - now);
        return () => clearTimeout(timer);
      } else {
        setLockoutUntil(null);
      }
    }
  }, [lockoutUntil]);
  
  // Limpiar errores cuando el usuario escriba
  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [pin]);

  /**
   * Maneja el cambio en el input del PIN
   * - Solo acepta números
   * - Limita a 6 caracteres máximo
   */
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(value);
  };

  /**
   * Maneja el envío del formulario
   * - Valida que el PIN tenga 4-6 dígitos
   * - Detecta información del dispositivo
   * - Llama al servicio de autenticación para validar PIN
   * - Redirige a POS o muestra error
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(`Demasiados intentos. Bloqueado por ${remaining}s`);
      return;
    }

    // Validación básica
    if (!pin) {
      setError('Por favor ingresa tu PIN');
      return;
    }
    
    if (pin.length < 4) {
      setError('El PIN debe tener al menos 4 dígitos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Lógica integrada: Consulta a Supabase validando PIN y estado activo
      const { data, error: sbError } = await supabase
        .from('users')
        .select('id, username, role, rol, active, nombre, pin, establishment_id')
        .eq('pin', pin)
        .single();

      if (sbError) {
        console.error('Error de Supabase:', sbError);
        throw new Error('PIN incorrecto o error de conexión');
      }
      
      if (!data) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 60000); // 1 minuto de bloqueo
          setAttempts(0);
          throw new Error('Demasiados intentos fallidos. Bloqueado por 1 minuto.');
        }
        throw new Error('PIN incorrecto');
      }
      
      if (!data.active) {
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      }
      
      if (data) {
        // Efecto de sonido y visual de éxito
        setIsSuccess(true);
        setAttempts(0);
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => console.log('Audio blocked by browser'));

        // --- Lógica de Registro de Dispositivo ---
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const deviceName = isIOS ? 'iOS Device' : isAndroid ? 'Android Device' : 'Desktop Browser';
        
        // Generamos un fingerprint básico basado en el navegador (seguro para caracteres especiales)
        const fingerprint = btoa(unescape(encodeURIComponent(userAgent + screen.width + screen.height))).substring(0, 24);

        // Buscamos si este dispositivo ya existe para este usuario
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*')
          .eq('user_id', data.id)
          .eq('mac_address', fingerprint) // Usamos el fingerprint como mac_address temporal
          .single();

        let finalDevice = deviceData;

        if (!deviceData && (!deviceError || deviceError.code === 'PGRST116')) {
          // Si no existe, lo registramos como pendiente
          const { data: newDevice, error: insertError } = await supabase
            .from('devices')
            .insert([{
              user_id: data.id,
              device_name: deviceName,
              mac_address: fingerprint,
              is_approved: false,
              last_access: new Date().toISOString(),
              os: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Web'
            }])
            .select()
            .single();
          
          if (!insertError) finalDevice = newDevice;
        } else if (deviceData) {
          // Si existe, actualizamos el último acceso
          await supabase
            .from('devices')
            .update({ last_access: new Date().toISOString() })
            .eq('id', deviceData.id);
        }

        // Mapear el dispositivo a camelCase para el store (compatibilidad con DeviceVerification)
        const mappedDevice = finalDevice ? {
          id: finalDevice.id,
          userId: finalDevice.user_id,
          deviceName: finalDevice.device_name,
          macAddress: finalDevice.mac_address,
          isApproved: finalDevice.is_approved,
          lastAccess: finalDevice.last_access,
          os: finalDevice.os
        } : null;

        // Normalizamos el rol (aseguramos que 'role' exista si viene como 'rol')
        const userWithRole = { ...data, role: data.role || data.rol };
        
        // Feedback visual y auditivo antes de entrar al sistema
        setCurrentUser(userWithRole);
        if (mappedDevice) setCurrentDevice(mappedDevice);
        
        setTimeout(() => {
          setAuthenticated(true);
          navigate('/pos', { replace: true });
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja clics en el teclado numérico
   */
  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
    }
  };

  /**
   * Borra el último dígito
   */
  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  /**
   * Limpia todo el PIN
   */
  const handleClear = () => {
    setPin('');
    setError('');
  };

  const isLoading = loading;
  const hasError = error;
  const isValid = pin.length >= 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Contenedor Principal */}
      <div className="w-full max-w-md">
        
        {/* Card de Login */}
        <div className="bg-white rounded-lg shadow-2xl p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className={`rounded-full p-4 transition-all duration-500 ${isSuccess ? 'bg-green-500 scale-110' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
                {isSuccess ? (
                  <UserCheck className="text-white animate-bounce" size={32} />
                ) : (
                  <Lock className="text-white" size={32} />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
              {isSuccess ? '¡Bienvenido!' : 'REISBLOC POS'}
            </h1>
            <p className="text-gray-500">
              {isSuccess ? 'Acceso concedido...' : 'Ingresa tu PIN para continuar'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input de PIN */}
            <div className="relative">
              <label htmlFor="pin" className="block text-sm font-semibold text-gray-700 mb-3">
                PIN de Acceso
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  className={`w-full px-4 py-3 text-center text-3xl font-bold tracking-[0.5em] border-2 rounded-lg transition-all ${
                    hasError
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-300 focus:border-blue-500 focus:bg-blue-50'
                  } focus:outline-none`}
                  autoFocus
                  disabled={isLoading || !!lockoutUntil}
                />
                {/* Botón mostrar/ocultar */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                  disabled={!pin || isLoading || !!lockoutUntil}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              
              {/* Contador de dígitos */}
              <p className="text-xs text-gray-500 mt-2">
                {pin.length} / 6 dígitos
                {pin.length >= 4 && <span className="ml-2 text-green-600">✓ Listo para validar</span>}
              </p>
            </div>

            {/* Teclado Numérico */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumberClick(num.toString())}
                    disabled={pin.length >= 6 || isLoading || !!lockoutUntil}
                    className="bg-white hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-400 text-lg font-semibold py-3 rounded border border-gray-200 transition-colors"
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {/* Fila de 0 y controles */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleNumberClick('0')}
                  disabled={pin.length >= 6 || isLoading || !!lockoutUntil}
                  className="col-span-1 bg-white hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-400 text-lg font-semibold py-3 rounded border border-gray-200 transition-colors"
                >
                  0
                </button>
                
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={!pin || isLoading || !!lockoutUntil}
                  className="col-span-1 bg-white hover:bg-red-50 disabled:bg-gray-200 disabled:text-gray-400 text-lg font-semibold py-3 rounded border border-gray-200 transition-colors"
                >
                  ← Atrás
                </button>
                
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!pin || isLoading || !!lockoutUntil}
                  className="col-span-1 bg-white hover:bg-orange-50 disabled:bg-gray-200 disabled:text-gray-400 text-lg font-semibold py-3 rounded border border-gray-200 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Mostrar errores */}
            {hasError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-semibold">⚠️ {hasError}</p>
              </div>
            )}

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={!isValid || isLoading || !!lockoutUntil}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isValid && !isLoading && !lockoutUntil
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg active:scale-95'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading && <Loader className="animate-spin" size={20} />}
              {isLoading ? 'Validando...' : lockoutUntil ? 'Bloqueado' : 'Ingresar'}
            </button>
          </form>

          {/* Información Adicional */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">💡 Información Adicional</p>
            <ul className="space-y-1 text-xs">
              <li>• Tu dispositivo será registrado automáticamente</li>
              <li>• Deberá ser aprobado por un administrador</li>
              <li>• PIN de 4-6 dígitos numéricos</li>
              <li>• Contacta al admin si olvidaste tu PIN</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>Sistema de Punto de Venta Profesional</p>
            <p>© 2026 Reisbloc POS - Sistema Profesional</p>
          </div>
        </div>

        {/* Información de Dispositivo (Desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-gray-900/80 text-gray-300 rounded-lg p-3 text-xs font-mono">
            <p className="font-bold mb-2">🔧 Info de Desarrollo</p>
            <p>PIN actual: {pin || '(vacío)'}</p>
            <p>Caracteres: {pin.length}/6</p>
            <p>Listo: {isValid ? 'Sí ✓' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPin;
