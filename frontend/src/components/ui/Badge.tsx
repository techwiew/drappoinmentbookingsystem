import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'slate';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-800 text-white border-slate-700',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    slate: 'bg-emerald-400',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
    lg: 'text-sm px-3 py-1 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border tracking-tight select-none',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md'; className?: string }> = ({ status, size = 'md', className }) => {
  switch (status) {
    case 'IN_CONSULTATION':
      return <Badge variant="primary" size={size} dot className={className}>In Consultation</Badge>;
    case 'WAITING':
      return <Badge variant="warning" size={size} dot className={className}>Waiting</Badge>;
    case 'CHECKED_IN':
      return <Badge variant="info" size={size} className={className}>Checked In</Badge>;
    case 'BOOKED':
      return <Badge variant="default" size={size} className={className}>Booked</Badge>;
    case 'COMPLETED':
      return <Badge variant="success" size={size} className={className}>Completed</Badge>;
    case 'SKIPPED':
      return <Badge variant="purple" size={size} className={className}>Skipped</Badge>;
    case 'NO_SHOW':
      return <Badge variant="danger" size={size} className={className}>No Show</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger" size={size} className={className}>Cancelled</Badge>;
    case 'PAID':
      return <Badge variant="success" size={size} className={className}>Paid</Badge>;
    case 'PENDING':
      return <Badge variant="warning" size={size} className={className}>Pending</Badge>;
    case 'PARTIALLY_PAID':
      return <Badge variant="purple" size={size} className={className}>Partial</Badge>;
    case 'ACTIVE':
      return <Badge variant="success" size={size} dot className={className}>Active</Badge>;
    case 'SUSPENDED':
      return <Badge variant="danger" size={size} className={className}>Suspended</Badge>;
    case 'TRIAL':
      return <Badge variant="info" size={size} className={className}>Trial</Badge>;
    default:
      return <Badge variant="default" size={size} className={className}>{status}</Badge>;
  }
};
