'use client';

import React from 'react';
import type { TransactionStage } from '@/hooks/useTransactionFlow';

export interface TransactionStepperProps {
  stage: TransactionStage;
}

interface StepItem {
  id: string;
  name: string;
  description: string;
  stages: TransactionStage[];
}

const STEPS: StepItem[] = [
  {
    id: 'prepare',
    name: 'Validation',
    description: 'Verify balances & parameters',
    stages: ['PREPARING'],
  },
  {
    id: 'simulate',
    name: 'Simulation',
    description: 'Dry-run contract execution',
    stages: ['SIMULATING'],
  },
  {
    id: 'prompt',
    name: 'Signature',
    description: 'Confirm in wallet extension',
    stages: ['PROMPTING'],
  },
  {
    id: 'confirm',
    name: 'Mempool & Block',
    description: 'On-chain block inclusion',
    stages: ['PENDING', 'CONFIRMING'],
  },
];

function getStepStatus(stepIndex: number, currentStage: TransactionStage): 'completed' | 'active' | 'pending' | 'error' {
  if (currentStage === 'SUCCESS') return 'completed';
  if (currentStage === 'ERROR') {
    return 'pending';
  }

  const stageOrder: TransactionStage[] = ['PREPARING', 'SIMULATING', 'PROMPTING', 'PENDING', 'CONFIRMING'];
  const stageStepMap: Record<TransactionStage, number> = {
    IDLE: -1,
    PREPARING: 0,
    SIMULATING: 1,
    PROMPTING: 2,
    PENDING: 3,
    CONFIRMING: 3,
    SUCCESS: 4,
    ERROR: -1,
  };

  const currentStepIndex = stageStepMap[currentStage] ?? -1;

  if (stepIndex < currentStepIndex) return 'completed';
  if (stepIndex === currentStepIndex) return 'active';
  return 'pending';
}

export function TransactionStepper({ stage }: TransactionStepperProps) {
  if (stage === 'IDLE') return null;

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-[var(--line)] z-0" />

        {STEPS.map((step, idx) => {
          const status = getStepStatus(idx, stage);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : isActive
                    ? 'bg-white dark:bg-[#111a17] text-[var(--primary)] border-2 border-[var(--primary)] ring-4 ring-[var(--primary-soft)]'
                    : 'bg-white dark:bg-[#111a17] text-[var(--muted)] border border-[var(--line)]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <span
                className={`mt-1.5 text-[10px] font-medium tracking-tight text-center ${
                  isActive
                    ? 'text-[var(--primary)] font-semibold'
                    : isCompleted
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)]'
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
