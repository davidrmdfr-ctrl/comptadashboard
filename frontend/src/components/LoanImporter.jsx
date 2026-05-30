import React, { useState, useEffect } from 'react'

export default function LoanImporter({ onLoansImported }) {
  const [availableLoans, setAvailableLoans] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [importing, setImporting] = useState({})

  useEffect(() => {
    loadAvailableLoans()
  }, [])

  const loadAvailableLoans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/loans/import/available')
      const data = await response.json()
      setAvailableLoans(data.loans || [])
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to load available loans: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const handleImportSingle = async (propertyName) => {
    try {
      setImporting((prev) => ({ ...prev, [propertyName]: true }))

      const response = await fetch(`/api/loans/import/import-from-pdf/${propertyName}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to import loan')
      }

      const result = await response.json()
      setMessage({
        type: 'success',
        text: `✓ Imported: ${result.loan.name}`,
      })

      setTimeout(() => setMessage(null), 3000)
      onLoansImported?.()
      loadAvailableLoans()
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` })
    } finally {
      setImporting((prev) => ({ ...prev, [propertyName]: false }))
    }
  }

  const handleImportAll = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/loans/import/import-all', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to import loans')
      }

      const result = await response.json()
      setMessage({
        type: 'success',
        text: `✓ Imported ${result.imported_count} loans from PDFs`,
      })

      setTimeout(() => setMessage(null), 4000)
      onLoansImported?.()
      loadAvailableLoans()
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  if (availableLoans.length === 0 && !loading) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
        <h2 className="text-lg font-bold text-gray-900">📋 Import Loans from Schedules</h2>
        <p className="text-xs text-gray-600 mt-1">Load amortization schedules to create loan records</p>
      </div>

      {availableLoans.length > 0 && (
        <div className="px-6 py-4 space-y-3">
          {availableLoans.map((loan) => (
            <div
              key={loan.property_name}
              className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-blue-50 transition"
            >
              <div>
                <p className="font-medium text-gray-900">{loan.property_name}</p>
                <p className="text-xs text-gray-600">
                  {loan.original_amount?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  }) || 'Amount not detected'}{' '}
                  @ {loan.interest_rate}%
                </p>
              </div>
              <button
                onClick={() => handleImportSingle(loan.property_name)}
                disabled={importing[loan.property_name] || loading}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {importing[loan.property_name] ? 'Importing...' : 'Import'}
              </button>
            </div>
          ))}

          <button
            onClick={handleImportAll}
            disabled={loading}
            className="w-full px-4 py-3 mt-4 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 transition"
          >
            {loading ? '⟳ Importing All...' : '⟳ Import All Loans'}
          </button>
        </div>
      )}

      {message && (
        <div
          className={`px-6 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-t border-green-200'
              : 'bg-red-50 text-red-800 border-t border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
