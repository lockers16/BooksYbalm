/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  icon: string | React.ReactNode;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
  iconColor?: string;
}

export function MetricCard({
  id,
  title,
  value,
  icon,
  subtitle,
  bgColor = 'bg-white',
  textColor = 'text-slate-900',
  iconColor = 'text-blue-600',
}: MetricCardProps) {
  return (
    <div
      id={id}
      className={`${bgColor} p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between transition-all hover:shadow-md`}
    >
      <div className="space-y-1 text-right">
        <span className="text-xs font-semibold text-slate-500 tracking-wider block">
          {title}
        </span>
        <div className={`text-3xl font-black ${textColor} tracking-tight`}>
          {value}
        </div>
        {subtitle && (
          <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center ${iconColor}`}>
        {typeof icon === 'string' ? (
          <span className="text-2xl font-bold">{icon}</span>
        ) : (
          icon
        )}
      </div>
    </div>
  );
}
