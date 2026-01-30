import { useState } from 'react'
import { X, Users, DollarSign, Check, CreditCard, Banknote } from 'lucide-react'
import { Order, OrderItem } from '@/types/index'

interface SplitBillModalProps {
  order: Order
  onClose: () => void
  onConfirmSplit: (splits: SplitPayment[]) => void
}

interface SplitPayment {
  personNumber: number
  items: Array<{
    item: OrderItem
    quantity: number
  }>
  subtotal: number
  paymentMethods: Array<{
    method: 'cash' | 'digital' | 'clip'
    currency: 'MXN' | 'USD'
    amount: number
  }>
  tipAmount?: number
  tipCurrency?: 'MXN' | 'USD'
  paid: boolean
}

export default function SplitBillModal({ order, onClose, onConfirmSplit }: SplitBillModalProps) {
  const [numberOfPeople, setNumberOfPeople] = useState(2)
  const [currentStep, setCurrentStep] = useState<'setup' | 'assign' | 'payment'>('setup')
  const [splits, setSplits] = useState<SplitPayment[]>([])
  const [selectedPerson, setSelectedPerson] = useState(1)

  const orderTotal = order.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0
  const USD_TO_MXN = 17 // Tasa de cambio simple (ajustable)

  const initializeSplits = () => {
    const newSplits: SplitPayment[] = []
    for (let i = 1; i <= numberOfPeople; i++) {
      newSplits.push({
        personNumber: i,
        items: [],
        subtotal: 0,
        paymentMethods: [],
        tipAmount: 0,
        tipCurrency: 'MXN',
        paid: false,
      })
    }
    setSplits(newSplits)
    setCurrentStep('assign')
  }

  const assignItemToPerson = (item: OrderItem, personIndex: number) => {
    const newSplits = [...splits]
    const personSplit = newSplits[personIndex]

    // Verificar si el item ya está asignado
    const existingItemIndex = personSplit.items.findIndex(
      (i) => i.item.id === item.id
    )

    if (existingItemIndex >= 0) {
      // Incrementar cantidad
      const currentQty = personSplit.items[existingItemIndex].quantity
      const totalAssigned = splits.reduce(
        (sum, split) =>
          sum +
          (split.items.find((i) => i.item.id === item.id)?.quantity || 0),
        0
      )

      if (totalAssigned < item.quantity) {
        personSplit.items[existingItemIndex].quantity += 1
      }
    } else {
      // Agregar nuevo item con cantidad 1
      const totalAssigned = splits.reduce(
        (sum, split) =>
          sum +
          (split.items.find((i) => i.item.id === item.id)?.quantity || 0),
        0
      )

      if (totalAssigned < item.quantity) {
        personSplit.items.push({ item, quantity: 1 })
      }
    }

    // Recalcular subtotal
    personSplit.subtotal = personSplit.items.reduce(
      (sum, { item, quantity }) => sum + item.unitPrice * quantity,
      0
    )

    setSplits(newSplits)
  }

  const removeItemFromPerson = (itemId: string, personIndex: number) => {
    const newSplits = [...splits]
    const personSplit = newSplits[personIndex]
    const itemIndex = personSplit.items.findIndex((i) => i.item.id === itemId)

    if (itemIndex >= 0) {
      if (personSplit.items[itemIndex].quantity > 1) {
        personSplit.items[itemIndex].quantity -= 1
      } else {
        personSplit.items.splice(itemIndex, 1)
      }

      // Recalcular subtotal
      personSplit.subtotal = personSplit.items.reduce(
        (sum, { item, quantity }) => sum + item.unitPrice * quantity,
        0
      )

      setSplits(newSplits)
    }
  }

  const updatePaymentMethod = (
    personIndex: number,
    method: 'cash' | 'digital' | 'clip'
  ) => {
    const newSplits = [...splits]
    newSplits[personIndex].paymentMethod = method
    setSplits(newSplits)
  }

  const markAsPaid = (personIndex: number) => {
    const newSplits = [...splits]
    newSplits[personIndex].paid = true
    setSplits(newSplits)
  }

  const getTotalAssigned = (itemId: string) => {
    return splits.reduce(
      (sum, split) =>
        sum + (split.items.find((i) => i.item.id === itemId)?.quantity || 0),
      0
    )
  }

  const allItemsAssigned = () => {
    return order.items.every(
      (item) => getTotalAssigned(item.id) === item.quantity
    )
  }

  const allPaid = () => {
    return splits.every((split) => split.paid)
  }

  const handleConfirm = () => {
    if (!allItemsAssigned()) {
      alert('⚠️ Debes asignar todos los items antes de continuar')
      return
    }
    if (currentStep === 'assign') {
      setCurrentStep('payment')
    } else if (currentStep === 'payment' && allPaid()) {
      onConfirmSplit(splits)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h2 className="text-2xl font-bold">Dividir Cuenta</h2>
              <p className="text-purple-100">
                Mesa {order.tableNumber} - Total: ${orderTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Setup */}
          {currentStep === 'setup' && (
            <div className="space-y-6">
              <div className="text-center">
                <Users className="mx-auto mb-4 text-purple-600" size={64} />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¿Entre cuántas personas?
                </h3>
                <p className="text-gray-600">
                  Selecciona el número de comensales para dividir la cuenta
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() =>
                    setNumberOfPeople(Math.max(2, numberOfPeople - 1))
                  }
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full text-2xl font-bold transition-colors"
                >
                  -
                </button>
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                  {numberOfPeople}
                </div>
                <button
                  onClick={() =>
                    setNumberOfPeople(Math.min(10, numberOfPeople + 1))
                  }
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full text-2xl font-bold transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={initializeSplits}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: Assign Items */}
          {currentStep === 'assign' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Asignar Items a Cada Persona
                </h3>
                <div className="flex gap-2">
                  {splits.map((split, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPerson(index + 1)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedPerson === index + 1
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Persona {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Disponibles */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Items de la Orden
                </h4>
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const assigned = getTotalAssigned(item.id)
                    const remaining = item.quantity - assigned
                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-lg p-3 flex items-center justify-between ${
                          remaining > 0
                            ? 'border-2 border-purple-200'
                            : 'opacity-50'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-sm text-gray-600">
                            ${item.unitPrice.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-sm font-semibold ${
                              remaining > 0
                                ? 'text-purple-600'
                                : 'text-green-600'
                            }`}
                          >
                            {remaining > 0
                              ? `${remaining} restante${remaining > 1 ? 's' : ''}`
                              : '✓ Completo'}
                          </span>
                          {remaining > 0 && (
                            <button
                              onClick={() =>
                                assignItemToPerson(item, selectedPerson - 1)
                              }
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                              + Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Items Asignados a Persona Seleccionada */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Persona {selectedPerson} - Items Asignados
                </h4>
                {splits[selectedPerson - 1]?.items.length > 0 ? (
                  <div className="space-y-2">
                    {splits[selectedPerson - 1].items.map(
                      ({ item, quantity }) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.productName} × {quantity}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${(item.unitPrice * quantity).toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              removeItemFromPerson(item.id, selectedPerson - 1)
                            }
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            - Quitar
                          </button>
                        </div>
                      )
                    )}
                    <div className="bg-purple-600 text-white rounded-lg p-3 flex items-center justify-between font-bold">
                      <span>Subtotal:</span>
                      <span>
                        ${splits[selectedPerson - 1].subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay items asignados aún
                  </p>
                )}
              </div>

              <button
                onClick={handleConfirm}
                disabled={!allItemsAssigned()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Continuar a Pagos
              </button>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">
                Procesar Pagos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {splits.map((split, index) => {
                  const totalPaid = split.paymentMethods.reduce((sum, m) => {
                    const amount = m.currency === 'USD' ? m.amount * USD_TO_MXN : m.amount
                    return sum + amount
                  }, 0)
                  const totalWithTip = split.subtotal + (split.tipAmount || 0)
                  const amountDue = totalWithTip - totalPaid

                  return (
                    <div
                      key={index}
                      className={`rounded-xl p-4 border-2 ${
                        split.paid
                          ? 'bg-green-50 border-green-500'
                          : amountDue <= 0
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-lg">
                          Persona {split.personNumber}
                        </h4>
                        {split.paid && (
                          <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-bold">
                            ✓ Pagado
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="bg-gray-50 rounded-lg p-2 mb-3 text-xs text-gray-700 space-y-1 max-h-20 overflow-y-auto">
                        {split.items.map(({ item, quantity }) => (
                          <div key={item.id} className="flex justify-between">
                            <span className="truncate">{item.productName}</span>
                            <span className="font-bold">×{quantity}</span>
                          </div>
                        ))}
                      </div>

                      {!split.paid && (
                        <>
                          {/* Métodos de Pago */}
                          <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                              Métodos de Pago
                            </label>
                            <div className="space-y-2">
                              {split.paymentMethods.map((method, methodIdx) => (
                                <div key={methodIdx} className="flex gap-2 items-end">
                                  <select
                                    value={method.method}
                                    onChange={(e) => {
                                      const newSplits = [...splits]
                                      newSplits[index].paymentMethods[methodIdx].method = e.target.value as any
                                      setSplits(newSplits)
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-xs"
                                  >
                                    <option value="cash">💵 Efectivo</option>
                                    <option value="digital">💳 Digital</option>
                                    <option value="clip">📱 CLIP</option>
                                  </select>

                                  <select
                                    value={method.currency}
                                    onChange={(e) => {
                                      const newSplits = [...splits]
                                      newSplits[index].paymentMethods[methodIdx].currency = e.target.value as any
                                      setSplits(newSplits)
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs"
                                  >
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                  </select>

                                  <input
                                    type="number"
                                    value={method.amount}
                                    onChange={(e) => {
                                      const newSplits = [...splits]
                                      newSplits[index].paymentMethods[methodIdx].amount = parseFloat(e.target.value) || 0
                                      setSplits(newSplits)
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                  />

                                  <button
                                    onClick={() => {
                                      const newSplits = [...splits]
                                      newSplits[index].paymentMethods.splice(methodIdx, 1)
                                      setSplits(newSplits)
                                    }}
                                    className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}

                              <button
                                onClick={() => {
                                  const newSplits = [...splits]
                                  newSplits[index].paymentMethods.push({
                                    method: 'cash',
                                    currency: 'MXN',
                                    amount: 0,
                                  })
                                  setSplits(newSplits)
                                }}
                                className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold"
                              >
                                + Agregar Método
                              </button>
                            </div>
                          </div>

                          {/* Propina */}
                          <div className="mb-3 grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Propina
                              </label>
                              <input
                                type="number"
                                value={split.tipAmount || ''}
                                onChange={(e) => {
                                  const newSplits = [...splits]
                                  newSplits[index].tipAmount = e.target.value ? parseFloat(e.target.value) : 0
                                  setSplits(newSplits)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Moneda
                              </label>
                              <select
                                value={split.tipCurrency || 'MXN'}
                                onChange={(e) => {
                                  const newSplits = [...splits]
                                  newSplits[index].tipCurrency = e.target.value as any
                                  setSplits(newSplits)
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="MXN">MXN</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                          </div>

                          {/* Resumen */}
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span className="font-semibold">${split.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Propina ({split.tipCurrency}):</span>
                              <span className="font-semibold">${(split.tipAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-purple-300 pt-1 flex justify-between font-bold text-sm">
                              <span>Total Debido:</span>
                              <span className="text-purple-600">${totalWithTip.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pagado:</span>
                              <span className={totalPaid > totalWithTip ? 'text-green-600 font-bold' : 'text-gray-700'}>
                                ${totalPaid.toFixed(2)}
                              </span>
                            </div>
                            {amountDue > 0.01 && (
                              <div className="flex justify-between text-red-600 font-bold">
                                <span>Falta:</span>
                                <span>${amountDue.toFixed(2)}</span>
                              </div>
                            )}
                            {amountDue <= 0 && totalPaid > 0 && (
                              <div className="flex justify-between text-green-600 font-bold">
                                <span>✓ Completo</span>
                                {amountDue < 0 && <span>Cambio: ${Math.abs(amountDue).toFixed(2)}</span>}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => markAsPaid(index)}
                            disabled={amountDue > 0.01}
                            className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Check size={18} />
                            Marcar como Pagado
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between text-2xl font-bold">
                  <span className="text-gray-900">Total General:</span>
                  <span className="text-purple-600">
                    ${splits
                      .reduce((sum, split) => sum + split.subtotal + (split.tipAmount || 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!allPaid()}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Check size={20} />
                Confirmar División de Cuenta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
