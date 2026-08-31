import React, { useState, useEffect } from 'react';
import { salesService } from '../../services/api/salesService';
import { storeService } from '../../services/api/storeService';
import { partnerService } from '../../services/api/partnerService';
import { managerService } from '../../services/api/managerService';
import { orderService } from '../../services/api/orderService';
import {
  SalesSummary,
  Store,
  DeliveryPartner,
  StoreManager,
  Order,
  SalesTrendPoint,
} from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { SalesTrendChart, OrderStatusDistribution } from './SimpleCharts';
import { OrderStatusBadge, VegNonVegBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { NavTab } from '../../components/layout/Sidebar';
import { useIntervention } from '../../context/InterventionContext';
import {
  ShoppingBag,
  IndianRupee,
  Store as StoreIcon,
  Bike,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChefHat,
} from 'lucide-react';
import { TableSkeleton } from '../../components/common/Skeleton';

export const DashboardPage: React.FC<{ onNavigate: (tab: NavTab) => void }> = ({ onNavigate }) => {
  const { openInterventionModal } = useIntervention();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [managers, setManagers] = useState<StoreManager[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [trendData, setTrendData] = useState<SalesTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, st, pt, mg, ord, tr] = await Promise.all([
        salesService.getSummary(),
        storeService.getStores(),
        partnerService.getPartners(),
        managerService.getManagers(),
        orderService.getOrders(),
        salesService.getSalesTrends('Today'),
      ]);
      setSummary(sum);
      setStores(st);
      setPartners(pt);
      setManagers(mg);
      setRecentOrders(ord.slice(0, 5));
      setTrendData(tr);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDbChange = () => {
      loadData();
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, []);

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl p-4 shadow-xs animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl p-6 shadow-xs animate-pulse" />
      </div>
    );
  }

  // Breakdowns
  const activeStores = stores.filter((s) => s.status === 'Active').length;
  const inactiveStores = stores.filter((s) => s.status === 'Inactive').length;
  const onlinePartners = partners.filter((p) => p.onlineStatus === 'Online').length;
  const offlinePartners = partners.filter((p) => p.onlineStatus === 'Offline').length;

  return (
    <div id="admin-dashboard-page" className="space-y-6">
      {/* 1. Primary Metrics Grid - Exactly matching prompt specs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Today's Core Performance
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Live updates across all stores & fleet
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            id="stat-today-orders"
            title="Today's Orders"
            value={summary.todayOrders}
            subtitle={`${summary.todayActiveOrders} Active • ${summary.todayCompletedOrders} Completed`}
            trend={{ value: '14% vs yesterday', isPositive: true }}
            icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
            iconBgColor="bg-amber-50"
            onClick={() => onNavigate('orders')}
          />

          <StatCard
            id="stat-today-sales"
            title="Today's Sales"
            value={`₹${summary.todaySales.toLocaleString()}`}
            subtitle={`Total Platform Sales: ₹${summary.totalSales.toLocaleString()}`}
            trend={{ value: '8.4% vs last week', isPositive: true }}
            icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
            iconBgColor="bg-emerald-50"
            onClick={() => onNavigate('sales')}
          />

          <StatCard
            id="stat-stores"
            title="Stores"
            value={stores.length}
            subtitle={`${activeStores} Active • ${inactiveStores} Inactive`}
            icon={<StoreIcon className="w-5 h-5 text-blue-600" />}
            iconBgColor="bg-blue-50"
            onClick={() => onNavigate('stores')}
          />

          <StatCard
            id="stat-partners"
            title="Delivery Partners"
            value={partners.length}
            subtitle={`${onlinePartners} Online 🟢 • ${offlinePartners} Offline ⚫`}
            icon={<Bike className="w-5 h-5 text-purple-600" />}
            iconBgColor="bg-purple-50"
            onClick={() => onNavigate('partners')}
          />
        </div>
      </div>

      {/* 2. Secondary Detailed KPI Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Orders</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{summary.todayActiveOrders}</p>
          <span className="text-[10px] text-slate-400">In prep / out for delivery</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Completed</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{summary.todayCompletedOrders}</p>
          <span className="text-[10px] text-slate-400">Successfully delivered</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Cancelled</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{summary.todayCancelledOrders}</p>
          <span className="text-[10px] text-slate-400">Out of stock / rejected</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Store Managers</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{managers.length}</p>
          <span className="text-[10px] text-slate-400">Assigned operators</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Weekly Sales</span>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(summary.weeklySales / 1000).toFixed(1)}k</p>
          <span className="text-[10px] text-slate-400">{summary.weeklyOrders} total orders</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Monthly Sales</span>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(summary.monthlySales / 1000).toFixed(1)}k</p>
          <span className="text-[10px] text-slate-400">{summary.monthlyOrders} total orders</span>
        </div>
      </div>

      {/* 3. Charts & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Sales Hourly Flow */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Today's Sales & Order Velocity</h3>
              <p className="text-xs text-slate-500">Hourly revenue distribution across all registered stores</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('sales')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Full Sales Report
            </Button>
          </div>
          <SalesTrendChart data={trendData} />
        </div>

        {/* Order Status Breakdown & Quick Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Today's Order Health</h3>
            <p className="text-xs text-slate-500 mb-4">Ratio of completed vs active vs rejected orders</p>
            <OrderStatusDistribution
              completed={summary.todayCompletedOrders}
              active={summary.todayActiveOrders}
              cancelled={summary.todayCancelledOrders}
            />
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="quick-add-store"
                onClick={() => onNavigate('stores')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 text-left transition-colors"
              >
                <StoreIcon className="w-4 h-4 text-amber-600 mb-1" />
                <span className="block text-xs font-bold text-slate-900">Manage Stores</span>
                <span className="block text-[10px] text-slate-500">{stores.length} outlets</span>
              </button>

              <button
                id="quick-add-rider"
                onClick={() => onNavigate('partners')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/30 text-left transition-colors"
              >
                <Bike className="w-4 h-4 text-purple-600 mb-1" />
                <span className="block text-xs font-bold text-slate-900">Fleet Partners</span>
                <span className="block text-[10px] text-slate-500">{onlinePartners} online</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Orders Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Live Orders</h3>
            <p className="text-xs text-slate-500">Live order queue from campus hostels and tech parks</p>
          </div>
          <Button
            id="view-all-orders-btn"
            variant="outline"
            size="sm"
            onClick={() => onNavigate('orders')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            View All Orders
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer & Hostel</th>
                <th className="px-5 py-3">Store</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">#{order.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{order.customerName}</div>
                    <div className="text-slate-500 text-[11px]">
                      {order.deliveryAddress.hostelOrPgName}, {order.deliveryAddress.roomNumber}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{order.storeName}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-slate-700 truncate max-w-[180px]">
                      {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">₹{order.total}</td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={order.orderStatus} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {order.isTimeoutInterventionRequired || order.orderStatus === 'Waiting for Admin' ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openInterventionModal(order)}
                        className="text-xs font-bold"
                      >
                        Intervene
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate('orders')}
                        className="text-xs"
                      >
                        Details
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
