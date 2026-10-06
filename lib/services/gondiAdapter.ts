import { GondiOfferNode, GondiLoanNode } from '@/types/gondi';
import { OfferItem, LoanItem } from '@/types/api';
import { OfferStatus, LoanStatus } from '@/types/database';

function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function parseTimestampToSeconds(val?: string | number | null): number {
  if (!val) return Math.floor(Date.now() / 1000);
  if (typeof val === 'number') {
    return val > 1e11 ? Math.floor(val / 1000) : Math.floor(val);
  }
  const num = Number(val);
  if (!isNaN(num) && num > 0) {
    return num > 1e11 ? Math.floor(num / 1000) : Math.floor(num);
  }
  const parsed = Date.parse(val);
  if (!isNaN(parsed)) {
    return Math.floor(parsed / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

export function convertGondiOfferToItem(
  gondiOffer: GondiOfferNode,
  chainId: number = 46630,
  fallbackCollection?: string
): OfferItem {
  const numericId = typeof gondiOffer.offerId === 'number'
    ? gondiOffer.offerId
    : parseInt(String(gondiOffer.offerId || ''), 10) || hashStringToNumber(gondiOffer.id);
  const durSec = parseInt(String(gondiOffer.duration || '2592000'), 10) || 2592000;
  const rawApr = parseInt(String(gondiOffer.aprBps || '1000'), 10) || 1000;
  const termBps = Math.max(50, Math.round((rawApr * durSec) / (365 * 86400)));
  const expSec = parseTimestampToSeconds(gondiOffer.expirationTime) || (Math.floor(Date.now() / 1000) + 86400 * 30);
  const expDate = new Date(expSec * 1000).toISOString();

  let status: OfferStatus = 'open';
  const rawStatus = (gondiOffer.status || '').toLowerCase();
  if (rawStatus.includes('executed') || rawStatus.includes('filled')) {
    status = 'filled';
  } else if (rawStatus.includes('expired') || rawStatus.includes('cancelled')) {
    status = 'cancelled';
  } else if (rawStatus.includes('active') || rawStatus.includes('open')) {
    status = 'open';
  }

  const colAddress = (
    gondiOffer.collateralAddress ||
    gondiOffer.contractAddress ||
    fallbackCollection ||
    '0x0000000000000000000000000000000000000000'
  ).toLowerCase();

  return {
    offerId: numericId,
    chainId,
    lender: gondiOffer.lenderAddress || '0x0000000000000000000000000000000000000000',
    collection: colAddress,
    principalWei: gondiOffer.principalAmount || '1000000000000000000',
    termInterestBps: termBps,
    feeBpsSnapshot: parseInt(String(gondiOffer.fee || '0'), 10) || 150,
    durationSeconds: durSec,
    expiresAt: expDate,
    status,
    blockNumber: 128000000,
    txHash: '0x' + gondiOffer.id.replace(/[^a-fA-F0-9]/g, '').padEnd(64, '0').slice(0, 64),
    createdAt: new Date().toISOString(),
  };
}

export function convertGondiLoanToItem(
  gondiLoan: GondiLoanNode,
  chainId: number = 46630,
  fallbackCollection?: string
): LoanItem {
  const numericId = typeof gondiLoan.loanId === 'number'
    ? gondiLoan.loanId
    : parseInt(String(gondiLoan.loanId || ''), 10) || hashStringToNumber(gondiLoan.id);
  const offerId = gondiLoan.offerIds && gondiLoan.offerIds.length > 0
    ? parseInt(String(gondiLoan.offerIds[0]), 10) || hashStringToNumber(gondiLoan.offerIds[0])
    : numericId;
  const durSec = parseInt(String(gondiLoan.duration || '2592000'), 10) || 2592000;
  const startedAtSec = gondiLoan.startTime
    ? parseTimestampToSeconds(gondiLoan.startTime)
    : Math.floor(Date.now() / 1000) - 86400 * 5;
  const startedAt = new Date(startedAtSec * 1000).toISOString();
  const dueAt = new Date((startedAtSec + durSec) * 1000).toISOString();

  let status: LoanStatus = 'active';
  const rawStatus = (gondiLoan.status || '').toLowerCase();
  if (rawStatus === 'loan_repaid' || rawStatus === 'repaid') {
    status = 'repaid';
  } else if (rawStatus === 'loan_foreclosed' || rawStatus === 'foreclosed') {
    status = 'foreclosed';
  } else if (rawStatus === 'loan_initiated' || rawStatus === 'active') {
    status = 'active';
  }

  const feeVal = gondiLoan.protocolFee ? BigInt(gondiLoan.protocolFee) : 150n;
  const principalWei = (feeVal > 1000n ? feeVal * 50n : 1000000000000000000n).toString();
  const interestWei = (BigInt(principalWei) * 1000n / 10000n).toString();

  const colAddress = (
    fallbackCollection ||
    gondiLoan.address ||
    '0x0000000000000000000000000000000000000000'
  ).toLowerCase();

  return {
    loanId: numericId,
    offerId,
    chainId,
    lender: '0x' + (gondiLoan.id.split('.')[1] || '0000000000000000000000000000000000000000').slice(0, 42),
    borrower: gondiLoan.borrowerAddress || '0x0000000000000000000000000000000000000000',
    collection: colAddress,
    tokenId: '1',
    principalWei,
    interestWei,
    feeBpsSnapshot: Number(feeVal > 10000n ? 150 : feeVal),
    startedAt,
    dueAt,
    status,
    blockNumber: 128000000,
    txHash: '0x' + gondiLoan.id.replace(/[^a-fA-F0-9]/g, '').padEnd(64, '0').slice(0, 64),
  };
}
