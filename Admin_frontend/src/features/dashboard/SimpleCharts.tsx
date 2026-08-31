import React from 'react';
import { SalesTrendPoint } from '../../types';

export const SalesTrendChart: React.FC<{ data: SalesTrendPoint[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-36 flex items-center justify-center text-xs text-slate-400">
        No sales data points available for this period.
      </div>
    );
  }

  const maxSales = Math.max(...data.map((d) => d.sales), 100);
  const chartHeight = 160;

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-44 pt-6 pb-2 px-2 border-b border-slate-100">
        {data.map((point, index) => {
          const heightPercent = Math.max(10, Math.round((point.sales / maxSales) * 100));
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-semibold py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                ₹{point.sales.toLocaleString()} ({point.orders} orders)
              </div>

              {/* Bar */}
              <div className="w-full bg-slate-100 rounded-t-md flex items-end justify-center h-32 overflow-hidden">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md group-hover:from-amber-700 group-hover:to-amber-500 transition-all duration-300"
                />
              </div>

              {/* Label */}
              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[50px]">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-2">
        <span>Min: ₹0</span>
        <span className="font-semibold text-slate-600">Peak: ₹{maxSales.toLocaleString()}</span>
      </div>
    </div>
  );
};

export const OrderStatusDistribution: React.FC<{
  completed: number;
  active: number;
  cancelled: number;
}> = ({ completed, active, cancelled }) => {
  const total = Math.max(1, completed + active + cancelled);
  const compPct = Math.round((completed / total) * 100);
  const actPct = Math.round((active / total) * 100);
  const canPct = Math.round((cancelled / total) * 100);

  return (
    <div className="space-y-3">
      {/* Progress Multi-Bar */}
      <div className="h-3.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
        <div
          style={{ width: `${compPct}%` }}
          className="bg-emerald-500 h-full transition-all"
          title={`Completed: ${completed} (${compPct}%)`}
        />
        <div
          style={{ width: `${actPct}%` }}
          className="bg-amber-500 h-full transition-all"
          title={`Active: ${active} (${actPct}%)`}
        />
        <div
          style={{ width: `${canPct}%` }}
          className="bg-rose-500 h-full transition-all"
          title={`Cancelled: ${cancelled} (${canPct}%)`}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-600 font-medium">Completed: {completed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-slate-600 font-medium">Active: {active}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-slate-600 font-medium">Cancelled: {cancelled}</span>
        </div>
      </div>
    </div>
  );
};
