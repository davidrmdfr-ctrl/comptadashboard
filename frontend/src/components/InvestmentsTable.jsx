import React, { useState } from 'react'
import { investmentsAPI } from '../api'

export default function InvestmentsTable({ investments, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    investment_type: 'stock',
    quantity: 0,
    cost_basis: 0,
    currency: 'USD',
    current_price: 0,
  })
  const [saving, setSaving] = useState(false)

  const handleAddInvestment = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await investmentsAPI.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
        cost_basis: parseFloat(formData.cost_basis),
        current_price: parseFloat(formData.current_price),
      })
      setFormData({
        symbol: '',
        name: '',
        investment_type: 'stock',
        quantity: 0,
        cost_basis: 0,
        currency: 'USD',
        current_price: 0,
      })
      setShowAddForm(false)
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

  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (investments.length === 0 && !showAddForm) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-gray-500 mb-4">No investments yet</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Investment
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        {investments.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Symbol</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Quantity</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Price</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">EUR Value</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {investments.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.symbol}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.investment_type}</td>
                  <td className="px-6 py-4 text-right">{inv.quantity.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(inv.current_price, inv.currency)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatCurrency(inv.eur_amount, 'EUR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteInvestment(inv.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddInvestment} className="px-6 py-6 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Symbol (e.g., AAPL)"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              required
            />
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            />
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
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Cost Basis"
              value={formData.cost_basis}
              onChange={(e) => setFormData({ ...formData, cost_basis: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Current Price"
              value={formData.current_price}
              onChange={(e) => setFormData({ ...formData, current_price: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
            />
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
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Investment
          </button>
        </div>
      )}
    </div>
  )
}
