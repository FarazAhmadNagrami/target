import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 ${className}`}>
      {title && <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'default';
  icon?: React.ReactNode;
}

const colorMap = {
  green: 'text-emerald-600 dark:text-emerald-400',
  red: 'text-red-500 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  yellow: 'text-amber-500 dark:text-amber-400',
  default: 'text-gray-800 dark:text-gray-100',
};

export function MetricCard({ label, value, sub, color = 'default', icon }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
      </div>
      <span className={`text-xl font-bold ${colorMap[color]}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
    </div>
  );
}
