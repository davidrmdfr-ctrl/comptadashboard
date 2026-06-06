import React, { useState, useMemo, useRef, useEffect } from 'react'
import { accountsAPI } from '../api'

export default function AccountsTable({ accounts, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedParents, setExpandedParents] = useState(new Set())
  const [localAccounts, setLocalAccounts] = useState(accounts)
  const inputRef = useRef(null)

  const [formData, setFormData] = useState({
    account_name: '',
    currency: 'EUR',
    amount: 0,
    parent_id: null,
  })

  // Sync local accounts with prop accounts
  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  const organized = useMemo(() => {
    const parentAccounts = {}
    const childAccounts = {}

    localAccounts.forEach((account) => {
      if (account.parent_id) {
        if (!childAccounts[account.parent_id]) {
          childAccounts[account.parent_id] = []
        }
        childAccounts[account.parent_id].push(account)
      } else {
        parentAccounts[account.id] = account
      }
    })

    return { parentAccounts, childAccounts }
  }, [localAccounts])

  // Auto-select input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.select()
    }
  }, [editingId])

  const handleEditStart = (account) => {
    setEditingId(account.id)
    setEditAmount(account.amount.toString())
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditAmount('')
  }

  const handleEditSave = async () => {
    if (!editingId) return

    try {
      setSaving(true)
      const response = await accountsAPI.update(editingId, { amount: parseFloat(editAmount) })
      // Update local state with the response (includes recalculated EUR value)
      const updatedAccount = response.data
      setLocalAccounts(localAccounts.map(acc => acc.id === editingId ? updatedAccount : acc))
      setEditingId(null)
      setEditAmount('')
    } catch (err) {
      alert(`Error saving: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Delete this account?')) {
      try {
        await accountsAPI.delete(id)
        onUpdate()
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleAddAccount = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await accountsAPI.create({
        ...formData,
        amount: parseFloat(formData.amount),
      })
      setFormData({
        account_name: '',
        currency: 'EUR',
        amount: 0,
        parent_id: null,
      })
      setShowAddForm(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const toggleExpanded = (parentId) => {
    const newSet = new Set(expandedParents)
    if (newSet.has(parentId)) {
      newSet.delete(parentId)
    } else {
      newSet.add(parentId)
    }
    setExpandedParents(newSet)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (accounts.length === 0 && !showAddForm) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-gray-500 mb-4">No accounts tracked</p>
        <button
          onClick={() => {
            setFormData({ account_name: '', currency: 'EUR', amount: 0, parent_id: null })
            setShowAddForm(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Account
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        {accounts.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Account</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Currency</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">EUR Value</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.values(organized.parentAccounts).map((parentAccount) => {
                const children = organized.childAccounts[parentAccount.id] || []
                const isExpanded = expandedParents.has(parentAccount.id)

                return (
                  <React.Fragment key={parentAccount.id}>
                    <tr className="hover:bg-gray-50 bg-blue-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {children.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(parentAccount.id)}
                              className="p-0 text-gray-600 hover:text-gray-900 w-5 text-center"
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          )}
                          {children.length === 0 && <span className="w-5"></span>}
                          {parentAccount.account_name || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">—</td>
                      <td className="px-6 py-4 text-right">
                        {children.length > 0 ? (
                          <span className="text-gray-600">—</span>
                        ) : editingId === parentAccount.id ? (
                          <div className="flex gap-1">
                            <input
                              ref={inputRef}
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="w-28 px-2 py-1 border border-gray-300 rounded text-right"
                              step="0.01"
                            />
                            <button
                              onClick={handleEditSave}
                              disabled={saving}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                            onClick={() => handleEditStart(parentAccount)}
                          >
                            {parentAccount.amount.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(
                          [parentAccount, ...children].reduce((sum, acc) => sum + acc.eur_amount, 0)
                        )}
                      </td>
                      <td className="px-6 py-4 text-center flex gap-1 justify-center">
                        <button
                          onClick={() => {
                            setFormData({
                              account_name: '',
                              currency: 'EUR',
                              amount: 0,
                              parent_id: parentAccount.id,
                            })
                            setShowAddForm(true)
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="Add currency"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(parentAccount.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>

                    {isExpanded &&
                      children.map((child) => (
                        <tr key={child.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 pl-16 text-gray-700">{child.account_name}</td>
                          <td className="px-6 py-4 text-center font-medium">{child.currency}</td>
                          <td className="px-6 py-4 text-right">
                            {editingId === child.id ? (
                              <div className="flex gap-1">
                                <input
                                  ref={inputRef}
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-28 px-2 py-1 border border-gray-300 rounded text-right"
                                  step="0.01"
                                />
                                <button
                                  onClick={handleEditSave}
                                  disabled={saving}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span
                                className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                onClick={() => handleEditStart(child)}
                              >
                                {child.amount.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatCurrency(child.eur_amount)}
                          </td>
                          <td className="px-6 py-4 text-center flex gap-1 justify-center">
                            <button
                              onClick={() => handleDeleteAccount(child.id)}
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
              })}

              {/* Total Row */}
              {localAccounts.length > 0 && (
                <tr className="bg-blue-50 font-semibold hover:bg-blue-100">
                  <td colSpan="3" className="px-6 py-4">Total</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(localAccounts.reduce((sum, acc) => sum + acc.eur_amount, 0))}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <form onSubmit={handleAddAccount} className="mt-6 p-6 border border-gray-200 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4">Add Account</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Account name"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              required
            />
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="SGD">SGD</option>
              <option value="HKD">HKD</option>
              <option value="JPY">JPY</option>
              <option value="AUD">AUD</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData({ account_name: '', currency: 'EUR', amount: 0, parent_id: null })
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
