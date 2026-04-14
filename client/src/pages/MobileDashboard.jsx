import { useState, useEffect } from 'react';
import { analyticsAPI, orderAPI, inventoryAPI } from '../services/api';
import { Package, ShoppingCart, Truck, AlertTriangle, TrendingUp, Menu, Search, Bell, Warehouse } from 'lucide-react';

export default function MobileDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, orderRes, invRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        orderAPI.list({ limit: 10 }),
        inventoryAPI.list({ limit: 20 }),
      ]);
      setDashboard(dashRes.data);
      setOrders(orderRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const kpis = [
    { label: 'Inventory', value: dashboard?.inventory?.total_items || 0, icon: Package, color: 'bg-accent/10 text-accent' },
    { label: 'Pending Orders', value: dashboard?.orders?.pending_orders || 0, icon: ShoppingCart, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'In Transit', value: dashboard?.shipments?.in_transit || 0, icon: Truck, color: 'bg-blue-100 text-blue-600' },
    { label: 'Low Stock', value: dashboard?.lowStockAlerts || 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-surface-light-gray">
      {/* Mobile Header */}
      <header className="bg-navy text-white sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package size={18} className="text-navy" />
            </div>
            <span className="font-bold">LogiWare</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2"><Search size={20} /></button>
            <button className="p-2 relative"><Bell size={20} /><span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span></button>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="p-4 pb-20">
          {/* Welcome */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-navy">Dashboard</h1>
            <p className="text-sm text-text-muted">Today's overview</p>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-white rounded-card p-4 shadow-card">
                <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
                  <kpi.icon size={20} />
                </div>
                <p className="text-xl font-bold text-navy">{kpi.value}</p>
                <p className="text-xs text-text-muted">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-card shadow-card p-4 mb-4">
            <h3 className="font-bold text-navy mb-3">Recent Orders</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order.order_id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy">#{order.order_id?.slice(0, 8)}</p>
                    <p className="text-xs text-text-muted">{order.customer_name || 'Unknown'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'shipped' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{order.status}</span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-sm text-text-muted text-center py-4">No orders</p>}
            </div>
          </div>

          {/* Low Stock Alert */}
          {dashboard?.lowStockAlerts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-red-600" />
                <h3 className="font-bold text-red-800">Low Stock Alert</h3>
              </div>
              <p className="text-sm text-red-700">{dashboard.lowStockAlerts} items below reorder point</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="p-4 pb-20">
          <h1 className="text-xl font-bold text-navy mb-4">Inventory</h1>
          <div className="bg-white rounded-card shadow-card">
            {inventory.slice(0, 15).map(item => (
              <div key={item.item_id} className="flex items-center justify-between px-4 py-3 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy">{item.name}</p>
                  <p className="text-xs text-text-light">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${item.quantity <= item.reorder_point ? 'text-red-600' : 'text-navy'}`}>
                    {item.quantity}
                  </p>
                  <p className="text-xs text-text-light">units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="p-4 pb-20">
          <h1 className="text-xl font-bold text-navy mb-4">Orders</h1>
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.order_id} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-navy">#{order.order_id?.slice(0, 8)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'shipped' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{order.status}</span>
                </div>
                <p className="text-sm text-text-muted">{order.customer_name || 'Unknown'}</p>
                <p className="text-sm font-semibold mt-2">${Number(order.total_amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border flex">
        {[
          { id: 'dashboard', label: 'Home', icon: TrendingUp },
          { id: 'inventory', label: 'Inventory', icon: Warehouse },
          { id: 'orders', label: 'Orders', icon: ShoppingCart },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 ${
              activeTab === tab.id ? 'text-accent' : 'text-text-light'
            }`}
          >
            <tab.icon size={22} />
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
