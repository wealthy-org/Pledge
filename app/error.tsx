'use client';

import React, { useEffect, useState } from 'react';
import { ErrorModal } from '@/components/modals/ErrorModal';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(true);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
      <ErrorModal
        isOpen={isOpen}
        title="Application Configuration / Runtime Error"
        errorMessage={error.message || 'An unexpected error occurred.'}
        errorCode={error.digest}
        actionHint="Please verify your environment configuration (.env.local) and network connection, then try again."
        onRetry={() => {
          reset();
        }}
        onClose={() => {
          setIsOpen(false);
        }}
      />
      {!isOpen && (
        <div className="space-y-4 rounded-2xl border border-red-500/20 bg-[var(--surface)] p-6 shadow-xl max-w-md w-full">
          <h2 className="text-lg font-bold text-red-500">Error Encountered</h2>
          <p className="text-xs text-[var(--muted)]">{error.message}</p>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              reset();
            }}
            className="rounded-lg bg-[var(--panel)] px-4 py-2 text-xs font-semibold text-[var(--text)] border border-[var(--line)]"
          >
            Re-open Error Details
          </button>
        </div>
      )}
    </div>
  );
}
