import React, { useState, useEffect } from 'react';
import {
  SalesSummary,
  StoreSalesBreakdown,
  TopSellingItem,
  SalesTrendPoint,
} from '../../types';
import { salesService } from '../../services/api/salesService';
import { StatCard } from '../../components/common/StatCard';
import { SalesTrendChart } from '../dashboard/SimpleCharts';
import { VegNonVegBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Store as StoreIcon,
  Award,
  Calendar,
  Filter,
  BarChart3,
} from 'lucide-react';

export const SalesDashboardPage: React.FC = () => {
  const { error } = useToast();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [timeRange, setTimeRange] = useState<
    'Today' | 'Last 7 days' | 'This month' | 'Custom date range'
  >('Today');
  const [storeBreakdowns, setStoreBreakdowns] = useState<StoreSalesBreakdown[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [trendData, setTrendData] = useState<SalesTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom date range state
  const [customStart, setCustomStart] = useState('2026-03-01');
  const [customEnd, setCustomEnd] = useState('2026-03-15');

  const loadData = async (range: string) => {
    setIsLoading(true);
    try {
      const [sum, stores, topItems, trends] = await Promise.all([
        salesService.getSummary(),
        salesService.getStoreBreakdown(range),
        salesService.getTopSellingItems(range),
        salesService.getSalesTrends(range),
      ]);
      setSummary(sum);
      setStoreBreakdowns(stores);
      setTopSellingItems(topItems);
      setTrendData(trends);
    } catch {
      error('Failed to load sales analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);

    const handleDbChange = () => {
      loadData(timeRange);
    };
    window.addEventListener('foodfleet_db_change', handleDbChange);
    return () => window.removeEventListener('foodfleet_db_change', handleDbChange);
  }, [timeRange]);

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

  const maxStoreSales = Math.max(...storeBreakdowns.map((s) => s.totalSales), 100);

  return (
    <div id="sales-dashboard-page" className="space-y-6">
      {/* Header & Date Range Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales & Revenue Analytics</h2>
          <p className="text-xs text-slate-500">
            Comprehensive platform turnover, volume velocity, store breakdowns, and top-selling food rankings
          </p>
        </div>

        {/* Filter Pills matching specs */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {(['Today', 'Last 7 days', 'This month', 'Custom date range'] as const).map(
            (range) => (
              <button
                key={range}
                id={`filter-range-${range.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {range}
              </button>
            )
          )}
        </div>
      </div>

      {/* Custom Date Range Picker (if selected) */}
      {timeRange === 'Custom date range' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-900"
            />
          </div>
          <Button size="sm" onClick={() => loadData('Custom date range')}>
            Apply Date Range
          </Button>
        </div>
      )}

      {/* 1. Core Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-sales-today"
          title="Today's Sales"
          value={`₹${summary.todaySales.toLocaleString()}`}
          subtitle={`${summary.todayOrders} orders processed today`}
          trend={{ value: '12.8% vs last week', isPositive: true }}
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50"
        />

        <StatCard
          id="stat-sales-weekly"
          title="Weekly Sales (7D)"
          value={`₹${summary.weeklySales.toLocaleString()}`}
          subtitle={`${summary.weeklyOrders} orders across all outlets`}
          trend={{ value: '6.4% growth', isPositive: true }}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-50"
        />

        <StatCard
          id="stat-sales-monthly"
          title="Monthly Sales (30D)"
          value={`₹${summary.monthlySales.toLocaleString()}`}
          subtitle={`${summary.monthlyOrders} total completed orders`}
          trend={{ value: '18.2% mom', isPositive: true }}
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          iconBgColor="bg-purple-50"
        />

        <StatCard
          id="stat-sales-total"
          title="Total Lifetime Turnover"
          value={`₹${summary.totalSales.toLocaleString()}`}
          subtitle="Cumulative platform Gross Merchandise Value"
          icon={<Award className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50"
        />
      </div>

      {/* 2. Volume Velocity Chart for Current Selected Range */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Sales Revenue Velocity ({timeRange})
            </h3>
            <p className="text-xs text-slate-500">Gross revenue generated across time periods</p>
          </div>
        </div>
        <SalesTrendChart data={trendData} />
      </div>

      {/* 3. Two-Column Analytics: Store Breakdowns & Top-Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales By Store Table & Visual Performance */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sales & Orders by Store</h3>
              <p className="text-xs text-slate-500">Revenue contribution per outlet for {timeRange}</p>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {storeBreakdowns.length} Stores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Store Outlet</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total Sales</th>
                  <th className="px-4 py-3">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storeBreakdowns.map((store) => {
                  const sharePct = Math.round((store.totalSales / maxStoreSales) * 100);
                  return (
                    <tr key={store.storeId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {store.storeName}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {store.totalOrders}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-700">
                        ₹{store.totalSales.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-full max-w-[120px] bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${sharePct}%` }}
                            className="bg-amber-500 h-full rounded-full"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top-Selling Items Ranking */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top-Selling Dishes</h3>
              <p className="text-xs text-slate-500">Most ordered items ranking</p>
            </div>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {topSellingItems.map((item, index) => (
              <div key={item.itemId} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <VegNonVegBadge isVeg={item.isVeg} />
                  <div>
                    <div className="font-bold text-slate-900">{item.itemName}</div>
                    <div className="text-[11px] text-slate-500">{item.storeName}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900">₹{item.revenue.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500">{item.quantitySold} units sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
