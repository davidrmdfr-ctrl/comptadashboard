import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const accountsAPI = {
  list: () => api.get('/accounts/'),
  get: (id) => api.get(`/accounts/${id}`),
  update: (id, data) => api.patch(`/accounts/${id}`, data),
}

export const investmentsAPI = {
  list: () => api.get('/investments/'),
  get: (id) => api.get(`/investments/${id}`),
  create: (data) => api.post('/investments/', data),
  delete: (id) => api.delete(`/investments/${id}`),
}

export const propertiesAPI = {
  list: () => api.get('/properties/'),
  get: (id) => api.get(`/properties/${id}`),
}

export const marketAPI = {
  refreshExchangeRates: (currencies, targetCurrency = 'EUR') =>
    api.post('/market/refresh-exchange-rates', {
      currencies,
      target_currency: targetCurrency,
    }),
  refreshPrices: (symbols, refreshType = 'stock') =>
    api.post('/market/refresh-prices', {
      symbols,
      refresh_type: refreshType,
    }),
  getLatestPrice: (symbol) => api.get(`/market/latest-price/${symbol}`),
}

export default api
