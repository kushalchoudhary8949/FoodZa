import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Building,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import { EarningsSummary, PartnerProfile } from '../types';
import { api } from '../lib/api';

interface EarningsViewProps {
  partner: PartnerProfile;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ partner }) => {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getEarnings();
      setEarnings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="earnings-view" className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Earnings & Payouts</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time automated trip ledger and bank deposits
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Server Verified</span>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Today's Earnings */}
        <div id="earnings-card-today" className="bg-slate-900 border border-amber-400/30 rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-1">
            Today's Earnings
          </div>
          <div className="text-3xl font-bold text-white font-mono tracking-tight">
            ₹{partner.todayEarnings}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{partner.todayDeliveries} trips completed</span>
          </div>
        </div>

        {/* Completed Deliveries */}
        <div id="earnings-card-completed" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Completed Trips
          </div>
          <div className="text-3xl font-bold text-white font-mono tracking-tight">
            {partner.totalDeliveries}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Lifetime orders fulfilled
          </div>
        </div>

        {/* Total Lifetime Earnings */}
        <div id="earnings-card-total" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            Total Payouts
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
            ₹{partner.totalEarnings.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Avg ~₹{partner.totalDeliveries > 0 ? Math.round(partner.totalEarnings / partner.totalDeliveries) : 35} per order
          </div>
        </div>
      </div>

      {/* 7-Day Performance Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              7-Day Earnings Trend
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            Weekly: ₹{(partner.todayEarnings + 2450).toLocaleString('en-IN')}
          </span>
        </div>

        {earnings?.dailyBreakdown ? (
          <div className="grid grid-cols-7 gap-2 pt-2 text-center">
            {earnings.dailyBreakdown.map((item, idx) => {
              const heightPercent = Math.min(100, Math.max(16, (item.earnings / 650) * 100));
              const isToday = idx === 0;

              return (
                <div key={item.date} className="flex flex-col items-center gap-1.5">
                  <div className="text-[10px] font-mono text-slate-400">
                    ₹{item.earnings}
                  </div>
                  <div className="w-full bg-slate-950/80 rounded-xl h-24 flex items-end p-1 border border-slate-800">
                    <div
                      className={`w-full rounded-lg transition-all duration-300 ${
                        isToday ? 'bg-amber-400' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <div className={`text-[11px] font-semibold ${isToday ? 'text-amber-400' : 'text-slate-400'}`}>
                    {item.dayName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {item.deliveries} trips
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">Loading breakdown...</div>
        )}
      </div>

      {/* Payout Bank & Active Incentives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Bank Account */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building className="w-4 h-4 text-sky-400" />
              <span>Registered Bank Account</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
              Verified
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Bank:</span>
              <span className="text-slate-200 font-semibold">{partner.bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account:</span>
              <span className="text-slate-200 font-mono">{partner.bankDetails.accountNumberMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IFSC:</span>
              <span className="text-slate-200 font-mono">{partner.bankDetails.ifscCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">UPI ID:</span>
              <span className="text-amber-400 font-mono">{partner.bankDetails.upiId}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Daily payouts are deposited automatically every night at 11:59 PM to your registered bank account.
          </p>
        </div>

        {/* Incentives */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Active Surge & Bonuses</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-amber-300">
              <div>
                <div className="font-semibold text-white">Daily Target Bonus</div>
                <div className="text-[11px] text-amber-300/80 mt-0.5">Complete 10 trips today ({partner.todayDeliveries}/10 done)</div>
              </div>
              <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg">+₹100</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-slate-300">
              <div>
                <div className="font-semibold text-white">Dinner Peak (7 PM - 11 PM)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">+₹15 extra per completed trip</div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

