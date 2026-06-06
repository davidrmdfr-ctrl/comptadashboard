import React, { useMemo } from 'react'

export default function FxExposure({ accounts, investments, previousSnapshot }) {
  const exposure = useMemo(() => {
    const byCurrency = {}

    // Aggregate accounts by currency
    accounts.forEach((account) => {
      if (!byCurrency[account.currency]) {
        byCurrency[account.currency] = { eur: 0, exchange_rate: account.exchange_rate || 1.0, quantity: 0 }
      }
      byCurrency[account.currency].eur += account.eur_amount
      byCurrency[account.currency].exchange_rate = account.exchange_rate || 1.0
    })

    // Aggregate investments by currency (only holdings, not brokers)
    investments
      .filter(inv => !inv.is_broker)
      .forEach((inv) => {
        if (!byCurrency[inv.currency]) {
          byCurrency[inv.currency] = { eur: 0, exchange_rate: inv.exchange_rate || 1.0, quantity: 0 }
        }
        byCurrency[inv.currency].eur += inv.eur_current_amount || 0
        byCurrency[inv.currency].exchange_rate = inv.exchange_rate || 1.0
      })

    return byCurrency
  }, [accounts, investments])

  const totalEur = Object.values(exposure).reduce((sum, exp) => sum + exp.eur, 0)

  const previousExposure = previousSnapshot
    ? JSON.parse(previousSnapshot.cash_breakdown || '{}').currency_totals_eur || {}
    : {}

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">FX Exposure</h2>
      </div>

      {Object.keys(exposure).length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">No FX exposure yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Currency</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Exchange Rate</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">EUR Exposure</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">% of Portfolio</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">vs Last Month EUR</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">vs Last Month %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(exposure)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([currency, exp]) => {
                  const percentage = totalEur > 0 ? (exp.eur / totalEur) * 100 : 0
                  const prevAmount = previousExposure[currency] || 0
                  const deltaEur = exp.eur - prevAmount
                  const deltaPercent = prevAmount > 0 ? ((exp.eur - prevAmount) / prevAmount) * 100 : 0

                  return (
                    <tr key={currency} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{currency}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{exp.exchange_rate.toFixed(6)}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(exp.eur)}</td>
                      <td className="px-6 py-4 text-right text-gray-700">{percentage.toFixed(1)}%</td>
                      <td className={`px-6 py-4 text-right font-medium ${deltaEur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {deltaEur >= 0 ? '+' : ''}{formatCurrency(deltaEur)}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${deltaPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
