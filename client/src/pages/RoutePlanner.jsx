import { useState, useEffect } from 'react';
import { routeAPI } from '../services/api';
import { Plus, MapPin, Truck, Route, Play, Edit2, Trash2 } from 'lucide-react';

export default function RoutePlanner() {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [formData, setFormData] = useState({ stops: '', vehicle_id: '', start_location: '' });
  const [vehicleForm, setVehicleForm] = useState({ name: '', type: '', capacity: '', license_plate: '' });

  useEffect(() => {
    loadRoutes();
    loadVehicles();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await routeAPI.list();
      setRoutes(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadVehicles = async () => {
    try { const res = await routeAPI.listVehicles(); setVehicles(res.data); } catch (err) {}
  };

  const handleOptimize = async (e) => {
    e.preventDefault();
    try {
      const stopsArr = formData.stops.split('\n').filter(Boolean).map((line, i) => {
        const [lat, lon, label] = line.split(',').map(s => s.trim());
        return { lat: parseFloat(lat), lon: parseFloat(lon), label: label || `Stop ${i + 1}` };
      });
      const data = {
        stops: stopsArr,
        vehicle_id: formData.vehicle_id,
        start_location: formData.start_location ? { label: 'Depot' } : undefined,
      };
      await routeAPI.optimize(data);
      setShowModal(false);
      setFormData({ stops: '', vehicle_id: '', start_location: '' });
      loadRoutes();
    } catch (err) { console.error(err); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await routeAPI.createVehicle(vehicleForm);
      setShowVehicleModal(false);
      setVehicleForm({ name: '', type: '', capacity: '', license_plate: '' });
      loadVehicles();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Route Planner</h1>
          <p className="text-text-muted mt-1">Optimize delivery routes and assign vehicles</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowVehicleModal(true)} className="btn-outline flex items-center gap-2">
            <Truck size={18} /> Add Vehicle
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Optimize Route
          </button>
        </div>
      </div>

      {/* Vehicle Fleet */}
      <div className="card mb-6">
        <h3 className="font-bold text-navy mb-4">Vehicle Fleet ({vehicles.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {vehicles.map(v => (
            <div key={v.vehicle_id} className="p-3 bg-surface-light-gray rounded-lg text-center">
              <Truck size={24} className="mx-auto text-accent mb-2" />
              <p className="text-sm font-medium text-navy truncate">{v.name}</p>
              <p className="text-xs text-text-light">{v.type || 'N/A'}</p>
              <span className={`badge mt-1 ${v.status === 'available' ? 'badge-success' : 'badge-warning'}`}>{v.status}</span>
            </div>
          ))}
          {vehicles.length === 0 && <p className="text-sm text-text-muted col-span-full">No vehicles added yet</p>}
        </div>
      </div>

      {/* Routes List */}
      <div className="card">
        <h3 className="font-bold text-navy mb-4">Delivery Routes</h3>
        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading routes...</div>
        ) : routes.length === 0 ? (
          <div className="text-center py-8">
            <Route size={48} className="mx-auto text-text-light mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No routes yet</h3>
            <p className="text-text-muted mb-4">Create your first optimized route</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">Create Route</button>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map(route => (
              <div key={route.route_id} className="p-4 border border-surface-border rounded-card hover:bg-surface-light-gray transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Route size={20} className="text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-navy">Route #{route.route_id?.slice(0, 8)}</p>
                      <p className="text-xs text-text-muted">{new Date(route.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${route.status === 'planned' ? 'badge-info' : route.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {route.status}
                    </span>
                    {route.route_optimized && <span className="badge badge-success">AI Optimized</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-text-light">Stops:</span>
                    <span className="ml-2 font-semibold text-navy">{route.stops?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-text-light">Distance:</span>
                    <span className="ml-2 font-semibold text-navy">{route.total_distance?.toFixed(1) || 0} km</span>
                  </div>
                  <div>
                    <span className="text-text-light">Est. Duration:</span>
                    <span className="ml-2 font-semibold text-navy">{route.estimated_duration || 0} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optimize Route Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Optimize Delivery Route</h3>
            <form onSubmit={handleOptimize} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stops (one per line: lat, lon, label)</label>
                <textarea
                  value={formData.stops}
                  onChange={e => setFormData({...formData, stops: e.target.value})}
                  className="form-input"
                  rows="4"
                  placeholder="32.7767, -96.7970, Warehouse A&#10;32.7831, -96.8067, Customer B&#10;32.7555, -96.7989, Customer C"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle</label>
                <select value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})} className="form-input">
                  <option value="">Select vehicle...</option>
                  {vehicles.filter(v => v.status === 'available').map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2 flex-1">
                  <Play size={16} /> Optimize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowVehicleModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Add Vehicle</h3>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vehicle Name *</label>
                <input type="text" value={vehicleForm.name} onChange={e => setVehicleForm({...vehicleForm, name: e.target.value})} className="form-input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value})} className="form-input">
                    <option value="">Select...</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                    <option value="semi">Semi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity (lbs)</label>
                  <input type="number" value={vehicleForm.capacity} onChange={e => setVehicleForm({...vehicleForm, capacity: e.target.value})} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Plate</label>
                <input type="text" value={vehicleForm.license_plate} onChange={e => setVehicleForm({...vehicleForm, license_plate: e.target.value})} className="form-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
