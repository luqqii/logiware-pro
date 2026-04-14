import { useState, useEffect } from 'react';
import { warehouseAPI } from '../services/api';
import { Plus, MapPin, Edit2, Trash2, Warehouse as WarehouseIcon, Box } from 'lucide-react';

export default function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', capacity: '' });

  useEffect(() => { loadWarehouses(); }, []);

  const loadWarehouses = async () => {
    try {
      const res = await warehouseAPI.list();
      setWarehouses(res.data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await warehouseAPI.create(formData);
      setShowModal(false);
      setFormData({ name: '', location: '', capacity: '' });
      loadWarehouses();
    } catch (err) {
      console.error('Failed to create warehouse:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      await warehouseAPI.delete(id);
      loadWarehouses();
    } catch (err) {
      console.error('Failed to delete warehouse:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Warehouse Management</h1>
          <p className="text-text-muted mt-1">Manage your warehouse locations and capacity</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Warehouse
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="kpi-card">
          <p className="kpi-value">{warehouses.length}</p>
          <p className="kpi-label">Total Warehouses</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{warehouses.filter(w => w.status === 'active').length}</p>
          <p className="kpi-label">Active</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0).toLocaleString()}</p>
          <p className="kpi-label">Total Capacity</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{warehouses.reduce((sum, w) => sum + (w.used_capacity || 0), 0).toLocaleString()}</p>
          <p className="kpi-label">Used Capacity</p>
        </div>
      </div>

      {/* Warehouse Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => (
            <div key={wh.warehouse_id} className="card hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <WarehouseIcon size={24} className="text-accent" />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-surface-light-gray rounded-lg">
                    <Edit2 size={16} className="text-text-muted" />
                  </button>
                  <button onClick={() => handleDelete(wh.warehouse_id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-navy mb-2">{wh.name}</h3>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                <MapPin size={14} />
                <span className="truncate">{wh.location || 'No location set'}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                <span className="text-xs text-text-muted">Capacity</span>
                <span className="text-sm font-semibold text-navy">{wh.capacity?.toLocaleString() || 0} units</span>
              </div>
              <div className="w-full bg-surface-light-gray rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.min(100, ((wh.used_capacity || 0) / (wh.capacity || 1)) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-text-light mt-1">{wh.used_capacity?.toLocaleString() || 0} used</p>
              <span className={`badge mt-3 ${wh.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {wh.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Add New Warehouse</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Main Warehouse"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-input"
                  placeholder="123 Logistics Blvd, Dallas TX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Capacity (units)</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="form-input"
                  placeholder="10000"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
