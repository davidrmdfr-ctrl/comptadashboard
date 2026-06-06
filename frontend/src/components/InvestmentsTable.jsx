import React, { useState, useMemo, useEffect, useRef } from 'react'
import { investmentsAPI, marketAPI } from '../api'

export default function InvestmentsTable({ investments, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingType, setAddingType] = useState(null) // 'public' or 'private'
  const [addingToBroker, setAddingToBroker] = useState(null)
  const [showAddBroker, setShowAddBroker] = useState(false)
  const [brokerName, setBrokerName] = useState('')
  const [expandedBrokers, setExpandedBrokers] = useState(new Set())
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    investment_type: 'stock',
    quantity: 0,
    initial_amount: 0,
    currency: 'USD',
    exchange_rate: 1,
    current_price: 0,
    parent_id: null,
    isin: '',
    pricePerUnit: 0,
    inputType: 'quantity',
    current_amount: 0,
  })
  const [saving, setSaving] = useState(false)
  const [resolvingISIN, setResolvingISIN] = useState(false)
  const [isinError, setIsinError] = useState(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [editingInvestmentId, setEditingInvestmentId] = useState(null)
  const [editingInvestmentField, setEditingInvestmentField] = useState(null)
  const [editingInvestmentValue, setEditingInvestmentValue] = useState('')
  const [savedInvestments, setSavedInvestments] = useState({})
  const editInputRef = useRef(null)
  const expandedBrokersRef = useRef(new Set())

  // Preserve expanded state across data reloads
  useEffect(() => {
    expandedBrokersRef.current = expandedBrokers
  }, [expandedBrokers])

  // Restore expanded state when investments data changes
  useEffect(() => {
    setExpandedBrokers(new Set(expandedBrokersRef.current))
  }, [investments])

  // Auto-select input when editing
  useEffect(() => {
    if (editingInvestmentId && editInputRef.current) {
      editInputRef.current.select()
    }
  }, [editingInvestmentId])

  // Organize investments: brokers + their holdings vs private
  const organized = useMemo(() => {
    const brokers = {}
    const privateInvs = []

    investments.forEach((inv) => {
      if (inv.is_broker) {
        brokers[inv.id] = { ...inv, holdings: [] }
      } else if (inv.parent_id) {
        if (brokers[inv.parent_id]) {
          brokers[inv.parent_id].holdings.push(inv)
        }
      } else {
        privateInvs.push(inv)
      }
    })

    return { brokers: Object.values(brokers), privateInvs }
  }, [investments])

  const handleLookupETF = async () => {
    if (!formData.isin || formData.isin.trim() === '') return
    if (!formData.currency) return

    try {
      setLookingUp(true)
      setIsinError(null)
      const res = await marketAPI.lookupETF(formData.isin, formData.currency)

      if (res.data.success) {
        setFormData({
          ...formData,
          symbol: res.data.ticker,
          name: res.data.name,
          current_price: res.data.price || 0,
        })
        setIsinError(null)
      } else {
        setIsinError(res.data.message)
      }
    } catch (err) {
      setIsinError(`Error: ${err.message}`)
    } finally {
      setLookingUp(false)
    }
  }

  const handleAddBroker = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const data = {
        symbol: brokerName,
        name: brokerName,
        investment_type: 'broker',
        quantity: 0,
        cost_basis: 0,
        currency: 'EUR',
        current_price: 0,
        eur_amount: 0,
        parent_id: null,
        is_broker: true,
      }
      await investmentsAPI.create(data)
      setBrokerName('')
      setShowAddBroker(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddInvestment = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const data = {
        symbol: addingType === 'public' ? (formData.isin || 'Investment') : formData.symbol,
        name: addingType === 'public' ? (formData.name || formData.isin || 'Investment') : formData.name,
        investment_type: formData.investment_type,
        quantity: parseFloat(formData.quantity) || 1,
        initial_amount: parseFloat(formData.initial_amount),
        current_price: addingType === 'public' ? (formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : 0) : 0,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        eur_initial_amount: parseFloat(formData.initial_amount) * (parseFloat(formData.exchange_rate) || 1.0),
        current_amount: parseFloat(formData.current_amount) || parseFloat(formData.initial_amount),
        eur_current_amount: (parseFloat(formData.current_amount) || parseFloat(formData.initial_amount)) * (parseFloat(formData.exchange_rate) || 1.0),
        parent_id: formData.parent_id || addingToBroker || null,
      }

      await investmentsAPI.create(data)
      setFormData({
        symbol: '',
        name: '',
        investment_type: 'stock',
        quantity: 0,
        initial_amount: 0,
        currency: 'USD',
        exchange_rate: 1,
        current_price: 0,
        parent_id: null,
        isin: '',
        pricePerUnit: 0,
        inputType: 'quantity',
        current_amount: 0,
      })
      setShowAddForm(false)
      setAddingType(null)
      setAddingToBroker(null)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInvestment = async (id) => {
    if (window.confirm('Delete this investment?')) {
      try {
        await investmentsAPI.delete(id)
        onUpdate()
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleDeleteBroker = async (id) => {
    if (window.confirm('Delete this broker?')) {
      try {
        await investmentsAPI.delete(id)
        onUpdate()
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleFieldClick = (investment, field) => {
    setEditingInvestmentId(investment.id)
    setEditingInvestmentField(field)
    setEditingInvestmentData({
      eur_current_amount: investment.eur_current_amount,
      quantity: investment.quantity,
      initial_amount: investment.initial_amount,
      current_amount: investment.current_amount,
      name: investment.name,
    })
  }

  const handleEditStart = (inv, field) => {
    setEditingInvestmentId(inv.id)
    setEditingInvestmentField(field)
    setEditingInvestmentValue(inv[field]?.toString() || '')
  }

  const handleEditCancel = () => {
    setEditingInvestmentId(null)
    setEditingInvestmentField(null)
    setEditingInvestmentValue('')
  }

  const handleEditInvestment = async () => {
    if (!editingInvestmentId || !editingInvestmentField) return
    try {
      setSaving(true)
      const updateData = { [editingInvestmentField]: parseFloat(editingInvestmentValue) || editingInvestmentValue }
      await investmentsAPI.update(editingInvestmentId, updateData)
      setSavedInvestments({
        ...savedInvestments,
        [editingInvestmentId]: { ...savedInvestments[editingInvestmentId], ...updateData }
      })
      setEditingInvestmentId(null)
      setEditingInvestmentField(null)
      setEditingInvestmentValue('')
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      handleEditInvestment()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const toggleExpandedBroker = (brokerId) => {
    const newSet = new Set(expandedBrokers)
    if (newSet.has(brokerId)) {
      newSet.delete(brokerId)
    } else {
      newSet.add(brokerId)
    }
    setExpandedBrokers(newSet)
  }

  const formatCurrency = (value, currency) => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)

    if (currency === 'EUR') {
      return `${formatted} €`
    }
    return `${formatted} ${currency}`
  }

  return (
    <div className="space-y-8">
      {/* PUBLIC INVESTMENTS TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Public</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-blue-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Symbol</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Quantity</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Initial Price</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Initial Amount</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Price</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Value</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Change</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">% Change</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organized.brokers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No broker accounts yet
                  </td>
                </tr>
              ) : (
                organized.brokers.map((broker) => {
                  const isExpanded = expandedBrokers.has(broker.id)
                  const brokerInitialEur = (broker.eur_initial_amount || 0) + broker.holdings.reduce((sum, inv) => sum + (inv.eur_initial_amount || 0), 0)
                  const brokerCurrentEur = (broker.eur_current_amount || 0) + broker.holdings.reduce((sum, inv) => sum + (inv.eur_current_amount || 0), 0)

                  return (
                    <React.Fragment key={broker.id}>
                      {/* Broker row */}
                      <tr
                        className="hover:bg-gray-50 cursor-pointer bg-gray-100"
                        onClick={() => toggleExpandedBroker(broker.id)}
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                          <span>{broker.holdings.length > 0 ? (isExpanded ? '▼' : '▶') : '  '}</span>
                          {broker.symbol}
                        </td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-right font-bold">
                          {formatCurrency(brokerInitialEur, 'EUR')}
                        </td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-right font-bold">
                          {formatCurrency(brokerCurrentEur, 'EUR')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {(() => {
                            const changeEur = brokerCurrentEur - brokerInitialEur
                            return <span className={changeEur >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(changeEur, 'EUR')}</span>
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {(() => {
                            const changeEur = brokerCurrentEur - brokerInitialEur
                            const pctChange = brokerInitialEur > 0 ? (changeEur / brokerInitialEur * 100).toFixed(2) : 0
                            return <span className={pctChange >= 0 ? 'text-green-600' : 'text-red-600'}>{pctChange}%</span>
                          })()}
                        </td>
                        <td className="px-6 py-4 text-center flex gap-1 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddingType('public')
                              setAddingToBroker(broker.id)
                              setFormData({
                                symbol: '',
                                name: '',
                                investment_type: 'stock',
                                quantity: 0,
                                initial_amount: 0,
                                currency: 'USD',
                                current_price: 0,
                                parent_id: broker.id,
                                isin: '',
                                pricePerUnit: 0,
                                inputType: 'quantity',
                                exchange_rate: 1,
                                current_amount: 0,
                              })
                              setShowAddForm(true)
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                            title="Add investment"
                          >
                            +
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBroker(broker.id)
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                            title="Delete broker"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>

                      {/* Holdings under broker */}
                      {isExpanded &&
                        broker.holdings.map((inv) => (
                          <tr key={inv.id} className="bg-gray-50 hover:bg-gray-100">
                            <td className="px-6 py-4 pl-12 text-gray-700">
                              {editingInvestmentId === inv.id && editingInvestmentField === 'name' ? (
                                <input
                                  type="text"
                                  value={editingInvestmentData.name || inv.name}
                                  onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, name: e.target.value })}
                                  onBlur={() => handleEditInvestment(inv.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') handleEditInvestment(inv.id) }}
                                  className="px-2 py-1 border border-gray-300 rounded"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                  onClick={() => handleFieldClick(inv, 'name')}
                                >
                                  {(savedInvestments[inv.id]?.name) || inv.name || inv.symbol}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {editingInvestmentId === inv.id && editingInvestmentField === 'quantity' ? (
                                <input
                                  type="number"
                                  value={editingInvestmentData.quantity || inv.quantity}
                                  onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, quantity: parseFloat(e.target.value) })}
                                  onBlur={() => handleEditInvestment(inv.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') handleEditInvestment(inv.id) }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                                  step="0.01"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                  onClick={() => handleFieldClick(inv, 'quantity')}
                                >
                                  {((savedInvestments[inv.id]?.quantity) ?? inv.quantity).toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(inv.quantity > 0 ? inv.initial_amount / inv.quantity : 0, inv.currency)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {editingInvestmentId === inv.id && editingInvestmentField === 'initial_amount' ? (
                                <input
                                  type="number"
                                  value={editingInvestmentData.initial_amount || inv.initial_amount}
                                  onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, initial_amount: parseFloat(e.target.value) })}
                                  onBlur={() => handleEditInvestment(inv.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') handleEditInvestment(inv.id) }}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                  step="0.01"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                  onClick={() => handleFieldClick(inv, 'initial_amount')}
                                >
                                  {formatCurrency((savedInvestments[inv.id]?.initial_amount) ?? inv.initial_amount, inv.currency)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(inv.current_price, inv.currency)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(inv.current_price * inv.quantity, inv.currency)} / {formatCurrency(inv.eur_current_amount, 'EUR')}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {(() => {
                                const currentValueLocal = inv.current_price * inv.quantity
                                const changeLocal = currentValueLocal - inv.initial_amount
                                const fxRate = inv.exchange_rate || 1.0
                                const changeEur = (currentValueLocal * fxRate) - (inv.initial_amount * fxRate)
                                return (
                                  <span className={changeLocal >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {formatCurrency(changeLocal, inv.currency)} / {formatCurrency(changeEur, 'EUR')}
                                  </span>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              {(() => {
                                const pctChange = inv.initial_amount > 0 ? ((inv.current_price * inv.quantity - inv.initial_amount) / inv.initial_amount * 100).toFixed(2) : 0
                                return <span className={pctChange >= 0 ? 'text-green-600' : 'text-red-600'}>{pctChange}%</span>
                              })()}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteInvestment(inv.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  )
                })
              )}

              {/* Total Row */}
              {organized.brokers.length > 0 && (() => {
                const totalInitialEur = organized.brokers.reduce((sum, broker) => sum + ((broker.eur_initial_amount || 0) + broker.holdings.reduce((s, inv) => s + (inv.eur_initial_amount || 0), 0)), 0)
                const totalCurrentEur = organized.brokers.reduce((sum, broker) => sum + ((broker.eur_current_amount || 0) + broker.holdings.reduce((s, inv) => s + (inv.eur_current_amount || 0), 0)), 0)
                const eurChange = totalCurrentEur - totalInitialEur
                const percentChange = totalInitialEur > 0 ? (eurChange / totalInitialEur) * 100 : 0
                const changeColor = eurChange >= 0 ? 'text-green-600' : 'text-red-600'

                return (
                  <tr className="bg-blue-50 font-semibold hover:bg-blue-100">
                    <td colSpan="3" className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(totalInitialEur, 'EUR')}
                    </td>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(totalCurrentEur, 'EUR')}
                    </td>
                    <td className={`px-6 py-4 text-right ${changeColor}`}>
                      {eurChange >= 0 ? '+' : ''}{formatCurrency(eurChange, 'EUR')}
                    </td>
                    <td className={`px-6 py-4 text-right ${changeColor}`}>
                      {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                    </td>
                    <td></td>
                  </tr>
                )
              })()}

              {/* Add button for Public - Add Broker */}
              <tr className="hover:bg-blue-100 bg-blue-50">
                <td colSpan="9" className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setShowAddBroker(true)
                    }}
                    className="text-3xl text-gray-400 hover:text-blue-600 transition w-full"
                    title="Add broker"
                  >
                    +
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Broker Form */}
      {showAddBroker && (
        <form onSubmit={handleAddBroker} className="px-6 py-6 border border-gray-200 bg-gray-50 rounded-lg mb-4">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Add New Broker</h4>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <input
              type="text"
              placeholder="Broker Name (e.g., Vanguard, Fidelity)"
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Broker'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddBroker(false)
                setBrokerName('')
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add form - appears here if adding Public */}
      {showAddForm && addingType === 'public' && (
        <form onSubmit={handleAddInvestment} className="px-6 py-6 border border-gray-200 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Add Public Investment</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Broker with + button */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Broker</label>
              <div className="flex gap-2">
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select a broker...</option>
                  {organized.brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>
                      {broker.symbol}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddBroker(true)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded transition text-lg"
                  title="Add new broker"
                >
                  +
                </button>
              </div>
            </div>

            {/* ISIN */}
            <input
              type="text"
              placeholder="ISIN (e.g., IE000I8KRLL9)"
              value={formData.isin}
              onChange={(e) => {
                setFormData({ ...formData, isin: e.target.value })
              }}
              onBlur={handleLookupETF}
              className="px-3 py-2 border border-gray-300 rounded"
            />

            {/* Currency for lookup */}
            <select
              value={formData.currency}
              onChange={(e) => {
                setFormData({ ...formData, currency: e.target.value })
              }}
              onBlur={handleLookupETF}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option>EUR</option>
              <option>GBP</option>
              <option>CHF</option>
              <option>USD</option>
            </select>

            {isinError && <p className="col-span-2 text-xs text-red-600">{isinError}</p>}

            {/* Fund Name */}
            <input
              type="text"
              placeholder="Fund Name (fetched on first refresh)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              disabled
            />

            {/* Investment Type */}
            <select
              value={formData.investment_type}
              onChange={(e) => setFormData({ ...formData, investment_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="bond">Bond</option>
              <option value="crypto">Crypto</option>
            </select>

            {/* Currency */}
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option>EUR</option>
              <option>USD</option>
              <option>GBP</option>
              <option>SGD</option>
              <option>HKD</option>
              <option>JPY</option>
              <option>AUD</option>
            </select>

            {/* Initial Amount */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Initial Amount (Total Invested)</label>
              <input
                type="number"
                placeholder="0"
                value={formData.initial_amount}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0
                  let newData = { ...formData, initial_amount: amount }
                  if (formData.inputType === 'quantity' && formData.quantity) {
                    newData.pricePerUnit = amount / formData.quantity
                  } else if (formData.inputType === 'price' && formData.pricePerUnit) {
                    newData.quantity = amount / formData.pricePerUnit
                  }
                  setFormData(newData)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                step="0.01"
                required
              />
            </div>

            {/* Toggle: Quantity vs Price Per Unit */}
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Input Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, inputType: 'quantity', pricePerUnit: 0 })
                  }}
                  className={`flex-1 px-2 py-2 rounded text-xs font-medium ${
                    formData.inputType === 'quantity'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  Quantity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, inputType: 'price', quantity: 0 })
                  }}
                  className={`flex-1 px-2 py-2 rounded text-xs font-medium ${
                    formData.inputType === 'price'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  Price Per Unit
                </button>
              </div>
            </div>

            {/* Quantity or Price Per Unit Input */}
            {formData.inputType === 'quantity' ? (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => {
                    const qty = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      quantity: qty,
                      pricePerUnit: formData.initial_amount ? formData.initial_amount / qty : 0,
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  step="0.01"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price Per Unit</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.pricePerUnit}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      pricePerUnit: price,
                      quantity: formData.initial_amount ? formData.initial_amount / price : 0,
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  step="0.01"
                  required
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Investment'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddingType(null)
                setAddingToBroker(null)
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* PRIVATE INVESTMENTS TABLE */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Private</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-purple-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Initial Amount</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Value</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Value EUR</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">EUR Change</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">% Change</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organized.privateInvs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No private investments yet
                  </td>
                </tr>
              ) : (
                organized.privateInvs.map((inv) => {
                  const fxRate = inv.exchange_rate || 1.0
                  const currentValueEur = inv.eur_current_amount || (inv.current_amount * fxRate)
                  const costBasisEur = inv.eur_initial_amount || (inv.initial_amount * fxRate)
                  const eurChange = currentValueEur - costBasisEur
                  const percentChange = costBasisEur > 0 ? (eurChange / costBasisEur) * 100 : 0
                  const changeColor = eurChange >= 0 ? 'text-green-600' : 'text-red-600'

                  return (
                    <tr key={inv.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {editingInvestmentId === inv.id && editingInvestmentField === 'name' ? (
                          <input
                            type="text"
                            value={editingInvestmentData.name || inv.name}
                            onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, name: e.target.value })}
                            onBlur={() => handleEditInvestment(inv.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') handleEditInvestment(inv.id) }}
                            className="px-2 py-1 border border-gray-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                            onClick={() => handleFieldClick(inv, 'name')}
                          >
                            {(savedInvestments[inv.id]?.name) || inv.name || inv.symbol}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{inv.investment_type}</td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency((savedInvestments[inv.id]?.initial_amount) ?? inv.initial_amount, inv.currency)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium cursor-pointer hover:bg-blue-100" onClick={() => handleFieldClick(inv, 'current_amount')}>
                        {editingInvestmentId === inv.id && editingInvestmentField === 'current_amount' ? (
                          <input
                            type="number"
                            value={editingInvestmentData.current_amount}
                            onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, current_amount: e.target.value })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                            step="0.01"
                            autoFocus
                            onBlur={() => handleEditInvestment(inv.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Tab') handleEditInvestment(inv.id)
                              if (e.key === 'Escape') setEditingInvestmentId(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          formatCurrency((savedInvestments[inv.id]?.current_amount) ?? inv.current_amount, inv.currency)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(currentValueEur, 'EUR')}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${changeColor}`}>
                        {eurChange >= 0 ? '+' : ''}{formatCurrency(eurChange, 'EUR')}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${changeColor}`}>
                        {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteInvestment(inv.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}

              {/* Total Row */}
              {organized.privateInvs.length > 0 && (() => {
                const totalCurrentEUR = organized.privateInvs.reduce((sum, inv) => sum + (inv.eur_current_amount || (inv.current_amount * (inv.exchange_rate || 1.0))), 0)
                const totalInitialEUR = organized.privateInvs.reduce((sum, inv) => sum + (inv.eur_initial_amount || (inv.initial_amount * (inv.exchange_rate || 1.0))), 0)
                const eurChange = totalCurrentEUR - totalInitialEUR
                const percentChange = totalInitialEUR > 0 ? (eurChange / totalInitialEUR) * 100 : 0
                const changeColor = eurChange >= 0 ? 'text-green-600' : 'text-red-600'

                return (
                  <tr className="bg-purple-50 font-semibold hover:bg-purple-100">
                    <td colSpan="3" className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(totalCurrentEUR, 'EUR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(totalCurrentEUR, 'EUR')}
                    </td>
                    <td className={`px-6 py-4 text-right ${changeColor}`}>
                      {eurChange >= 0 ? '+' : ''}{formatCurrency(eurChange, 'EUR')}
                    </td>
                    <td className={`px-6 py-4 text-right ${changeColor}`}>
                      {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
                    </td>
                    <td></td>
                  </tr>
                )
              })()}

              {/* Add button for Private */}
              <tr className="hover:bg-purple-100 cursor-pointer bg-purple-50">
                <td colSpan="8" className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setShowAddForm(true)
                      setAddingType('private')
                      setAddingToBroker(null)
                    }}
                    className="text-3xl text-gray-400 hover:text-purple-600 transition w-full"
                  >
                    +
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add form - appears here if adding Private */}
      {showAddForm && addingType === 'private' && (
        <form onSubmit={handleAddInvestment} className="px-6 py-6 border border-gray-200 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700">Add Private Investment</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <select
              value={formData.investment_type}
              onChange={(e) => setFormData({ ...formData, investment_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="private_equity">Private Equity</option>
              <option value="real_estate">Real Estate</option>
              <option value="crypto">Crypto Wallet</option>
              <option value="other">Other</option>
            </select>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option>EUR</option>
              <option>USD</option>
              <option>GBP</option>
              <option>SGD</option>
              <option>HKD</option>
              <option>JPY</option>
              <option>AUD</option>
            </select>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Initial Amount ({formData.currency})</label>
              <input
                type="number"
                placeholder="0"
                value={formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, initial_amount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded w-full"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Exchange Rate ({formData.currency}/EUR)</label>
              <input
                type="number"
                placeholder="1"
                value={formData.exchange_rate}
                onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded w-full"
                step="0.00001"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Current Value ({formData.currency})</label>
              <input
                type="number"
                placeholder="0"
                value={formData.current_amount || formData.initial_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded w-full"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Investment'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setAddingType(null)
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
