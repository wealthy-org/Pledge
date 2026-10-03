'use client';

import React, { useState, useEffect } from 'react';
import type { TransactionStage } from '@/hooks/useTransactionFlow';
import { STAGE_ESTIMATES } from '@/lib/tx/stageEstimates';

export interface TransactionTimerProps {
  stage: TransactionStage;
  startedAt?: number | null;
  stageStartedAt?: number | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TransactionTimer({ stage, startedAt, stageStartedAt }: TransactionTimerProps) {
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [stageElapsed, setStageElapsed] = useState(0);

  useEffect(() => {
    if (stage === 'IDLE' || stage === 'SUCCESS' || stage === 'ERROR') {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      if (startedAt) {
        setTotalElapsed(Math.max(0, Math.floor((now - startedAt) / 1000)));
      }
      if (stageStartedAt) {
        setStageElapsed(Math.max(0, Math.floor((now - stageStartedAt) / 1000)));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, startedAt, stageStartedAt]);

  if (stage === 'IDLE' || stage === 'SUCCESS' || stage === 'ERROR') {
    return null;
  }

  const stageEstimate = STAGE_ESTIMATES[stage];
  const typicalSeconds = stageEstimate?.typicalSeconds || 15;
  const isTakingLonger = stageElapsed > typicalSeconds;
  const remainingEst = Math.max(1, typicalSeconds - stageElapsed);

  return (
    <div className="w-full rounded-xl bg-[var(--panel)] border border-[var(--line)] p-3 text-xs space-y-1.5 transition-all">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-[var(--muted)] font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span>Elapsed: {formatDuration(totalElapsed)}</span>
        </div>

        <div className="text-[11px] font-medium text-[var(--muted)]">
          {isTakingLonger ? (
            <span className="text-[var(--warning-text)] bg-[var(--warning-bg)] border border-[var(--warning-border)] px-2 py-0.5 rounded-md font-mono text-[10px]">
              Network congested · please wait
            </span>
          ) : (
            <span className="font-mono text-[var(--muted)]">
              Est. ~{remainingEst}s remaining
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--muted)]/70 text-left font-sans italic">
        Estimated confirmation duration · dependent on Robinhood Chain testnet sequencer
      </p>
    </div>
  );
}
