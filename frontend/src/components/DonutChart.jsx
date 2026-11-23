import React from 'react';

export default function DonutChart({
  pending = 0,
  inProgress = 0,
  completed = 0,
  size = 140,
  strokeWidth = 14
}) {
  const total = pending + inProgress + completed;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-3 text-center">
        <div
          className="rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium"
          style={{ width: size, height: size }}
        >
          No tasks
        </div>
      </div>
    );
  }

  const pDone = completed / total;
  const pProg = inProgress / total;
  const pPend = pending / total;

  const strokeDone = pDone * circumference;
  const strokeProg = pProg * circumference;
  const strokePend = pPend * circumference;

  const offsetDone = 0;
  const offsetProg = -strokeDone;
  const offsetPend = -(strokeDone + strokeProg);

  const completionPercent = Math.round(pDone * 100);

  return (
    <div className="flex items-center gap-6">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Completed (Emerald) */}
          {completed > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDone} ${circumference}`}
              strokeDashoffset={offsetDone}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          )}
          {/* In Progress (Indigo) */}
          {inProgress > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#6366f1"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeProg} ${circumference}`}
              strokeDashoffset={offsetProg}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          )}
          {/* Pending (Amber) */}
          {pending > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokePend} ${circumference}`}
              strokeDashoffset={offsetPend}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {completionPercent}%
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Done</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Completed: {completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">In Progress: {inProgress}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Pending: {pending}</span>
        </div>
      </div>
    </div>
  );
}
