import React, { useState, useEffect } from 'react'

export default function LoanDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documents/loan-documents')
      const data = await response.json()
      setDocuments(data.documents || [])
      setError(null)
    } catch (err) {
      setError(`Failed to load documents: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDocument = (doc) => {
    // Open PDF in new tab
    window.open(doc.path, '_blank')
  }

  const handleDownloadDocument = (doc) => {
    // Create a link and trigger download
    const link = document.createElement('a')
    link.href = doc.path
    link.download = doc.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Loading documents...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>
  }

  if (documents.length === 0) {
    return <div className="text-center text-gray-500 py-8">No amortization schedules found</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Loan Amortization Schedules</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.filename} className="px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📄</div>
                <div>
                  <p className="font-semibold text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.filename}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenDocument(doc)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  👁️ View
                </button>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                >
                  ⬇️ Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
