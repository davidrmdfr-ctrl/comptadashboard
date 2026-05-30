import React, { useState } from 'react'
import { marketAPI, loansAPI } from '../api'

export default function RefreshBar({ accounts, onRefreshComplete }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleRefreshAll = async () => {
    try {
      setLoading(true)
      const results = {
        ratesUpdated: 0,
        pricesFetched: 0,
        loansChecked: 0,
      }

      // Refresh FX rates
      try {
        const currencies = accounts.map((a) => a.currency)
        const ratesRes = await marketAPI.refreshExchangeRates(currencies, 'EUR')
        results.ratesUpdated = ratesRes.data?.rates_updated || 0
      } catch (err) {
        console.error('FX refresh error:', err)
      }

      // Refresh investment prices
      try {
        const symbols = ['AAPL', 'MSFT', 'GOOGL']
        const pricesRes = await marketAPI.refreshPrices(symbols, 'stock')
        results.pricesFetched = pricesRes.data?.prices_fetched || 0
      } catch (err) {
        console.error('Price refresh error:', err)
      }

      // Check for new loans
      try {
        const loansRes = await loansAPI.list()
        results.loansChecked = loansRes.data?.length || 0
      } catch (err) {
        console.error('Loans check error:', err)
      }

      const updates = []
      if (results.ratesUpdated > 0) updates.push(`${results.ratesUpdated} FX rates`)
      if (results.pricesFetched > 0) updates.push(`${results.pricesFetched} prices`)
      if (results.loansChecked > 0) updates.push(`${results.loansChecked} loans`)

      setMessage({
        type: 'success',
        text: updates.length > 0
          ? `✓ Updated: ${updates.join(', ')}`
          : '✓ Data is up to date',
      })

      setTimeout(() => setMessage(null), 4000)
      onRefreshComplete()
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Error: ${err.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleRefreshAll}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
      >
        {loading ? '⟳ Refreshing...' : '⟳ Refresh All'}
      </button>

      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm inline-block ml-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
