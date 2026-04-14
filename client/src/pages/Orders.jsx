import { useState, useEffect } from 'react';
import { orderAPI, inventoryAPI, warehouseAPI } from '../services/api';
import { Plus, Search, Filter, Eye, Package, Clock, CheckCircle, Truck } from 'lucide-react';

const statusColors = {
  pending: 'badge-warning',
  picked: 'badge-info',
  packed: 'badge-info',
  shipped: 'badge-success',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

const priorityColors = {
  high: 'badge-danger',
  normal: 'badge-info',
  low: 'badge-success',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '', customer_name: '', customer_email: '', shipping_address: '',
    priority: 'normal', total_amount: '', notes: '', warehouse_id: '', items: [],
  });
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    loadOrders();
    loadWarehouses();
    loadInventory();
  }, [statusFilter, priorityFilter]);

  const loadOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await orderAPI.list(params);
      setOrders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadWarehouses = async () => {
    try { const res = await warehouseAPI.list(); setWarehouses(res.data); } catch (err) {}
  };

  const loadInventory = async () => {
    try { const res = await inventoryAPI.list(); setInventoryItems(res.data); } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await orderAPI.create(formData);
      setShowModal(false);
      setFormData({ customer_id: '', customer_name: '', customer_email: '', shipping_address: '', priority: 'normal', total_amount: '', notes: '', warehouse_id: '', items: [] });
      loadOrders();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      const endpoints = { receive: 'receive', pick: 'pick', pack: 'pack', ship: 'ship' };
      await orderAPI[status](id);
      loadOrders();
    } catch (err) { console.error(err); }
  };

  const filtered = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.order_id?.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    picked: orders.filter(o => o.status === 'picked').length,
    packed: orders.filter(o => o.status === 'packed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Order Management</h1>
          <p className="text-text-muted mt-1">Create, track, and manage customer orders</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Order
        </button>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { key: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-50 border-yellow-200' },
          { key: 'picked', label: 'Picked', icon: Package, color: 'bg-blue-50 border-blue-200' },
          { key: 'packed', label: 'Packed', icon: Package, color: 'bg-blue-50 border-blue-200' },
          { key: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-green-50 border-green-200' },
          { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-50 border-green-200' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
            className={`p-4 rounded-card border ${s.color} ${statusFilter === s.key ? 'ring-2 ring-accent' : ''} transition-all text-left`}
          >
            <div className="flex items-center justify-between">
              <s.icon size={20} className={s.key === 'pending' ? 'text-yellow-600' : s.key === 'delivered' ? 'text-green-600' : 'text-blue-600'} />
              <span className="text-2xl font-bold">{statusCounts[s.key] || 0}</span>
            </div>
            <p className="text-sm font-medium mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="form-input pl-10" />
          </div>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Warehouse</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-text-muted">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-text-muted">No orders found</td></tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.order_id}>
                    <td className="font-mono text-sm">#{order.order_id?.slice(0, 8)}</td>
                    <td>
                      <p className="font-medium text-navy">{order.customer_name || 'N/A'}</p>
                      <p className="text-xs text-text-light">{order.customer_email}</p>
                    </td>
                    <td className="text-sm">{order.warehouse_name || '-'}</td>
                    <td><span className={`badge ${statusColors[order.status]}`}>{order.status}</span></td>
                    <td><span className={`badge ${priorityColors[order.priority]}`}>{order.priority}</span></td>
                    <td className="font-semibold">${Number(order.total_amount || 0).toFixed(2)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {order.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(order.order_id, 'pick')} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Pick</button>
                            <button onClick={() => updateStatus(order.order_id, 'receive')} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">Receive</button>
                          </>
                        )}
                        {order.status === 'picked' && (
                          <button onClick={() => updateStatus(order.order_id, 'pack')} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Pack</button>
                        )}
                        {order.status === 'packed' && (
                          <button onClick={() => updateStatus(order.order_id, 'ship')} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">Ship</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Create New Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name *</label>
                  <input type="text" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="form-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Email</label>
                  <input type="email" value={formData.customer_email} onChange={e => setFormData({...formData, customer_email: e.target.value})} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shipping Address *</label>
                <textarea value={formData.shipping_address} onChange={e => setFormData({...formData, shipping_address: e.target.value})} className="form-input" rows="2" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Warehouse</label>
                  <select value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="form-input">
                    <option value="">Select...</option>
                    {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="form-input">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount</label>
                  <input type="number" step="0.01" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="form-input" rows="2" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
