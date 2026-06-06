import React, { useState, useRef, useEffect } from 'react'
import { propertiesAPI } from '../api'

export default function PropertiesTable({ properties, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [editField, setEditField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const inputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    property_type: 'residential',
    purchase_price: 0,
    current_value: 0,
    rental_income: 0,
    coupon_rate: 0,
  })

  // Auto-select input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.select()
    }
  }, [editingId])

  const handleEditStart = (prop, field) => {
    setEditingId(prop.id)
    setEditField(field)
    setEditValue(prop[field]?.toString() || '')
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
      const updateData = { [editField]: parseFloat(editValue) || editValue }
      const response = await propertiesAPI.update(editingId, updateData)
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

  const handleAddProperty = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await propertiesAPI.create({
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        current_value: parseFloat(formData.current_value),
        rental_income: parseFloat(formData.rental_income),
        coupon_rate: parseFloat(formData.coupon_rate),
      })
      setFormData({
        name: '',
        location: '',
        property_type: 'residential',
        purchase_price: 0,
        current_value: 0,
        rental_income: 0,
        coupon_rate: 0,
      })
      setShowAddForm(false)
      onUpdate()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Delete this property?')) {
      try {
        await propertiesAPI.delete(id)
        onUpdate()
      } catch (err) {
        alert(`Error: ${err.message}`)
      }
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value) => {
    return `${parseFloat(value).toFixed(2)}%`
  }

  if (properties.length === 0 && !showAddForm) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-gray-500 mb-4">No properties yet</p>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Property
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        {properties.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Purchase</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Current Value</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Rental Income</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Yield</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700 w-20">Actions</th>
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
                  <td className="px-6 py-4 text-right">
                    {editingId === prop.id && editField === 'purchase_price' ? (
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
                      <span
                        className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                        onClick={() => handleEditStart(prop, 'purchase_price')}
                      >
                        {formatCurrency(prop.purchase_price)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {editingId === prop.id && editField === 'current_value' ? (
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
                      <span
                        className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                        onClick={() => handleEditStart(prop, 'current_value')}
                      >
                        {formatCurrency(prop.current_value)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === prop.id && editField === 'rental_income' ? (
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
                      <span
                        className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                        onClick={() => handleEditStart(prop, 'rental_income')}
                      >
                        {formatCurrency(prop.rental_income)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === prop.id && editField === 'coupon_rate' ? (
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
                      <span
                        className="cursor-pointer hover:bg-blue-100 px-2 py-1 rounded inline-block"
                        onClick={() => handleEditStart(prop, 'coupon_rate')}
                      >
                        {formatPercent(prop.coupon_rate)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteProperty(prop.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              {properties.length > 0 && (
                <tr className="bg-blue-50 font-semibold hover:bg-blue-100">
                  <td colSpan="2" className="px-6 py-4">Total</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(properties.reduce((sum, prop) => sum + prop.purchase_price, 0))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(properties.reduce((sum, prop) => sum + prop.current_value, 0))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(properties.reduce((sum, prop) => sum + prop.rental_income, 0))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {(properties.reduce((sum, prop) => sum + prop.coupon_rate, 0) / properties.length).toFixed(2)}%
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Property Button */}
      {properties.length > 0 && !showAddForm && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Property
          </button>
        </div>
      )}

      {/* Add Property Form */}
      {showAddForm && (
        <form onSubmit={handleAddProperty} className="mt-6 p-6 border border-gray-200 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4">Add Property</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Property name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded col-span-2"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            />
            <select
              value={formData.property_type}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed</option>
            </select>
            <input
              type="number"
              placeholder="Purchase price"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Current value"
              value={formData.current_value}
              onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
              required
            />
            <input
              type="number"
              placeholder="Rental income"
              value={formData.rental_income}
              onChange={(e) => setFormData({ ...formData, rental_income: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Coupon rate (%)"
              value={formData.coupon_rate}
              onChange={(e) => setFormData({ ...formData, coupon_rate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
              step="0.01"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Property'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData({
                  name: '',
                  location: '',
                  property_type: 'residential',
                  purchase_price: 0,
                  current_value: 0,
                  rental_income: 0,
                  coupon_rate: 0,
                })
              }}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
