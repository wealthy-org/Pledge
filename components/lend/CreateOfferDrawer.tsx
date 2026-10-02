'use client';

import React, { useState, useMemo } from 'react';
import { parseUnits, formatUnits } from 'viem';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { CuratedCollectionDefinition } from '@/config/collections';

export interface CreateOfferFormData {
  collectionAddress: string;
  principalWei: string;
  termInterestBps: number;
  durationSeconds: number;
  expirySeconds: number;
}

export interface CreateOfferDrawerProps {
  isOpen: boolean;
  collections: readonly CuratedCollectionDefinition[];
  initialCollectionId?: string;
  onClose: () => void;
  onSubmit: (data: CreateOfferFormData) => void;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [
  { label: '7 Days', value: 7 * 86400, days: 7 },
  { label: '14 Days', value: 14 * 86400, days: 14 },
  { label: '30 Days', value: 30 * 86400, days: 30 },
];

const EXPIRY_OPTIONS = [
  { label: '1 Day', value: 1 * 86400 },
  { label: '3 Days', value: 3 * 86400 },
  { label: '7 Days', value: 7 * 86400 },
];

export function CreateOfferDrawer({
  isOpen,
  collections,
  initialCollectionId,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateOfferDrawerProps) {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [principalInput, setPrincipalInput] = useState('1.0');
  const [interestRateInput, setInterestRateInput] = useState('5.0');
  const [durationSeconds, setDurationSeconds] = useState(7 * 86400);
  const [expirySeconds, setExpirySeconds] = useState(3 * 86400);

  const effectiveCollectionId = selectedCollectionId || initialCollectionId || collections[0]?.id || '';

  const selectedCol = useMemo(() => {
    return (
      collections.find((c) => c.id === effectiveCollectionId) ||
      collections[0] ||
      null
    );
  }, [collections, effectiveCollectionId]);

  const preview = useMemo(() => {
    try {
      const pNum = parseFloat(principalInput) || 0;
      const rNum = parseFloat(interestRateInput) || 0;

      if (pNum <= 0 || rNum <= 0) {
        return {
          principalEth: '0.000',
          interestEth: '0.000',
          feeEth: '0.000',
          netPayoutEth: '0.000',
          isValid: false,
          principalWei: '0',
          termInterestBps: 0,
        };
      }

      const pWei = parseUnits(principalInput || '0', 18);
      const bps = Math.round(rNum * 100);
      const interestWei = (pWei * BigInt(bps) + 9999n) / 10000n;
      const feeWei = (interestWei * 200n) / 10000n;
      const netPayoutWei = pWei + interestWei - feeWei;

      return {
        principalEth: Number(formatUnits(pWei, 18)).toFixed(3),
        interestEth: Number(formatUnits(interestWei, 18)).toFixed(3),
        feeEth: Number(formatUnits(feeWei, 18)).toFixed(4),
        netPayoutEth: Number(formatUnits(netPayoutWei, 18)).toFixed(3),
        isValid: true,
        principalWei: pWei.toString(),
        termInterestBps: bps,
      };
    } catch {
      return {
        principalEth: '0.000',
        interestEth: '0.000',
        feeEth: '0.000',
        netPayoutEth: '0.000',
        isValid: false,
        principalWei: '0',
        termInterestBps: 0,
      };
    }
  }, [principalInput, interestRateInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview.isValid || !selectedCol) return;

    onSubmit({
      collectionAddress: selectedCol.addresses[46630],
      principalWei: preview.principalWei,
      termInterestBps: preview.termInterestBps,
      durationSeconds,
      expirySeconds,
    });
  };

  const selectedDays = durationSeconds / 86400;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Lending Offer"
      width="470px"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text)] block">
            Target Collection
          </label>
          <select
            value={effectiveCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-medium text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] transition-all cursor-pointer"
          >
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.symbol}) — Floor {col.floorPriceEth} ETH
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="lend-principal"
            label="Principal (ETH)"
            type="number"
            step="0.01"
            min="0.01"
            value={principalInput}
            onChange={(e) => setPrincipalInput(e.target.value)}
            suffix="ETH"
            placeholder="1.0"
            required
          />

          <Input
            id="lend-interest"
            label="Term Interest (%)"
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            value={interestRateInput}
            onChange={(e) => setInterestRateInput(e.target.value)}
            suffix="%"
            helperText={`${parseFloat(interestRateInput || '0').toFixed(1)}% for ${selectedDays}d`}
            placeholder="5.0"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text)] block">
            Loan Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = durationSeconds === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationSeconds(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] border-[var(--line)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text)] block">
            Offer Expiration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EXPIRY_OPTIONS.map((opt) => {
              const isSelected = expirySeconds === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpirySeconds(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)] shadow-xs font-semibold'
                      : 'bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] border-[var(--line)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--muted)]">
            Financial Terms Preview
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Capital Commitment</span>
              <span className="font-mono font-bold text-sm text-[var(--text)]">
                {preview.principalEth} ETH
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Expected Gross Interest</span>
              <span className="font-mono font-semibold text-[var(--primary)]">
                {preview.interestEth} ETH
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--muted)]">Protocol Fee (2.0% of interest)</span>
              <span className="font-mono text-[var(--muted)]">
                {preview.feeEth} ETH
              </span>
            </div>

            <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">Net Payout if Repaid</span>
              <span className="font-mono font-extrabold text-base text-[var(--primary)]">
                {preview.netPayoutEth} ETH
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
            <span>ℹ️</span>
            <span>Collateral Security Disclosure</span>
          </div>
          <p>
            Pengembalian dana bergantung pada pelunasan peminjam; jika peminjam gagal bayar, Anda berhak menyita NFT kolateral.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!preview.isValid}
            className="flex-2"
          >
            Deposit & Publish Offer
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
