import { useState, useEffect } from 'react';
import { automationAPI } from '../services/api';
import { Zap, Plus, Play, Edit2, Trash2, AlertCircle, Send, Bell, Webhook, RotateCcw } from 'lucide-react';

const triggerTypes = [
  { value: 'low_stock', label: 'Low Stock Alert' },
  { value: 'order_created', label: 'Order Created' },
  { value: 'order_shipped', label: 'Order Shipped' },
  { value: 'shipment_delayed', label: 'Shipment Delayed' },
  { value: 'inventory_updated', label: 'Inventory Updated' },
  { value: 'forecast_shortage', label: 'Forecast Shortage' },
];

const actionTypes = [
  { value: 'send_alert', label: 'Send Alert', icon: AlertCircle },
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'update_status', label: 'Update Status', icon: RotateCcw },
  { value: 'reorder', label: 'Auto Reorder', icon: Zap },
  { value: 'webhook', label: 'Webhook', icon: Webhook },
];

export default function Automation() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', trigger_type: 'low_stock',
    trigger_conditions: {}, actions: [{ type: 'send_alert', severity: 'warning', title: '', message: '' }],
    priority: 0,
  });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const res = await automationAPI.list();
      setRules(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await automationAPI.create(formData);
      setShowModal(false);
      setFormData({ name: '', description: '', trigger_type: 'low_stock', trigger_conditions: {}, actions: [{ type: 'send_alert', severity: 'warning', title: '', message: '' }], priority: 0 });
      loadRules();
    } catch (err) { console.error(err); }
  };

  const toggleRule = async (rule) => {
    try {
      await automationAPI.update(rule.rule_id, { status: rule.status === 'active' ? 'paused' : 'active' });
      loadRules();
    } catch (err) { console.error(err); }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try { await automationAPI.delete(id); loadRules(); } catch (err) { console.error(err); }
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'send_alert', severity: 'warning', title: '', message: '' }],
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index) => {
    setFormData({ ...formData, actions: formData.actions.filter((_, i) => i !== index) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Workflow Automation</h1>
          <p className="text-text-muted mt-1">Create no-code automation rules for your operations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Rule
        </button>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-24"></div>)}
        </div>
      ) : rules.length === 0 ? (
        <div className="card text-center py-12">
          <Zap size={48} className="mx-auto text-text-light mb-4" />
          <h3 className="text-lg font-semibold text-navy mb-2">No automation rules yet</h3>
          <p className="text-text-muted mb-4">Create your first rule to automate workflows</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Rule</button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.rule_id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-navy">{rule.name}</h3>
                    <span className={`badge ${rule.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{rule.status}</span>
                    <span className="badge bg-surface-light-gray">Priority: {rule.priority}</span>
                  </div>
                  {rule.description && <p className="text-sm text-text-muted mb-3">{rule.description}</p>}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-text-light">Trigger:</span>
                      <span className="font-medium text-navy">{rule.trigger_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-light">Actions:</span>
                      <span className="font-medium text-navy">{rule.actions?.length || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleRule(rule)} className="p-2 hover:bg-surface-light-gray rounded-lg" title={rule.status === 'active' ? 'Pause' : 'Activate'}>
                    {rule.status === 'active' ? <Zap size={18} className="text-primary" /> : <Zap size={18} className="text-text-light" />}
                  </button>
                  <button className="p-2 hover:bg-surface-light-gray rounded-lg">
                    <Edit2 size={16} className="text-text-muted" />
                  </button>
                  <button onClick={() => deleteRule(rule.rule_id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-card shadow-form p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-navy mb-4">Create Automation Rule</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rule Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})} className="form-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-input" rows="2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Type *</label>
                <select value={formData.trigger_type} onChange={e => setFormData({...formData, trigger_type: e.target.value})} className="form-input" required>
                  {triggerTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Actions</label>
                  <button type="button" onClick={addAction} className="text-sm text-accent hover:text-accent-hover font-medium">+ Add Action</button>
                </div>
                <div className="space-y-3">
                  {formData.actions.map((action, i) => (
                    <div key={i} className="p-4 bg-surface-light-gray rounded-card">
                      <div className="flex items-center gap-2 mb-3">
                        <select value={action.type} onChange={e => updateAction(i, 'type', e.target.value)} className="form-input flex-1">
                          {actionTypes.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                        {formData.actions.length > 1 && (
                          <button type="button" onClick={() => removeAction(i)} className="p-1 hover:bg-red-100 rounded">
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-text-light mb-1">Severity</label>
                          <select value={action.severity} onChange={e => updateAction(i, 'severity', e.target.value)} className="form-input text-sm">
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-text-light mb-1">Title</label>
                          <input type="text" value={action.title} onChange={e => updateAction(i, 'title', e.target.value)} className="form-input text-sm" placeholder="Alert title" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-text-light mb-1">Message</label>
                        <input type="text" value={action.message} onChange={e => updateAction(i, 'message', e.target.value)} className="form-input text-sm" placeholder="Alert message" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-surface-border">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
