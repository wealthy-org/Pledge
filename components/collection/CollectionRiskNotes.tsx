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
        <span className="text-amber-600 font-bold text-sm">⚠️</span>
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
