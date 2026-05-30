import React, { useState } from 'react'
import { snapshotsAPI } from '../api'

export default function TotalValue({ accounts, investments, properties, previousSnapshot, onSnapshotSaved }) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Calculate total in EUR
  const accountsTotal = accounts.reduce((sum, acc) => sum + acc.eur_amount, 0)
  const investmentsTotal = investments.reduce((sum, inv) => sum + inv.eur_amount, 0)
  const propertiesTotal = properties.reduce((sum, prop) => {
    const equity = prop.latest_equity?.net_equity || 0
    return sum + equity
  }, 0)

  const total = accountsTotal + investmentsTotal + propertiesTotal

  const handleSaveSnapshot = async () => {
    try {
      setSaving(true)
      const cashBreakdown = JSON.stringify({
        exchange_rates: accounts.reduce((acc, a) => ({ ...acc, [a.currency]: a.exchange_rate }), {}),
        currency_totals_eur: accounts.reduce((acc, a) => ({ ...acc, [a.currency]: a.eur_amount }), {}),
      })

      await snapshotsAPI.create({
        total_assets_eur: total,
        total_debt_eur: 0,
        net_equity_eur: total,
        cash_breakdown: cashBreakdown,
        notes: `Portfolio snapshot`,
      })

      setMessage({ type: 'success', text: 'Snapshot saved!' })
      setTimeout(() => setMessage(null), 3000)
      onSnapshotSaved?.()
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const previousTotal = previousSnapshot?.total_assets_eur || 0
  const deltaTotal = total - previousTotal
  const deltaPercent = previousTotal > 0 ? (deltaTotal / previousTotal) * 100 : 0

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-semibold opacity-90 mb-2">Total Portfolio Value</h2>
          <div className="text-5xl font-bold">{formatCurrency(total)}</div>
        </div>
        <button
          onClick={handleSaveSnapshot}
          disabled={saving}
          className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-white font-medium transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Snapshot'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'} text-white text-sm`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-sm mb-6">
        <div className="bg-blue-500 bg-opacity-50 rounded-lg p-4">
          <p className="opacity-75 mb-1">Cash</p>
          <p className="text-2xl font-bold">{formatCurrency(accountsTotal)}</p>
        </div>
        <div className="bg-blue-500 bg-opacity-50 rounded-lg p-4">
          <p className="opacity-75 mb-1">Investments</p>
          <p className="text-2xl font-bold">{formatCurrency(investmentsTotal)}</p>
        </div>
        <div className="bg-blue-500 bg-opacity-50 rounded-lg p-4">
          <p className="opacity-75 mb-1">Properties</p>
          <p className="text-2xl font-bold">{formatCurrency(propertiesTotal)}</p>
        </div>
      </div>

      {previousSnapshot && (
        <div className="bg-blue-500 bg-opacity-30 rounded-lg p-4 text-sm">
          <p className="opacity-75 mb-1">Last Month</p>
          <div className="flex justify-between">
            <span>{formatCurrency(previousTotal)}</span>
            <span className={deltaTotal >= 0 ? 'text-green-300' : 'text-red-300'}>
              {deltaTotal >= 0 ? '+' : ''}{formatCurrency(deltaTotal)} ({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
