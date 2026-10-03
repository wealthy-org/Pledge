'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { useConnection, useBalance } from 'wagmi';
import { useSafeChainId } from '@/hooks/useSafeChainId';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { verifyErc721OnChain, formatShortAddress } from '@/lib/services/collectionSafety';

export interface CreateOfferFormData {
  collectionAddress: string;
  principalWei: string;
  termInterestBps: number;
  durationSeconds: number;
  expirySeconds: number;
}

export interface CreateOfferCollectionOption {
  id: string;
  name: string;
  symbol: string;
  contractAddress?: string;
  addresses?: Record<number, `0x${string}`>;
}

export interface CreateOfferDrawerProps {
  isOpen: boolean;
  collections: readonly CreateOfferCollectionOption[];
  initialCollectionId?: string;
  initialCollectionAddress?: string;
  onClose: () => void;
  onSubmit: (data: CreateOfferFormData) => void;
  isLoading?: boolean;
  isConnected?: boolean;
  onConnect?: () => void;
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
  initialCollectionAddress,
  onClose,
  onSubmit,
  isLoading = false,
  isConnected = true,
  onConnect,
}: CreateOfferDrawerProps) {
  const chainId = useSafeChainId();
  const { address } = useConnection();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId,
  });

  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [customVerificationStatus, setCustomVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const [principalInput, setPrincipalInput] = useState('0.01');
  const [interestRateInput, setInterestRateInput] = useState('5.0');
  const [durationSeconds, setDurationSeconds] = useState(7 * 86400);
  const [expirySeconds, setExpirySeconds] = useState(3 * 86400);

  useEffect(() => {
    if (initialCollectionAddress && isAddress(initialCollectionAddress)) {
      const match = collections.find(
        (c) =>
          c.contractAddress?.toLowerCase() === initialCollectionAddress.toLowerCase() ||
          (c.addresses && Object.values(c.addresses).some((a) => a.toLowerCase() === initialCollectionAddress.toLowerCase()))
      );
      if (match) {
        setSelectedCollectionId(match.id);
        setMode('catalog');
      } else {
        setCustomAddress(initialCollectionAddress);
        setMode('custom');
      }
    }
  }, [initialCollectionAddress, collections]);

  useEffect(() => {
    let active = true;
    if (mode === 'custom' && customAddress.trim().length === 42 && isAddress(customAddress.trim())) {
      setIsVerifying(true);
      setCustomVerificationStatus('idle');
      verifyErc721OnChain(customAddress.trim(), chainId)
        .then((valid) => {
          if (!active) return;
          setIsVerifying(false);
          setCustomVerificationStatus(valid ? 'valid' : 'invalid');
        })
        .catch(() => {
          if (!active) return;
          setIsVerifying(false);
          setCustomVerificationStatus('invalid');
        });
    } else if (mode === 'custom') {
      setIsVerifying(false);
      setCustomVerificationStatus('idle');
    }
    return () => {
      active = false;
    };
  }, [mode, customAddress, chainId]);

  const effectiveCollectionId = selectedCollectionId || initialCollectionId || collections[0]?.id || '';

  const selectedCol = useMemo(() => {
    return (
      collections.find((c) => c.id === effectiveCollectionId) ||
      collections[0] ||
      null
    );
  }, [collections, effectiveCollectionId]);

  const targetAddress = useMemo(() => {
    if (mode === 'custom') {
      return customAddress.trim();
    }
    if (!selectedCol) return '';
    if (selectedCol.contractAddress) return selectedCol.contractAddress;
    if (selectedCol.addresses) {
      return selectedCol.addresses[chainId] || Object.values(selectedCol.addresses)[0] || '';
    }
    return '';
  }, [mode, customAddress, selectedCol, chainId]);

  const isAddressValid = useMemo(() => {
    if (mode === 'catalog') return Boolean(targetAddress && isAddress(targetAddress));
    return Boolean(isAddress(targetAddress) && customVerificationStatus === 'valid');
  }, [mode, targetAddress, customVerificationStatus]);

  const preview = useMemo(() => {
    try {
      const cleanPrincipal = principalInput.replace(',', '.').trim();
      const cleanInterest = interestRateInput.replace(',', '.').trim();
      const pNum = parseFloat(cleanPrincipal) || 0;
      const rNum = parseFloat(cleanInterest) || 0;

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

      const pWei = parseUnits(cleanPrincipal || '0', 18);
      const bps = Math.round(rNum * 100);
      const interestWei = (pWei * BigInt(bps) + 9999n) / 10000n;
      const feeWei = (interestWei * 200n) / 10000n;
      const netPayoutWei = pWei + interestWei - feeWei;

      return {
        principalEth: Number(formatUnits(pWei, 18)).toFixed(3),
        interestEth: Number(formatUnits(interestWei, 18)).toFixed(3),
        feeEth: Number(formatUnits(feeWei, 18)).toFixed(4),
        netPayoutEth: Number(formatUnits(netPayoutWei, 18)).toFixed(3),
        isValid: isAddressValid,
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
  }, [principalInput, interestRateInput, isAddressValid]);

  const userBalanceEth = balanceData ? Number(formatUnits(balanceData.value, 18)) : 0;
  const isBalanceInsufficient = Boolean(
    balanceData &&
      preview.isValid &&
      preview.principalWei !== '0' &&
      BigInt(preview.principalWei) > balanceData.value
  );
  const isTightForGas = Boolean(
    balanceData &&
      preview.isValid &&
      !isBalanceInsufficient &&
      balanceData.value - BigInt(preview.principalWei) < parseUnits('0.0005', 18)
  );

  const handleSetMax = () => {
    if (!balanceData) return;
    const gasReserve = parseUnits('0.001', 18);
    const maxSafeWei = balanceData.value > gasReserve ? balanceData.value - gasReserve : balanceData.value;
    if (maxSafeWei > 0n) {
      setPrincipalInput(Number(formatUnits(maxSafeWei, 18)).toFixed(4));
    } else {
      setPrincipalInput(Number(formatUnits(balanceData.value, 18)).toFixed(4));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview.isValid || !targetAddress || isBalanceInsufficient) return;

    onSubmit({
      collectionAddress: targetAddress,
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text)]">
              Target Collection
            </label>
            <div className="flex items-center gap-1 bg-[var(--panel)] p-0.5 rounded-lg border border-[var(--line)]">
              <button
                type="button"
                onClick={() => setMode('catalog')}
                className={`text-[10px] font-medium py-1 px-2 rounded-md transition-colors cursor-pointer ${
                  mode === 'catalog'
                    ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Catalog
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`text-[10px] font-medium py-1 px-2 rounded-md transition-colors cursor-pointer ${
                  mode === 'custom'
                    ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                Custom ERC-721
              </button>
            </div>
          </div>

          {mode === 'catalog' ? (
            <div className="space-y-1.5">
              <select
                id="collection-select"
                value={effectiveCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] text-xs font-medium text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] transition-all cursor-pointer"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.symbol})
                  </option>
                ))}
              </select>
              {targetAddress && (
                <div className="text-[10px] font-mono text-[var(--muted)] px-1">
                  Contract: {formatShortAddress(targetAddress)}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="custom-collection-address"
                label="ERC-721 Contract Address"
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                required
              />

              {isVerifying && (
                <div className="text-[11px] text-sky-600 dark:text-sky-400 font-mono flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  Verifying ERC-721 interface (0x80ac58cd) on-chain...
                </div>
              )}

              {!isVerifying && customVerificationStatus === 'valid' && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>Verified ERC-721 Compliant Contract</span>
                </div>
              )}

              {!isVerifying && customVerificationStatus === 'invalid' && customAddress.length === 42 && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <span className="font-bold text-rose-600">✕</span>
                  <span>Contract does not implement ERC-721 or does not exist on this chain.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="lend-principal" className="text-xs font-semibold text-[var(--text)]">
                Principal
              </label>
              {balanceData && (
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[10px] text-[var(--primary)] hover:underline font-mono cursor-pointer"
                >
                  Bal: {Number(formatUnits(balanceData.value, 18)).toFixed(4)} ETH (Max)
                </button>
              )}
            </div>
            <Input
              id="lend-principal"
              type="text"
              inputMode="decimal"
              value={principalInput}
              onChange={(e) => setPrincipalInput(e.target.value)}
              suffix="ETH"
              placeholder="0.01"
              required
            />
            {isBalanceInsufficient && (
              <span className="text-[10px] text-[var(--error)] font-medium">
                Insufficient balance ({userBalanceEth.toFixed(4)} ETH available)
              </span>
            )}
            {!isBalanceInsufficient && isTightForGas && (
              <span className="text-[10px] text-amber-500 font-medium">
                Tip: Leave ~0.001 ETH for gas
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="lend-interest" className="text-xs font-semibold text-[var(--text)]">
              Term Interest
            </label>
            <Input
              id="lend-interest"
              type="text"
              inputMode="decimal"
              value={interestRateInput}
              onChange={(e) => setInterestRateInput(e.target.value)}
              suffix="%"
              helperText={`${parseFloat(interestRateInput.replace(',', '.') || '0').toFixed(1)}% for ${selectedDays}d`}
              placeholder="5.0"
              required
            />
          </div>
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
              <span className="text-[var(--muted)]">Protocol Fee (2% of interest)</span>
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

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs leading-relaxed space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4m0-4h.01" />
            </svg>
            <span>Permissionless Market Disclosure</span>
          </div>
          <p>
            Fund recovery depends on borrower repayment; if the borrower defaults, you will claim the collateral NFT. Pledge is an open protocol, verify the contract address before depositing capital.
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

          {!isConnected ? (
            <Button
              type="button"
              variant="primary"
              onClick={onConnect}
              className="flex-2"
            >
              Connect Wallet to Publish
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={!preview.isValid || isBalanceInsufficient}
              className="flex-2"
            >
              {isBalanceInsufficient ? 'Insufficient ETH Balance' : 'Deposit & Publish Offer'}
            </Button>
          )}
        </div>
      </form>
    </Drawer>
  );
}
