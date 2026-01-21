import { useEffect, useState } from 'react'
import { useStore } from '@/store/appStore'
import { useAuth } from '@/hooks/useAuth'
import firebaseService from '@/services/firebaseService'
import { Product } from '@/types/index'

export default function POS() {
  const { currentUser } = useStore()
  const { currentDevice } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<number>(1)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const prods = await firebaseService.getAllProducts()
      setProducts(prods)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POS</h1>
              <p className="text-sm text-gray-600">
                Usuario: {currentUser?.username} | Dispositivo: {currentDevice?.deviceName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Mesa: {selectedTable}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selector de Mesas */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Mesas</h2>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setSelectedTable(i + 1)}
                    className={`p-4 rounded-lg font-medium transition-colors ${
                      selectedTable === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                Cortesía
              </button>
            </div>
          </div>

          {/* Productos */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Productos</h2>
              {products.length === 0 ? (
                <p className="text-gray-600">No hay productos disponibles</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">${product.price.toFixed(2)}</p>
                      {product.hasInventory && (
                        <p className="text-xs text-gray-500 mt-2">
                          Stock: {product.currentStock || 0}
                        </p>
                      )}
                      <button className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
