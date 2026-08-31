import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  onClick?: () => void;
  id?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = 'bg-amber-50 text-amber-600',
  onClick,
  id,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-amber-400 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
