import React, { useState } from 'react'
import { marketAPI } from '../api'

export default function RefreshBar({ accounts, onRefreshComplete }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleRefreshRates = async () => {
    try {
      setLoading(true)
      const currencies = accounts.map((a) => a.currency)
      const response = await marketAPI.refreshExchangeRates(currencies, 'EUR')

      setMessage({
        type: 'success',
        text: `Updated ${response.data.rates_updated} accounts with live exchange rates`,
      })

      setTimeout(() => setMessage(null), 3000)
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

  const handleRefreshPrices = async () => {
    try {
      setLoading(true)
      // For now, just refresh some common stocks
      const symbols = ['AAPL', 'MSFT', 'GOOGL']
      const response = await marketAPI.refreshPrices(symbols, 'stock')

      setMessage({
        type: 'success',
        text: `Fetched ${response.data.prices_fetched} prices`,
      })

      setTimeout(() => setMessage(null), 3000)
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
      <div className="flex gap-3">
        <button
          onClick={handleRefreshRates}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Updating...' : 'Refresh Exchange Rates'}
        </button>
        <button
          onClick={handleRefreshPrices}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Updating...' : 'Refresh Prices'}
        </button>
      </div>

      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm ${
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
