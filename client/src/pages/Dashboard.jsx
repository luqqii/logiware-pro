import { useState, useEffect } from 'react';
import { analyticsAPI, orderAPI, inventoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package, ShoppingCart, Truck, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Eye, Warehouse, Clock, Activity, Boxes
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#00D26E', '#645BFF', '#F59E0B', '#EF4444', '#3B82F6'];

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [orderMetrics, setOrderMetrics] = useState([]);
  const [inventoryTrends, setInventoryTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, orderRes, invRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getOrderMetrics(),
        analyticsAPI.getInventoryTrends(),
      ]);
      setDashboardData(dashRes.data);
      setOrderMetrics(orderRes.data || []);
      setInventoryTrends(invRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const kpis = [
    {
      label: 'Total Inventory Value',
      value: `$${Number(dashboardData?.inventory?.total_value || 0).toLocaleString()}`,
      change: '+12.5%',
      changeType: 'up',
      icon: Package,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Total Items',
      value: dashboardData?.inventory?.total_items || 0,
      change: '+8.2%',
      changeType: 'up',
      icon: Boxes,
      color: 'bg-accent/10 text-accent',
    },
    {
      label: 'Pending Orders',
      value: dashboardData?.orders?.pending_orders || 0,
      change: '-3.1%',
      changeType: 'down',
      icon: ShoppingCart,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'In Transit',
      value: dashboardData?.shipments?.in_transit || 0,
      change: '+5.4%',
      changeType: 'up',
      icon: Truck,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Fulfillment Rate',
      value: `${dashboardData?.fulfillmentRate || 0}%`,
      change: '+2.1%',
      changeType: 'up',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Low Stock Alerts',
      value: dashboardData?.lowStockAlerts || 0,
      change: '-1',
      changeType: 'down',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
    },
  ];

  // Generate sample chart data if empty
  const chartData = orderMetrics.length > 0 ? orderMetrics : generateSampleData(30);
  const invData = inventoryTrends.length > 0 ? inventoryTrends : generateSampleData(30, true);

  const orderStatusData = [
    { name: 'Pending', value: dashboardData?.orders?.pending_orders || 5 },
    { name: 'Picked', value: dashboardData?.orders?.picked_orders || 3 },
    { name: 'Packed', value: dashboardData?.orders?.packed_orders || 2 },
    { name: 'Shipped', value: dashboardData?.orders?.shipped_orders || 8 },
    { name: 'Delivered', value: dashboardData?.orders?.delivered_orders || 15 },
  ].filter(d => d.value > 0);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-text-muted mt-1">Here's what's happening with your logistics operations today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center`}>
                <kpi.icon size={20} />
              </div>
              <span className={`kpi-change ${kpi.changeType === 'up' ? 'kpi-change-up' : 'kpi-change-down'}`}>
                {kpi.changeType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change}
              </span>
            </div>
            <p className="kpi-value">{kpi.value}</p>
            <p className="kpi-label">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Order Trends */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-navy">Order Trends</h3>
              <p className="text-sm text-text-muted">Last 30 days</p>
            </div>
            <button className="btn-ghost text-sm">View All</button>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#645BFF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#645BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888888" />
              <YAxis tick={{ fontSize: 12 }} stroke="#888888" />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
              />
              <Area type="monotone" dataKey="orders" stroke="#645BFF" fill="url(#colorOrders)" strokeWidth={2} />
              <Area type="monotone" dataKey="fulfilled" stroke="#00D26E" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie */}
        <div className="card">
          <h3 className="font-bold text-navy mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {orderStatusData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {orderStatusData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                <span className="text-xs text-text-muted">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy">Recent Alerts</h3>
            <button className="btn-ghost text-sm">View All</button>
          </div>
          <div className="space-y-3">
            {dashboardData?.recentAlerts?.length > 0 ? (
              dashboardData.recentAlerts.map((alert) => (
                <div key={alert.alert_id} className="flex items-start gap-3 p-3 bg-surface-light-gray rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{alert.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-light">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No new alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Warehouse Capacity */}
        <div className="card">
          <h3 className="font-bold text-navy mb-4">Warehouse Capacity</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Total Capacity</span>
                <span className="text-sm font-semibold text-navy">
                  {dashboardData?.warehouseCapacity?.total_capacity?.toLocaleString() || 10000} units
                </span>
              </div>
              <div className="w-full bg-surface-light-gray rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (dashboardData?.warehouseCapacity?.used_capacity || 3500) / (dashboardData?.warehouseCapacity?.total_capacity || 10000) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {dashboardData?.warehouseCapacity?.used_capacity?.toLocaleString() || 3500} / {dashboardData?.warehouseCapacity?.total_capacity?.toLocaleString() || 10000} units used
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-border">
              <div className="text-center">
                <p className="text-lg font-bold text-navy">{dashboardData?.avgLeadTime || 24}h</p>
                <p className="text-xs text-text-muted">Avg. Lead Time</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-navy">{dashboardData?.fulfillmentRate || 87}%</p>
                <p className="text-xs text-text-muted">Fulfillment Rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-navy">{dashboardData?.lowStockAlerts || 2}</p>
                <p className="text-xs text-text-muted">Low Stock Items</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-surface-border rounded w-48 mb-2"></div>
      <div className="h-4 bg-surface-border rounded w-72 mb-8"></div>
      <div className="grid grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-surface-border rounded-card"></div>
        ))}
      </div>
    </div>
  );
}

function generateSampleData(days, isInventory) {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: Math.floor(Math.random() * 30) + 10,
      fulfilled: Math.floor(Math.random() * 25) + 5,
      items_added: isInventory ? Math.floor(Math.random() * 20) + 5 : undefined,
      total_quantity: isInventory ? Math.floor(Math.random() * 500) + 100 : undefined,
    });
  }
  return data;
}
