import React, { useState, useEffect } from 'react';
import { Check, X, Loader, AlertCircle, Smartphone } from 'lucide-react';
import supabaseService from '../../services/supabaseService'; // Changed from firebaseService
import { Device } from '../../types';

/**
 * DeviceApprovalPanel Component
 * 
 * Panel exclusivo para administradores
 * - Listar todos los dispositivos del sistema
 * - Filtrar por usuario, estado de aprobación
 * - Aprobar/rechazar dispositivos
 * - Ver detalles de cada dispositivo
 * - Historial de acceso
 */

export const DeviceApprovalPanel: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /**
   * Cargar todos los dispositivos
   */
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const allDevices = await supabaseService.getAllDevices(); // Changed from firebaseService
      console.log('Dispositivos cargados:', allDevices);
      setDevices(allDevices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar dispositivos: ${errorMessage}`);
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aprobar un dispositivo
   */
  const approveDevice = async (deviceId: string) => {
    setProcessingId(deviceId);
    try {
      await supabaseService.approveDevice(deviceId); // Changed from firebaseService
      
      // Actualizar estado local
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, isApproved: true, isRejected: false } : d
      ));
      
      // Mostrar confirmación
      console.log('✅ Dispositivo aprobado:', deviceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al aprobar: ${errorMessage}`);
      console.error('Error approving device:', err);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Rechazar un dispositivo (revocar)
   */
  const rejectDevice = async (deviceId: string) => {
    if (!confirm('¿Estás seguro de que deseas rechazar este dispositivo?')) {
      return;
    }

    setProcessingId(deviceId);
    try {
      await supabaseService.revokeDevice(deviceId); // Changed from firebaseService

      // Actualizar estado local
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, isApproved: false, isRejected: true } : d
      ));
      
      console.log('❌ Dispositivo rechazado:', deviceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al rechazar: ${errorMessage}`);
      console.error('Error rejecting device:', err);
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Filtrar dispositivos según el estado
   */
  const filteredDevices = devices.filter(device => {
    switch (filter) {
      case 'pending':
        return !device.isApproved && !device.isRejected; // Now 'isRejected' is a field
      case 'approved':
        return device.isApproved;
      case 'rejected':
        return device.isRejected; // Now 'isRejected' is a field
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-3 text-blue-600" size={32} />
          <p className="text-gray-600">Cargando dispositivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Dispositivos</h2>
        <p className="text-gray-600">
          Aprueba o rechaza dispositivos que solicitan acceso al sistema
        </p>
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">Filtrar por:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && 'Todos'}
              {status === 'pending' && '⏳ Pendientes'}
              {status === 'approved' && '✓ Aprobados'}
              {status === 'rejected' && '✗ Rechazados'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {devices.filter(d => !d.isApproved && !d.isRejected).length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-gray-600">Aprobados</p>
          <p className="text-2xl font-bold text-green-600">
            {devices.filter(d => d.isApproved).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-gray-600">Rechazados</p>
          <p className="text-2xl font-bold text-red-600">
            {devices.filter(d => d.isRejected).length}
          </p>
        </div>
      </div>

      {/* Lista de Dispositivos */}
      {filteredDevices.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Smartphone className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-600">No hay dispositivos con ese filtro</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map(device => (
            <div
              key={device.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              
              {/* Resumen del Dispositivo */}
              <button
                onClick={() => setExpandedId(expandedId === device.id ? null : device.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  {/* Icono de Estado */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    device.isApproved ? 'bg-green-100' :
                    device.isRejected ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {device.isApproved && <Check className="text-green-600" size={20} />}
                    {device.isRejected && <X className="text-red-600" size={20} />}
                    {!device.isApproved && !device.isRejected && <Loader className="text-yellow-600 animate-pulse" size={20} />}
                  </div>

                  {/* Información del Dispositivo */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{device.deviceName || device.macAddress || 'Dispositivo'}</p>
                    <p className="text-sm text-gray-500">ID: {device.id?.substring(0, 8)}...</p>
                  </div>

                  {/* Estado Badge */}
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      device.isApproved ? 'bg-green-100 text-green-700' :
                      device.isRejected ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {device.isApproved ? 'Aprobado' :
                       device.isRejected ? 'Rechazado' :
                       'Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <div className="ml-2 text-gray-400">
                  {expandedId === device.id ? '▼' : '▶'}
                </div>
              </button>

              {/* Detalles Expandidos */}
              {expandedId === device.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  
                  {/* Información Detallada */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">MAC Address</p>
                      <p className="font-mono text-sm text-gray-900 break-all">{device.macAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Usuario</p>
                      <p className="text-sm text-gray-900">{device.userId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Tipo</p>
                      <p className="text-sm text-gray-900">{device.deviceType || 'Desconocido'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Primer Acceso</p>
                      <p className="text-sm text-gray-900">
                        {device.registeredAt ? new Date(device.registeredAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Último Acceso</p>
                      <p className="text-sm text-gray-900">
                        {device.lastAccess ? new Date(device.lastAccess).toLocaleString() : 'Nunca'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Fingerprint</p>
                      <p className="font-mono text-xs text-gray-500 break-all">
                        {device.fingerprint?.substring(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="border-t pt-4 flex gap-3">
                    {!device.isApproved && (
                      <>
                        <button
                          onClick={() => approveDevice(device.id)}
                          disabled={processingId === device.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {processingId === device.id && <Loader className="animate-spin" size={16} />}
                          ✓ Aprobar
                        </button>

                        <button
                          onClick={() => rejectDevice(device.id)}
                          disabled={processingId === device.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {processingId === device.id && <Loader className="animate-spin" size={16} />}
                          ✗ Rechazar
                        </button>
                      </>
                    )}
                    
                    {device.isApproved && (
                      <button
                        onClick={() => rejectDevice(device.id)}
                        disabled={processingId === device.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {processingId === device.id && <Loader className="animate-spin" size={16} />}
                        ✗ Revocar
                      </button>
                    )}

                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceApprovalPanel;
