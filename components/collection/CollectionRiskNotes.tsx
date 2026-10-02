'use client';

import React from 'react';

export interface CollectionRiskNotesProps {
  notes?: string;
  collectionName: string;
}

export function CollectionRiskNotes({
  notes,
  collectionName,
}: CollectionRiskNotesProps) {
  if (!notes || notes.trim() === '') {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200/50 bg-amber-500/5 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 font-mono">
          Curated Risk Assessment — {collectionName}
        </h3>
        <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
          Curated
        </span>
      </div>
      <p className="text-xs leading-relaxed text-amber-950/80 dark:text-amber-100/80 font-sans">
        {notes}
      </p>
    </div>
  );
}
