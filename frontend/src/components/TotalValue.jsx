import React from 'react'

export default function TotalValue({ accounts, investments, properties }) {
  // Calculate total in EUR
  const accountsTotal = accounts.reduce((sum, acc) => sum + acc.eur_amount, 0)
  const investmentsTotal = investments.reduce((sum, inv) => sum + inv.eur_amount, 0)
  const propertiesTotal = properties.reduce((sum, prop) => {
    const equity = prop.latest_equity?.net_equity || 0
    return sum + equity
  }, 0)

  const total = accountsTotal + investmentsTotal + propertiesTotal

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
      <h2 className="text-lg font-semibold opacity-90 mb-2">Total Portfolio Value</h2>
      <div className="text-5xl font-bold mb-6">{formatCurrency(total)}</div>

      <div className="grid grid-cols-3 gap-4 text-sm">
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
    </div>
  )
}
