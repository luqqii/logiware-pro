import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  getProfile: () => api.get('/auth/profile'),
};

// Warehouses
export const warehouseAPI = {
  list: () => api.get('/warehouses'),
  get: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.patch(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

// Inventory
export const inventoryAPI = {
  list: (params) => api.get('/inventory', { params }),
  get: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.patch(`/inventory/${id}`, data),
  updateQuantity: (id, data) => api.patch(`/inventory/${id}/quantity`, data),
  getLowStock: () => api.get('/inventory/low-stock'),
  getCycleCount: (warehouseId) => api.get(`/inventory/cycle-count/${warehouseId}`),
};

// Orders
export const orderAPI = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.patch(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  receive: (id) => api.patch(`/orders/${id}/receive`),
  pick: (id) => api.patch(`/orders/${id}/pick`),
  pack: (id) => api.patch(`/orders/${id}/pack`),
  ship: (id) => api.patch(`/orders/${id}/ship`),
};

// Shipments
export const shipmentAPI = {
  list: (params) => api.get('/shipments', { params }),
  get: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  update: (id, data) => api.patch(`/shipments/${id}`, data),
  track: (trackingNumber) => api.get(`/shipments/track/${trackingNumber}`),
};

// Routes
export const routeAPI = {
  list: (params) => api.get('/routes', { params }),
  get: (id) => api.get(`/routes/${id}`),
  optimize: (data) => api.post('/routes/optimize', data),
  update: (id, data) => api.patch(`/routes/${id}`, data),
  listVehicles: () => api.get('/routes/vehicles/list'),
  createVehicle: (data) => api.post('/routes/vehicles', data),
  updateVehicle: (id, data) => api.patch(`/routes/vehicles/${id}`, data),
};

// Forecast
export const forecastAPI = {
  list: () => api.get('/forecast'),
  getSummary: () => api.get('/forecast/summary'),
  listModels: () => api.get('/forecast/models'),
  train: (data) => api.post('/forecast/train', data),
};

// Automation
export const automationAPI = {
  list: () => api.get('/automation'),
  get: (id) => api.get(`/automation/${id}`),
  create: (data) => api.post('/automation', data),
  update: (id, data) => api.patch(`/automation/${id}`, data),
  delete: (id) => api.delete(`/automation/${id}`),
  execute: (id) => api.post(`/automation/${id}/execute`),
};

// Analytics & Misc
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getInventoryTrends: () => api.get('/analytics/inventory-trends'),
  getOrderMetrics: () => api.get('/analytics/order-metrics'),
  getWarehousePerformance: () => api.get('/analytics/warehouse-performance'),
  getAlerts: (params) => api.get('/analytics/alerts/list', { params }),
  markAlertRead: (id) => api.patch(`/analytics/alerts/${id}/read`),
  markAllAlertsRead: () => api.patch('/analytics/alerts/read-all'),
  createAlert: (data) => api.post('/analytics/alerts', data),
  getIntegrations: () => api.get('/analytics/integrations'),
  createIntegration: (data) => api.post('/analytics/integrations', data),
  updateIntegration: (id, data) => api.patch(`/analytics/integrations/${id}`, data),
  deleteIntegration: (id) => api.delete(`/analytics/integrations/${id}`),
};

export default api;
