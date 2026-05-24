import React from 'react'

export default function PropertiesTable({ properties }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (properties.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500">No properties yet</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Value</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700">Net Equity</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700">Real Net Equity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {properties.map((prop) => (
            <tr key={prop.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{prop.name}</p>
                  {prop.location && (
                    <p className="text-xs text-gray-500">{prop.location}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600 capitalize">{prop.property_type}</td>
              <td className="px-6 py-4 text-right font-medium">
                {formatCurrency(prop.current_value)}
              </td>
              <td className="px-6 py-4 text-right font-medium">
                {prop.latest_equity
                  ? formatCurrency(prop.latest_equity.net_equity)
                  : '-'}
              </td>
              <td className="px-6 py-4 text-right font-medium">
                {prop.latest_equity
                  ? formatCurrency(prop.latest_equity.real_net_equity)
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
