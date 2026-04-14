import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Bell, Shield, Database, Globe, Save, Check } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [integrations, setIntegrations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '', industry: '', notifications: true, emailAlerts: true,
  });

  useEffect(() => {
    loadIntegrations();
    setFormData(prev => ({
      ...prev,
      orgName: user?.name || '',
      industry: 'logistics',
    }));
  }, []);

  const loadIntegrations = async () => {
    try {
      const res = await analyticsAPI.getIntegrations();
      setIntegrations(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addIntegration = async (type) => {
    try {
      await analyticsAPI.createIntegration({ type, name: type.toUpperCase(), config: {} });
      loadIntegrations();
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Database },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">Settings</h1>
        <p className="text-text-muted mt-1">Manage your account and organization settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="card p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-navy text-white'
                    : 'text-text-muted hover:bg-surface-light-gray hover:text-navy'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {activeTab === 'general' && (
              <div>
                <h3 className="font-bold text-navy mb-6">General Settings</h3>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Organization Name</label>
                    <input type="text" value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})} className="form-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="form-input">
                      <option value="logistics">Logistics</option>
                      <option value="ecommerce">E-Commerce</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="3pl">3PL Provider</option>
                      <option value="retail">Retail</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Timezone</label>
                    <select className="form-input">
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC+0 (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date Format</label>
                    <select className="form-input">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                    <div>
                      <p className="font-medium text-navy">API Access</p>
                      <p className="text-sm text-text-muted">Enable API access for integrations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-surface-border peer-checked:bg-primary rounded-full peer-focus:ring-2 peer-focus:ring-accent transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="font-bold text-navy mb-6">Notification Preferences</h3>
                <div className="space-y-4 max-w-lg">
                  {[
                    { key: 'notifications', label: 'Push Notifications', desc: 'Receive browser notifications' },
                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Get alerts via email' },
                    { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Alert when inventory drops below threshold' },
                    { key: 'orderUpdates', label: 'Order Status Updates', desc: 'Notify on order status changes' },
                    { key: 'shipmentAlerts', label: 'Shipment Alerts', desc: 'Alert on shipment delays' },
                    { key: 'weeklyReport', label: 'Weekly Reports', desc: 'Receive weekly performance reports' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
                      <div>
                        <p className="font-medium text-navy">{item.label}</p>
                        <p className="text-sm text-text-muted">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-surface-border peer-checked:bg-primary rounded-full peer-focus:ring-2 peer-focus:ring-accent transition-colors"></div>
                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="font-bold text-navy mb-6">Security Settings</h3>
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <input type="password" className="form-input" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password</label>
                    <input type="password" className="form-input" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                    <input type="password" className="form-input" placeholder="Confirm new password" />
                  </div>
                  <div className="pt-4 border-t border-surface-border">
                    <h4 className="font-medium text-navy mb-3">Two-Factor Authentication</h4>
                    <p className="text-sm text-text-muted mb-3">Add an extra layer of security to your account</p>
                    <button className="btn-outline text-sm">Enable 2FA</button>
                  </div>
                  <div className="pt-4 border-t border-surface-border">
                    <h4 className="font-medium text-navy mb-3">Session Management</h4>
                    <div className="p-3 bg-surface-light-gray rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-navy">Current Session</p>
                          <p className="text-xs text-text-light">Last active: Just now</p>
                        </div>
                        <span className="badge badge-success">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div>
                <h3 className="font-bold text-navy mb-6">Integrations</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'SAP ERP', type: 'sap', desc: 'Connect to SAP for order sync', connected: integrations.some(i => i.type === 'sap') },
                      { name: 'Oracle WMS', type: 'oracle', desc: 'Oracle warehouse integration', connected: false },
                      { name: 'NetSuite', type: 'netsuite', desc: 'NetSuite ERP connection', connected: false },
                      { name: 'Shopify', type: 'shopify', desc: 'E-commerce order import', connected: false },
                      { name: 'FedEx', type: 'fedex', desc: 'FedEx shipping rates & labels', connected: integrations.some(i => i.type === 'fedex') },
                      { name: 'UPS', type: 'ups', desc: 'UPS shipping integration', connected: false },
                      { name: 'DHL', type: 'dhl', desc: 'DHL Express integration', connected: false },
                      { name: 'IoT Sensors', type: 'iot', desc: 'Warehouse sensor data feed', connected: false },
                    ].map(integration => (
                      <div key={integration.type} className="p-4 border border-surface-border rounded-card flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-navy">{integration.name}</p>
                          <p className="text-sm text-text-muted">{integration.desc}</p>
                        </div>
                        {integration.connected ? (
                          <span className="badge badge-success flex items-center gap-1"><Check size={12} /> Connected</span>
                        ) : (
                          <button onClick={() => addIntegration(integration.type)} className="btn-outline text-sm">Connect</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-surface-border">
              {saved && (
                <span className="text-sm text-severity-success flex items-center gap-1">
                  <Check size={14} /> Saved successfully
                </span>
              )}
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin"></div> Saving...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
