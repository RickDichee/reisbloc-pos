import { OrderItem } from '@/types'
import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react'

interface OrderPanelProps {
  tableNumber: number
  items: OrderItem[]
  onIncrement: (itemId: string) => void
  onDecrement: (itemId: string) => void
  onRemove: (itemId: string) => void
}

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

export function OrderPanel({ tableNumber, items, onIncrement, onDecrement, onRemove }: OrderPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-indigo-600" size={28} />
            Orden Actual
          </h2>
          <p className="text-sm font-semibold text-indigo-600 mt-1">Mesa {tableNumber}</p>
        </div>
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          {items.length} productos
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg font-medium">Carrito vacío</p>
            <p className="text-gray-400 text-sm mt-2">Agrega productos para comenzar</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {items.map(item => (
            <div
              key={item.id}
              className="group relative rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-4">
                  <p className="text-base font-bold text-gray-900 mb-1">{item.productName}</p>
                  <p className="text-sm text-gray-600 font-semibold">{currency.format(item.unitPrice)} c/u</p>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm p-1">
                  <button
                    onClick={() => onDecrement(item.id)}
                    className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 hover:from-gray-200 hover:to-gray-300 font-bold transition-all transform hover:scale-110"
                  >
                    <Minus size={16} strokeWidth={3} />
                  </button>
                  <span className="w-12 text-center text-lg font-black text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => onIncrement(item.id)}
                    className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:from-indigo-600 hover:to-purple-700 font-bold transition-all transform hover:scale-110"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium mb-1">Subtotal</p>
                  <p className="text-lg font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {currency.format(item.unitPrice * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderPanel
