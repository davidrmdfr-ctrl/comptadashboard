import React, { useState, useMemo } from 'react'
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
    cost_basis: 0,
    currency: 'USD',
    current_price: 0,
    parent_id: null,
    isin: '',
    pricePerUnit: 0,
    inputType: 'quantity',
    eur_amount: 0,
  })
  const [saving, setSaving] = useState(false)
  const [resolvingISIN, setResolvingISIN] = useState(false)
  const [isinError, setIsinError] = useState(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [editingInvestmentId, setEditingInvestmentId] = useState(null)
  const [editingInvestmentField, setEditingInvestmentField] = useState(null)
  const [editingInvestmentData, setEditingInvestmentData] = useState({})
  const [savedInvestments, setSavedInvestments] = useState({})

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
        cost_basis: parseFloat(formData.cost_basis),
        current_price: addingType === 'public' ? (formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : 0) : 0,
        currency: formData.currency,
        eur_amount: formData.eur_amount ? parseFloat(formData.eur_amount) : parseFloat(formData.cost_basis),
        parent_id: formData.parent_id || addingToBroker || null,
      }

      await investmentsAPI.create(data)
      setFormData({
        symbol: '',
        name: '',
        investment_type: 'stock',
        quantity: 0,
        cost_basis: 0,
        currency: 'USD',
        current_price: 0,
        parent_id: null,
        isin: '',
        pricePerUnit: 0,
        inputType: 'quantity',
        eur_amount: 0,
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
      eur_amount: investment.eur_amount,
      quantity: investment.quantity,
      cost_basis: investment.cost_basis,
      name: investment.name,
    })
  }

  const handleEditInvestment = async (id) => {
    try {
      setSaving(true)
      const updateData = {}
      if (editingInvestmentField === 'eur_amount') updateData.eur_amount = parseFloat(editingInvestmentData.eur_amount)
      if (editingInvestmentField === 'quantity') updateData.quantity = parseFloat(editingInvestmentData.quantity)
      if (editingInvestmentField === 'cost_basis') updateData.cost_basis = parseFloat(editingInvestmentData.cost_basis)
      if (editingInvestmentField === 'name') updateData.name = editingInvestmentData.name

      await investmentsAPI.update(id, updateData)
      setSavedInvestments({ ...savedInvestments, [id]: editingInvestmentData[editingInvestmentField] })
      setEditingInvestmentId(null)
      setEditingInvestmentField(null)
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
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
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Initial Value</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Price</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Current Value
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.eur_amount, 0), 'EUR')}
                  </div>
                </th>
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
                  const brokerTotal =
                    broker.eur_amount + broker.holdings.reduce((sum, inv) => sum + inv.eur_amount, 0)

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
                          {(() => {
                            const totalInitialLocal = broker.cost_basis + broker.holdings.reduce((sum, inv) => sum + inv.cost_basis, 0)
                            const totalCurrentLocal = broker.holdings.reduce((sum, inv) => sum + inv.current_price * inv.quantity, 0)
                            const totalCurrentEur = brokerTotal
                            const currentExchangeRate = totalCurrentLocal > 0 ? totalCurrentEur / totalCurrentLocal : 0
                            const totalInitialEur = totalInitialLocal * currentExchangeRate
                            return formatCurrency(totalInitialEur, 'EUR')
                          })()}
                        </td>
                        <td className="px-6 py-4"></td>
                        <td className="px-6 py-4 text-right font-bold">
                          {formatCurrency(brokerTotal, 'EUR')}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {(() => {
                            const totalInitialLocal = broker.cost_basis + broker.holdings.reduce((sum, inv) => sum + inv.cost_basis, 0)
                            const totalCurrentLocal = broker.holdings.reduce((sum, inv) => sum + inv.current_price * inv.quantity, 0)
                            const totalCurrentEur = brokerTotal
                            const currentExchangeRate = totalCurrentLocal > 0 ? totalCurrentEur / totalCurrentLocal : 0
                            const totalInitialEur = totalInitialLocal * currentExchangeRate
                            const changeEur = totalCurrentEur - totalInitialEur
                            return <span className={changeEur >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(changeEur, 'EUR')}</span>
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {(() => {
                            const totalInitialLocal = broker.cost_basis + broker.holdings.reduce((sum, inv) => sum + inv.cost_basis, 0)
                            const totalCurrentLocal = broker.holdings.reduce((sum, inv) => sum + inv.current_price * inv.quantity, 0)
                            const totalCurrentEur = brokerTotal
                            const currentExchangeRate = totalCurrentLocal > 0 ? totalCurrentEur / totalCurrentLocal : 0
                            const totalInitialEur = totalInitialLocal * currentExchangeRate
                            const changeEur = totalCurrentEur - totalInitialEur
                            const pctChange = totalInitialEur > 0 ? (changeEur / totalInitialEur * 100).toFixed(2) : 0
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
                                cost_basis: 0,
                                currency: 'USD',
                                current_price: 0,
                                parent_id: broker.id,
                                isin: '',
                                pricePerUnit: 0,
                                inputType: 'quantity',
                                eur_amount: 0,
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
                                  {inv.name || inv.symbol}
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
                                  {inv.quantity.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(inv.quantity > 0 ? inv.cost_basis / inv.quantity : 0, inv.currency)}
                              <br />
                              <span className="text-gray-500">{inv.currency}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {editingInvestmentId === inv.id && editingInvestmentField === 'cost_basis' ? (
                                <input
                                  type="number"
                                  value={editingInvestmentData.cost_basis || inv.cost_basis}
                                  onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, cost_basis: parseFloat(e.target.value) })}
                                  onBlur={() => handleEditInvestment(inv.id)}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Tab') handleEditInvestment(inv.id) }}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                                  step="0.01"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                  onClick={() => handleFieldClick(inv, 'cost_basis')}
                                >
                                  {formatCurrency(inv.cost_basis, inv.currency)}
                                  <br />
                                  <span className="text-xs text-gray-500">{inv.currency}</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(inv.current_price, inv.currency)}
                              <br />
                              <span className="text-gray-500">{inv.currency}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {formatCurrency(inv.current_price * inv.quantity, inv.currency)}
                              <br />
                              <span className="text-gray-500 font-medium">{formatCurrency(inv.eur_amount, 'EUR')}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm">
                              {(() => {
                                const currentValueLocal = inv.current_price * inv.quantity
                                const changeLocal = currentValueLocal - inv.cost_basis
                                const currentExchangeRate = inv.eur_amount / currentValueLocal
                                const changeEur = changeLocal * currentExchangeRate
                                return (
                                  <>
                                    <span className={changeLocal >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {formatCurrency(changeLocal, inv.currency)}
                                    </span>
                                    <br />
                                    <span className={`text-gray-500 font-medium ${changeEur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatCurrency(changeEur, 'EUR')}
                                    </span>
                                  </>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              {(() => {
                                const pctChange = inv.cost_basis > 0 ? ((inv.current_price * inv.quantity - inv.cost_basis) / inv.cost_basis * 100).toFixed(2) : 0
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
                value={formData.cost_basis}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0
                  let newData = { ...formData, cost_basis: amount }
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
                      pricePerUnit: formData.cost_basis ? formData.cost_basis / qty : 0,
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
                      quantity: formData.cost_basis ? formData.cost_basis / price : 0,
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
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organized.privateInvs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No private investments yet
                  </td>
                </tr>
              ) : (
                organized.privateInvs.map((inv) => (
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
                          {inv.name || inv.symbol}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{inv.investment_type}</td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(inv.cost_basis, inv.currency)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium cursor-pointer hover:bg-blue-100" onClick={() => handleFieldClick(inv, 'eur_amount')}>
                      {editingInvestmentId === inv.id && editingInvestmentField === 'eur_amount' ? (
                        <input
                          type="number"
                          value={editingInvestmentData.eur_amount}
                          onChange={(e) => setEditingInvestmentData({ ...editingInvestmentData, eur_amount: e.target.value })}
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
                        formatCurrency(savedInvestments[inv.id] !== undefined ? savedInvestments[inv.id] : inv.eur_amount, 'EUR')
                      )}
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
                ))
              )}

              {/* Add button for Private */}
              <tr className="hover:bg-purple-100 cursor-pointer bg-purple-50">
                <td colSpan="5" className="px-6 py-4 text-center">
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
              <label className="block text-xs text-gray-600 mb-1">Initial Amount</label>
              <input
                type="number"
                placeholder="0"
                value={formData.cost_basis}
                onChange={(e) => setFormData({ ...formData, cost_basis: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded w-full"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Current Value</label>
              <input
                type="number"
                placeholder="0"
                value={formData.eur_amount || formData.cost_basis}
                onChange={(e) => setFormData({ ...formData, eur_amount: e.target.value })}
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
