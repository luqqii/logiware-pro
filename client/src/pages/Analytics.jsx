import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart3, TrendingUp, Warehouse, Package } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#00D26E', '#645BFF', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export default function Analytics() {
  const [dashboard, setDashboard] = useState(null);
  const [orderMetrics, setOrderMetrics] = useState([]);
  const [invTrends, setInvTrends] = useState([]);
  const [warehousePerf, setWarehousePerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashRes, orderRes, invRes, whRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getOrderMetrics(),
        analyticsAPI.getInventoryTrends(),
        analyticsAPI.getWarehousePerformance(),
      ]);
      setDashboard(dashRes.data);
      setOrderMetrics(orderRes.data || []);
      setInvTrends(invRes.data || []);
      setWarehousePerf(whRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 bg-surface-border rounded w-48 animate-pulse"></div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-surface-border rounded-card animate-pulse"></div>)}
      </div>
    </div>
  );

  const whChartData = warehousePerf.map(w => ({
    name: w.name?.slice(0, 15) || 'Unknown',
    orders: w.total_orders || 0,
    items: w.total_items || 0,
    utilization: parseFloat(w.capacity_utilization) || 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Analytics & Reports</h1>
          <p className="text-text-muted mt-1">Deep insights into your logistics operations</p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-value">{dashboard?.orders?.total_orders || 0}</p>
          <p className="kpi-label">Total Orders</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{dashboard?.shipments?.total_shipments || 0}</p>
          <p className="kpi-label">Total Shipments</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{dashboard?.fulfillmentRate || 0}%</p>
          <p className="kpi-label">Fulfillment Rate</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{dashboard?.avgLeadTime || 0}h</p>
          <p className="kpi-label">Avg Lead Time</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Volume */}
        <div className="card">
          <h3 className="font-bold text-navy mb-4">Order Volume (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={orderMetrics.length > 0 ? orderMetrics : generateSampleBarData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
              <Bar dataKey="orders" fill="#645BFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fulfilled" fill="#00D26E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-accent rounded"></div><span className="text-text-muted">Orders</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded"></div><span className="text-text-muted">Fulfilled</span></div>
          </div>
        </div>

        {/* Inventory Trends */}
        <div className="card">
          <h3 className="font-bold text-navy mb-4">Inventory Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={invTrends.length > 0 ? invTrends : generateSampleLineData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
              <Line type="monotone" dataKey="total_quantity" stroke="#00D26E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Warehouse Performance */}
      <div className="card mb-6">
        <h3 className="font-bold text-navy mb-4">Warehouse Performance</h3>
        {warehousePerf.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={whChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#888888" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#888888" width={120} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} />
              <Bar dataKey="orders" fill="#645BFF" radius={[0, 4, 4, 0]} name="Orders" />
              <Bar dataKey="items" fill="#00D26E" radius={[0, 4, 4, 0]} name="Items" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-text-muted">No warehouse data available</div>
        )}
      </div>

      {/* Capacity Utilization */}
      <div className="card">
        <h3 className="font-bold text-navy mb-4">Capacity Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehousePerf.map((wh, i) => (
            <div key={wh.warehouse_id} className="p-4 border border-surface-border rounded-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-surface-light-gray rounded-lg flex items-center justify-center">
                  <Warehouse size={20} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy truncate">{wh.name}</p>
                  <p className="text-xs text-text-muted">{wh.total_orders || 0} orders</p>
                </div>
              </div>
              <div className="w-full bg-surface-light-gray rounded-full h-3 mb-2">
                <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${Math.min(100, wh.capacity_utilization || 0)}%` }}></div>
              </div>
              <p className="text-sm text-text-muted">{wh.capacity_utilization || 0}% utilized</p>
            </div>
          ))}
          {warehousePerf.length === 0 && <p className="text-center py-8 text-text-muted col-span-full">No warehouse data</p>}
        </div>
      </div>
    </div>
  );
}

function generateSampleBarData() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: Math.floor(Math.random() * 30) + 10,
      fulfilled: Math.floor(Math.random() * 25) + 5,
    });
  }
  return data;
}

function generateSampleLineData() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total_quantity: Math.floor(Math.random() * 2000) + 1000,
    });
  }
  return data;
}
