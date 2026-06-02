import React, { useState, useMemo, useEffect, useRef } from 'react'
import { accountsAPI } from '../api'

export default function AccountsTable({ accounts, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedParents, setExpandedParents] = useState(new Set())
  const [savedAccounts, setSavedAccounts] = useState({})
  const expandedParentsRef = useRef(new Set())
  const [formData, setFormData] = useState({
    account_name: '',
    currency: 'EUR',
    amount: 0,
    parent_id: null,
  })


  // Preserve expanded state across data reloads
  useEffect(() => {
    expandedParentsRef.current = expandedParents
  }, [expandedParents])

  // Restore expanded state when accounts data changes
  useEffect(() => {
    setExpandedParents(new Set(expandedParentsRef.current))
  }, [accounts])

  const organized = useMemo(() => {
    const parentAccounts = {}
    const childAccounts = {}

    accounts.forEach((account) => {
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
  }, [accounts])

  const handleEditStart = (account) => {
    setEditingId(account.id)
    setEditData({
      amount: savedAccounts[account.id] !== undefined ? savedAccounts[account.id] : account.amount,
      account_name: account.account_name,
    })
  }

  const handleEditSave = async (id) => {
    try {
      setSaving(true)
      await accountsAPI.update(id, editData)
      setSavedAccounts({ ...savedAccounts, [id]: parseFloat(editData.amount) })
      setEditingId(null)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
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

  const handleAddSubAccount = (parentId) => {
    setFormData({
      account_name: '',
      currency: 'EUR',
      amount: 0,
      parent_id: parentId,
    })
    setShowAddForm(true)
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
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  EUR Value
                  <div className="text-sm font-bold text-blue-600">
                    {formatCurrency(accounts.reduce((sum, acc) => sum + acc.eur_amount, 0))}
                  </div>
                </th>
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
                          {editingId === parentAccount.id ? (
                            <input
                              type="text"
                              value={editData.account_name}
                              onChange={(e) => setEditData({ ...editData, account_name: e.target.value })}
                              onBlur={() => handleEditSave(parentAccount.id)}
                              className="px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                              onClick={() => handleEditStart(parentAccount)}
                            >
                              {parentAccount.account_name || '—'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">—</td>
                      <td className="px-6 py-4 text-right">
                        {children.length > 0 ? (
                          <span className="text-gray-600">—</span>
                        ) : editingId === parentAccount.id ? (
                          <input
                            type="number"
                            value={editData.amount}
                            onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                            onBlur={() => handleEditSave(parentAccount.id)}
                            className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                            step="0.01"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                            onClick={() => handleEditStart(parentAccount)}
                          >
                            {(savedAccounts[parentAccount.id] !== undefined ? savedAccounts[parentAccount.id] : parentAccount.amount).toFixed(2)}
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
                          onClick={() => handleAddSubAccount(parentAccount.id)}
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
                          <td className="px-6 py-4 pl-16 text-gray-700">
                            {editingId === child.id ? (
                              <input
                                type="text"
                                value={editData.account_name}
                                onChange={(e) => setEditData({ ...editData, account_name: e.target.value })}
                                onBlur={() => handleEditSave(child.id)}
                                className="px-2 py-1 border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                onClick={() => handleEditStart(child)}
                              >
                                {child.account_name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-medium">{child.currency}</td>
                          <td className="px-6 py-4 text-right">
                            {editingId === child.id ? (
                              <input
                                type="number"
                                value={editData.amount}
                                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                onBlur={() => handleEditSave(child.id)}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-right"
                                step="0.01"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                                onClick={() => handleEditStart(child)}
                              >
                                {(savedAccounts[child.id] !== undefined ? savedAccounts[child.id] : child.amount).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatCurrency(child.eur_amount)}
                          </td>
                          <td className="px-6 py-4 text-center flex gap-1 justify-center">
                            {editingId === child.id ? (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEditSave(child.id)}
                                  disabled={saving}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDeleteAccount(child.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                )
              })}

              {/* Total Row */}
              {accounts.length > 0 && (
                <tr className="bg-blue-50 font-semibold hover:bg-blue-100">
                  <td className="px-6 py-4">Total</td>
                  <td colSpan="2"></td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(accounts.reduce((sum, acc) => sum + acc.eur_amount, 0))}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add account form */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        {showAddForm ? (
          <form onSubmit={handleAddAccount} className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Account Name / Bank</label>
              <input
                type="text"
                placeholder="e.g., HSBC HK"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
                <option value="HKD">HKD</option>
                <option value="JPY">JPY</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Amount</label>
              <input
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                step="0.01"
                required
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? 'Adding...' : 'Add Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              setFormData({ account_name: '', currency: 'EUR', amount: 0, parent_id: null })
              setShowAddForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Add Account
          </button>
        )}
      </div>
    </div>
  )
}
