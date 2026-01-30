import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Users, 
  Package, 
  Smartphone, 
  FileText, 
  Settings,
  TrendingUp,
  ShieldCheck
} from 'lucide-react'
import DeviceApprovalPanel from '@/components/admin/DeviceApprovalPanel'
import UsersManagement from '@/components/admin/UsersManagement'
import InventoryManagement from '@/components/admin/InventoryManagement'
import AuditLogsPanel from '@/components/admin/AuditLogsPanel'

type AdminTab = 'devices' | 'users' | 'inventory' | 'logs' | 'settings'

export default function Admin() {
  const { currentUser } = useAppStore()
  const { canManageUsers, canManageInventory, canManageDevices, canViewLogs } = usePermissions()
  const [activeTab, setActiveTab] = useState<AdminTab>('devices')

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/pos" replace />
  }

  const tabs = [
    { id: 'devices' as AdminTab, label: 'Dispositivos', icon: Smartphone, enabled: canManageDevices },
    { id: 'users' as AdminTab, label: 'Usuarios', icon: Users, enabled: canManageUsers },
    { id: 'inventory' as AdminTab, label: 'Inventario', icon: Package, enabled: canManageInventory },
    { id: 'logs' as AdminTab, label: 'Logs de Auditoría', icon: FileText, enabled: canViewLogs },
    { id: 'settings' as AdminTab, label: 'Configuración', icon: Settings, enabled: true },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Panel de Administración</h1>
              <p className="text-indigo-100 mt-2">Gestión completa del sistema</p>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 flex gap-2 overflow-x-auto">
          {tabs.filter(tab => tab.enabled).map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'devices' && <DeviceApprovalPanel />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'inventory' && <InventoryManagement />}
          {activeTab === 'logs' && <AuditLogsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  )
}

// Settings Panel
function SettingsPanel() {
  return (
    <div className="card-gradient">
      <h2 className="text-2xl font-bold mb-4">Configuración del Sistema</h2>
      <p className="text-gray-600">Configuración en desarrollo...</p>
    </div>
  )
}
