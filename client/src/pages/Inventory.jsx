import { useState, useEffect } from 'react';
import { inventoryAPI, warehouseAPI } from '../services/api';
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    warehouse_id: '', sku: '', name: '', description: '', quantity: '',
    unit_price: '', reorder_point: '', category: '',
  });

  useEffect(() => {
    loadInventory();
    loadWarehouses();
  }, [category, warehouseFilter]);

  const loadInventory = async () => {
    try {
      const params = {};
      if (category) params.category = category;
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      const res = await inventoryAPI.list(params);
      setItems(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseAPI.list();
      setWarehouses(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryAPI.create(formData);
      setShowModal(false);
      setFormData({ warehouse_id: '', sku: '', name: '', description: '', quantity: '', unit_price: '', reorder_point: '', category: '' });
      loadInventory();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await inventoryAPI.update(id, { status: 'discontinued' }); loadInventory(); }
    catch (err) { console.error(err); }
  };

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Inventory Management</h1>
          <p className="text-text-muted mt-1">Track and manage your warehouse inventory</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="form-input pl-10"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input w-auto">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-value">{items.length}</p>
          <p className="kpi-label">Total SKUs</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{items.reduce((s, i) => s + i.quantity, 0).toLocaleString()}</p>
          <p className="kpi-label">Total Units</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value text-severity-critical">{items.filter(i => i.status === 'low_stock').length}</p>
          <p className="kpi-label">Low Stock</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">${items.reduce((s, i) => s + (i.quantity * i.unit_price || 0), 0).toLocaleString()}</p>
          <p className="kpi-label">Total Value</p>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8"><div className="animate-pulse text-text-muted">Loading...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-text-muted">No items found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.item_id}>
                    <td className="font-mono text-sm">{item.sku}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-surface-light-gray rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-text-muted" />
                        </div>
                        <div>
                          <p className="font-medium text-navy">{item.name}</p>
                          <p className="text-xs text-text-light truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge bg-surface-light-gray">{item.category || '-'}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${item.quantity <= item.reorder_point ? 'text-severity-critical' : 'text-navy'}`}>
                          {item.quantity.toLocaleString()}
                        </span>
                        {item.reorder_point > 0 && (
                          <span className="text-xs text-text-light">/ {item.reorder_point}</span>
                        )}
                      </div>
                    </td>
                    <td>${Number(item.unit_price || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${item.status === 'in_stock' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status === 'in_stock' ? 'In Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-surface-light-gray rounded-lg">
                          <Edit2 size={14} className="text-text-muted" />
                        </button>
                        <button onClick={() => handleDelete(item.item_id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Add Inventory Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse *</label>
                <select value={formData.warehouse_id} onChange={e => setFormData({...formData, warehouse_id: e.target.value})} className="form-input" required>
                  <option value="">Select warehouse...</option>
                  {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="form-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Item Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input" rows="2" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Price</label>
                  <input type="number" step="0.01" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reorder Point</label>
                  <input type="number" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: e.target.value})} className="form-input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
