import React, { useState } from 'react'
import { accountsAPI } from '../api'

export default function AccountsTable({ accounts, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editAmount, setEditAmount] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleEditStart = (account) => {
    setEditingId(account.id)
    setEditAmount(account.amount)
  }

  const handleEditSave = async (id) => {
    try {
      setSaving(true)
      await accountsAPI.update(id, {
        amount: parseFloat(editAmount),
      })
      setEditingId(null)
      setEditAmount(null)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Currency</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700">Amount</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700">Rate to EUR</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700">EUR Value</th>
            <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {accounts.map((account) => (
            <tr key={account.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{account.currency}</td>
              <td className="px-6 py-4 text-right">
                {editingId === account.id ? (
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                    step="0.01"
                  />
                ) : (
                  <span>{formatCurrency(account.amount, account.currency)}</span>
                )}
              </td>
              <td className="px-6 py-4 text-right text-gray-600">{account.exchange_rate.toFixed(4)}</td>
              <td className="px-6 py-4 text-right font-medium">
                {formatCurrency(account.eur_amount, 'EUR')}
              </td>
              <td className="px-6 py-4 text-center">
                {editingId === account.id ? (
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEditSave(account.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditStart(account)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
