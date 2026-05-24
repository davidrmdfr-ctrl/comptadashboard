import React, { useState, useEffect } from 'react'
import { accountsAPI, investmentsAPI, propertiesAPI } from './api'
import RefreshBar from './components/RefreshBar'
import TotalValue from './components/TotalValue'
import AccountsTable from './components/AccountsTable'
import InvestmentsTable from './components/InvestmentsTable'
import PropertiesTable from './components/PropertiesTable'

export default function App() {
  const [accounts, setAccounts] = useState([])
  const [investments, setInvestments] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [accountsRes, investmentsRes, propertiesRes] = await Promise.all([
        accountsAPI.list(),
        investmentsAPI.list(),
        propertiesAPI.list(),
      ])

      setAccounts(accountsRes.data)
      setInvestments(investmentsRes.data)
      setProperties(propertiesRes.data)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefreshComplete = () => {
    loadData() // Reload all data after refresh
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold mb-2">Error Loading Data</h2>
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-600 mt-2">Make sure the backend is running on http://localhost:8000</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Personal Finance Dashboard</h1>
            <RefreshBar accounts={accounts} onRefreshComplete={handleRefreshComplete} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Total Value Card */}
        <TotalValue accounts={accounts} investments={investments} properties={properties} />

        {/* Cash Accounts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Cash Accounts</h2>
          </div>
          <AccountsTable accounts={accounts} onUpdate={loadData} />
        </div>

        {/* Investments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Investments</h2>
          </div>
          <InvestmentsTable investments={investments} onUpdate={loadData} />
        </div>

        {/* Properties */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Properties</h2>
          </div>
          <PropertiesTable properties={properties} />
        </div>
      </div>
    </div>
  )
}
