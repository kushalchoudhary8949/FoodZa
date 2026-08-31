import React from 'react';
import { OrderStatus } from '../../types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  id,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-md',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-full',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-400',
    purple: 'bg-purple-500',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; id?: string }> = ({ status, id }) => {
  switch (status) {
    case 'Delivered':
      return (
        <Badge id={id} variant="success" dot>
          Delivered
        </Badge>
      );
    case 'Out for Delivery':
      return (
        <Badge id={id} variant="purple" dot>
          Out for Delivery
        </Badge>
      );
    case 'Picked Up':
    case 'Delivery Assigned':
      return (
        <Badge id={id} variant="info" dot>
          {status}
        </Badge>
      );
    case 'Ready for Pickup':
    case 'Preparing':
      return (
        <Badge id={id} variant="warning" dot>
          {status}
        </Badge>
      );
    case 'Waiting for Manager':
    case 'Waiting for Delivery Partner':
      return (
        <Badge id={id} variant="neutral" dot>
          {status}
        </Badge>
      );
    case 'Waiting for Admin':
    case 'Manager Timeout':
      return (
        <Badge id={id} variant="danger" dot className="animate-pulse font-bold">
          ⚠️ {status}
        </Badge>
      );
    case 'Admin Accepted':
    case 'Manager Accepted':
      return (
        <Badge id={id} variant="info" dot>
          {status}
        </Badge>
      );
    case 'Admin Rejected':
    case 'Manager Rejected':
    case 'Cancelled':
      return (
        <Badge id={id} variant="danger" dot>
          {status}
        </Badge>
      );
    default:
      return <Badge id={id}>{status}</Badge>;
  }
};

export const VegNonVegBadge: React.FC<{ isVeg: boolean; id?: string }> = ({ isVeg, id }) => {
  return (
    <span
      id={id}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center w-4 h-4 rounded-xs border shrink-0 ${
        isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}
      />
    </span>
  );
};
