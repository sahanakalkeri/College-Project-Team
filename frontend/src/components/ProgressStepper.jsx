import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Lightbulb, CheckSquare, Award, Check } from 'lucide-react';

export default function ProgressStepper({ currentStep = 1, teamExists = false, isLeader = false }) {
  const steps = [
    { id: 1, name: 'Team', path: teamExists ? '/team' : '/teams/search', icon: Users },
    { id: 2, name: 'Members', path: '/team', icon: UserPlus },
    { id: 3, name: 'Topic', path: '/project/topic', icon: Lightbulb },
    { id: 4, name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { id: 5, name: 'Review', path: '/review', icon: Award }
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700/80 mb-6">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        <span className="uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">Team Workflow Stepper</span>
        <span>Stage {currentStep} of {steps.length}</span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connecting track line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0"></div>

        {steps.map((step) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon;

          return (
            <Link
              key={step.id}
              to={step.path}
              className={`relative z-10 flex flex-col items-center group transition-transform ${
                isCurrent ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-colors shadow-sm ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/60'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap text-center ${
                  isCurrent
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : isDone
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
