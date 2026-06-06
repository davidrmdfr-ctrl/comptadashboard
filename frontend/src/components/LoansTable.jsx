import React, { useState, useRef, useEffect } from 'react'
import { loansAPI } from '../api'

export default function LoansTable({ loans, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editField, setEditField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const inputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    loan_type: 'mortgage',
    original_amount: 0,
    original_currency: 'EUR',
    principal_left: 0,
    next_payment_amount: 0,
    next_payment_date: new Date().toISOString().split('T')[0],
    interest_rate: 0,
    payment_frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  })

  // Auto-select input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.select()
    }
  }, [editingId])

  const handleEditStart = (loan, field) => {
    setEditingId(loan.id)
    setEditField(field)
    setEditValue(loan[field]?.toString() || '')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditField(null)
    setEditValue('')
  }

  const handleEditSave = async () => {
    if (!editingId || !editField) return

    try {
      setSaving(true)
      await loansAPI.update(editingId, { [editField]: parseFloat(editValue) || editValue })
      setEditingId(null)
      setEditField(null)
      setEditValue('')
      onUpdate()
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

  const handleDeleteLoan = async (id) => {
    if (window.confirm('Delete this loan?')) {
      try {
        await loansAPI.delete(id)
        onUpdate()
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }
  }

  const handleAddLoan = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await loansAPI.create({
        ...formData,
        original_amount: parseFloat(formData.original_amount),
        principal_left: parseFloat(formData.principal_left),
        next_payment_amount: parseFloat(formData.next_payment_amount),
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        end_date: formData.end_date || null,
      })
      setFormData({
        name: '',
        loan_type: 'mortgage',
        original_amount: 0,
        original_currency: 'EUR',
        principal_left: 0,
        next_payment_amount: 0,
        next_payment_date: new Date().toISOString().split('T')[0],
        interest_rate: 0,
        payment_frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
      })
      setShowAddForm(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  if (loans.length === 0 && !showAddForm) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-gray-500 mb-4">No loans tracked</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Loan
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        {loans.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Loan Name</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Progress</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  Principal Left
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Next Payment</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Next Date</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loans.map((loan) => {
                const principalRepaid = loan.original_amount - loan.principal_left
                const repaidPercent = (principalRepaid / loan.original_amount) * 100
                return (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{loan.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${repaidPercent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 min-w-12">{repaidPercent.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === loan.id && editField === 'principal_left' ? (
                      <div className="flex gap-1">
                        <input
                          ref={inputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
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
                      </div>
                    ) : (
                      <span className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                        onClick={() => handleEditStart(loan, 'principal_left')}>
                        {formatCurrency(loan.principal_left)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === loan.id && editField === 'next_payment_amount' ? (
                      <div className="flex gap-1">
                        <input
                          ref={inputRef}
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
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
                      </div>
                    ) : (
                      <span className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                        onClick={() => handleEditStart(loan, 'next_payment_amount')}>
                        {formatCurrency(loan.next_payment_amount)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === loan.id && editField === 'next_payment_date' ? (
                      <div className="flex gap-1">
                        <input
                          ref={inputRef}
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={handleEditSave}
                          disabled={saving}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-700 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded"
                        onClick={() => handleEditStart(loan, 'next_payment_date')}>
                        {formatDate(loan.next_payment_date)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteLoan(loan.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              )
              })}

              {/* Total Progress Row */}
              {loans.length > 0 && (
                <tr className="bg-blue-50 font-semibold hover:bg-blue-100">
                  <td className="px-6 py-4">Total Progress</td>
                  <td className="px-6 py-4">
                    {(() => {
                      const totalOriginal = loans.reduce((sum, l) => sum + l.original_amount, 0)
                      const totalRepaid = loans.reduce((sum, l) => sum + (l.original_amount - l.principal_left), 0)
                      const totalPercent = (totalRepaid / totalOriginal) * 100
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-300 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full transition-all"
                              style={{ width: `${totalPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-blue-900 min-w-12">{totalPercent.toFixed(0)}%</span>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(loans.reduce((sum, loan) => sum + loan.principal_left, 0))}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add loan form */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        {showAddForm ? (
          <form onSubmit={handleAddLoan} className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Loan Name</label>
              <input
                type="text"
                placeholder="e.g., Roses Mortgage"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="mortgage">Mortgage</option>
                <option value="personal">Personal</option>
                <option value="car">Car</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Original Amount</label>
              <input
                type="number"
                placeholder="0"
                value={formData.original_amount}
                onChange={(e) => setFormData({ ...formData, original_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Principal Left</label>
              <input
                type="number"
                placeholder="0"
                value={formData.principal_left}
                onChange={(e) => setFormData({ ...formData, principal_left: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Next Payment Amount</label>
              <input
                type="number"
                placeholder="0"
                value={formData.next_payment_amount}
                onChange={(e) => setFormData({ ...formData, next_payment_amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Next Payment Date</label>
              <input
                type="date"
                value={formData.next_payment_date}
                onChange={(e) => setFormData({ ...formData, next_payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                placeholder="0"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Notes</label>
              <textarea
                placeholder="Any notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                rows="2"
              />
            </div>
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? 'Adding...' : 'Add Loan'}
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
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Add Loan
          </button>
        )}
      </div>
    </div>
  )
}
