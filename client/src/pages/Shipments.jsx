import { useState, useEffect } from 'react';
import { shipmentAPI } from '../services/api';
import { Plus, Search, Truck, Package, MapPin, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const carrierColors = {
  fedex: 'bg-purple-100 text-purple-700',
  ups: 'bg-amber-100 text-amber-700',
  usps: 'bg-blue-100 text-blue-700',
  dhl: 'bg-yellow-100 text-yellow-700',
};

const statusConfig = {
  pending: { color: 'badge-warning', icon: Clock },
  in_transit: { color: 'badge-info', icon: Truck },
  out_for_delivery: { color: 'badge-info', icon: Truck },
  delivered: { color: 'badge-success', icon: CheckCircle },
  returned: { color: 'badge-danger', icon: AlertTriangle },
};

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '', carrier: '', tracking_number: '', origin_address: '',
    destination_address: '', eta: '', weight: '', shipping_cost: '',
  });

  useEffect(() => { loadShipments(); }, [statusFilter, carrierFilter]);

  const loadShipments = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (carrierFilter) params.carrier = carrierFilter;
      const res = await shipmentAPI.list(params);
      setShipments(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await shipmentAPI.create(formData);
      setShowModal(false);
      setFormData({ order_id: '', carrier: '', tracking_number: '', origin_address: '', destination_address: '', eta: '', weight: '', shipping_cost: '' });
      loadShipments();
    } catch (err) { console.error(err); }
  };

  const filtered = shipments.filter(s =>
    s.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.carrier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Shipment Tracking</h1>
          <p className="text-text-muted mt-1">Track and manage all shipments across carriers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Shipment
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking number or carrier..." className="form-input pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
          <select value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)} className="form-input w-auto">
            <option value="">All Carriers</option>
            <option value="fedex">FedEx</option>
            <option value="ups">UPS</option>
            <option value="usps">USPS</option>
            <option value="dhl">DHL</option>
          </select>
        </div>
      </div>

      {/* Shipments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse h-40"></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Truck size={48} className="mx-auto text-text-light mb-4" />
          <h3 className="text-lg font-semibold text-navy mb-2">No shipments found</h3>
          <p className="text-text-muted">Create a new shipment to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(shipment => {
            const cfg = statusConfig[shipment.status] || { color: 'badge-info', icon: Truck };
            return (
              <div key={shipment.shipment_id} className="card hover:shadow-card-hover transition-all">
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge ${carrierColors[shipment.carrier?.toLowerCase()] || 'bg-gray-100'}`}>
                    {shipment.carrier || 'Unknown'}
                  </span>
                  <span className={`badge ${cfg.color}`}>{shipment.status?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-text-muted" />
                  <span className="text-sm font-mono text-navy">{shipment.tracking_number || 'No tracking #'}</span>
                </div>
                {shipment.destination_address && (
                  <p className="text-xs text-text-muted mb-3 truncate">{shipment.destination_address}</p>
                )}
                {shipment.eta && (
                  <div className="flex items-center gap-2 text-xs text-text-light">
                    <Calendar size={14} />
                    <span>ETA: {new Date(shipment.eta).toLocaleDateString()}</span>
                  </div>
                )}
                {shipment.shipping_cost && (
                  <div className="mt-3 pt-3 border-t border-surface-border">
                    <span className="text-sm font-semibold text-navy">${Number(shipment.shipping_cost).toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Shipment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Create Shipment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Order ID *</label>
                  <input type="text" value={formData.order_id} onChange={e => setFormData({...formData, order_id: e.target.value})} className="form-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Carrier *</label>
                  <select value={formData.carrier} onChange={e => setFormData({...formData, carrier: e.target.value})} className="form-input" required>
                    <option value="">Select...</option>
                    <option value="fedex">FedEx</option>
                    <option value="ups">UPS</option>
                    <option value="usps">USPS</option>
                    <option value="dhl">DHL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tracking Number</label>
                <input type="text" value={formData.tracking_number} onChange={e => setFormData({...formData, tracking_number: e.target.value})} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Destination Address *</label>
                <textarea value={formData.destination_address} onChange={e => setFormData({...formData, destination_address: e.target.value})} className="form-input" rows="2" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ETA</label>
                  <input type="datetime-local" value={formData.eta} onChange={e => setFormData({...formData, eta: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (lbs)</label>
                  <input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost ($)</label>
                  <input type="number" step="0.01" value={formData.shipping_cost} onChange={e => setFormData({...formData, shipping_cost: e.target.value})} className="form-input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
