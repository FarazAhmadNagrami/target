import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

export function Input({ label, prefix, suffix, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
      )}
      <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {prefix && (
          <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-600">
            {prefix}
          </span>
        )}
        <input
          {...props}
          className={`flex-1 px-3 py-2 text-sm bg-transparent text-gray-800 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500 ${className}`}
        />
        {suffix && (
          <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-600 border-l border-gray-200 dark:border-gray-600">
            {suffix}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
      )}
      <select
        {...props}
        className={`px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RadioGroupProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function RadioGroup({ label, value, onChange, options }: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>}
      <div className="flex gap-3 flex-wrap">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
              value === opt.value
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300 font-medium'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'
            }`}
          >
            <input
              type="radio"
              className="hidden"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
