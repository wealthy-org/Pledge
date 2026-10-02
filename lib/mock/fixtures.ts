import { TESTNET_CHAIN_ID } from '@/config/chains';
import { OfferItem, LoanItem, ActivityItem, CollectionStatsResponse, MarketStatsResponse, WalletNftItem } from '@/types/api';

export const MOCK_OFFERS: OfferItem[] = [
  {
    offerId: 1,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x1111111111111111111111111111111111111111',
    principalWei: '1500000000000000000',
    termInterestBps: 500,
    feeBpsSnapshot: 200,
    durationSeconds: 604800,
    expiresAt: '2026-10-15T00:00:00Z',
    status: 'open',
    blockNumber: 100,
    txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    createdAt: '2026-10-01T12:00:00Z',
  },
  {
    offerId: 2,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x1111111111111111111111111111111111111111',
    principalWei: '2000000000000000000',
    termInterestBps: 700,
    feeBpsSnapshot: 200,
    durationSeconds: 1209600,
    expiresAt: '2026-10-20T00:00:00Z',
    status: 'open',
    blockNumber: 105,
    txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    createdAt: '2026-10-01T13:00:00Z',
  },
  {
    offerId: 3,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x9999999999999999999999999999999999999999',
    collection: '0x2222222222222222222222222222222222222222',
    principalWei: '750000000000000000',
    termInterestBps: 300,
    feeBpsSnapshot: 200,
    durationSeconds: 604800,
    expiresAt: '2026-10-12T00:00:00Z',
    status: 'open',
    blockNumber: 110,
    txHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    createdAt: '2026-10-01T14:00:00Z',
  },
  {
    offerId: 4,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    collection: '0x1111111111111111111111111111111111111111',
    principalWei: '1000000000000000000',
    termInterestBps: 400,
    feeBpsSnapshot: 200,
    durationSeconds: 604800,
    expiresAt: '2026-09-01T00:00:00Z',
    status: 'filled',
    blockNumber: 90,
    txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    offerId: 5,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x8888888888888888888888888888888888888888',
    collection: '0x3333333333333333333333333333333333333333',
    principalWei: '500000000000000000',
    termInterestBps: 250,
    feeBpsSnapshot: 200,
    durationSeconds: 2592000,
    expiresAt: '2026-09-15T00:00:00Z',
    status: 'cancelled',
    blockNumber: 95,
    txHash: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    createdAt: '2026-09-02T11:00:00Z',
  },
];

export const MOCK_LOANS: LoanItem[] = [
  {
    loanId: 1,
    offerId: 4,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
    collection: '0x1111111111111111111111111111111111111111',
    tokenId: '42',
    principalWei: '1000000000000000000',
    interestWei: '40000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '2026-10-01T10:00:00Z',
    dueAt: '2026-10-08T10:00:00Z',
    status: 'active',
    blockNumber: 90,
    txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  },
  {
    loanId: 2,
    offerId: 6,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
    borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
    collection: '0x2222222222222222222222222222222222222222',
    tokenId: '101',
    principalWei: '500000000000000000',
    interestWei: '15000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '2026-09-10T10:00:00Z',
    dueAt: '2026-09-17T10:00:00Z',
    status: 'repaid',
    blockNumber: 70,
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
  },
  {
    loanId: 3,
    offerId: 7,
    chainId: TESTNET_CHAIN_ID,
    lender: '0x7777777777777777777777777777777777777777',
    borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
    collection: '0x3333333333333333333333333333333333333333',
    tokenId: '7',
    principalWei: '400000000000000000',
    interestWei: '12000000000000000',
    feeBpsSnapshot: 200,
    startedAt: '2026-08-01T10:00:00Z',
    dueAt: '2026-08-08T10:00:00Z',
    status: 'foreclosed',
    blockNumber: 50,
    txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
  },
];

export const MOCK_WALLET_NFTS: WalletNftItem[] = [
  {
    contractAddress: '0x1111111111111111111111111111111111111111',
    tokenId: '1',
    collectionName: 'Robinhood Genesis Pass',
    name: 'Robinhood Genesis Pass #1',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    tokenUri: 'ipfs://bafybeihrhgpass/1',
  },
  {
    contractAddress: '0x1111111111111111111111111111111111111111',
    tokenId: '2',
    collectionName: 'Robinhood Genesis Pass',
    name: 'Robinhood Genesis Pass #2',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    tokenUri: 'ipfs://bafybeihrhgpass/2',
  },
  {
    contractAddress: '0x2222222222222222222222222222222222222222',
    tokenId: '10',
    collectionName: 'Sherwood Forest Rangers',
    name: 'Sherwood Ranger #10',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    tokenUri: 'ipfs://bafybeishrfpass/10',
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 1,
    eventType: 'OfferCreated',
    contractAddress: '0x1111111111111111111111111111111111111111',
    blockNumber: 105,
    txHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    timestamp: '2026-10-01T13:00:00Z',
    data: {
      offerId: 2,
      lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
      principalWei: '2000000000000000000',
      termInterestBps: 700,
      durationSeconds: 1209600,
    },
  },
  {
    id: 2,
    eventType: 'OfferCreated',
    contractAddress: '0x1111111111111111111111111111111111111111',
    blockNumber: 100,
    txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    timestamp: '2026-10-01T12:00:00Z',
    data: {
      offerId: 1,
      lender: '0x02070747E2436d46f56A691F605A7c03332DFe8d',
      principalWei: '1500000000000000000',
      termInterestBps: 500,
      durationSeconds: 604800,
    },
  },
  {
    id: 3,
    eventType: 'LoanStarted',
    contractAddress: '0x1111111111111111111111111111111111111111',
    blockNumber: 90,
    txHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    timestamp: '2026-10-01T10:00:00Z',
    data: {
      loanId: 1,
      offerId: 4,
      borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
      tokenId: '42',
      principalWei: '1000000000000000000',
    },
  },
  {
    id: 4,
    eventType: 'LoanRepaid',
    contractAddress: '0x2222222222222222222222222222222222222222',
    blockNumber: 70,
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    timestamp: '2026-09-17T10:00:00Z',
    data: {
      loanId: 2,
      borrower: '0xfB5870428d00B1a18274737609825b74c8C12e2B',
      repaymentAmountWei: '515000000000000000',
    },
  },
];

export function getMockCollectionStats(collectionAddress: string): CollectionStatsResponse {
  const target = collectionAddress.toLowerCase();
  const openOffers = MOCK_OFFERS.filter(
    (o) => o.collection.toLowerCase() === target && o.status === 'open'
  );

  let bestOfferBigInt = 0n;
  let poolSizeBigInt = 0n;

  for (const offer of openOffers) {
    const val = BigInt(offer.principalWei);
    poolSizeBigInt += val;
    if (val > bestOfferBigInt) {
      bestOfferBigInt = val;
    }
  }

  const activeLoans = MOCK_LOANS.filter(
    (l) => l.collection.toLowerCase() === target && l.status === 'active'
  );

  return {
    bestOfferWei: bestOfferBigInt > 0n ? bestOfferBigInt.toString() : null,
    poolSizeWei: poolSizeBigInt.toString(),
    offerCount: openOffers.length,
    activeLoansCount: activeLoans.length,
    lastIndexedBlock: 120,
  };
}

export function getMockMarketStats(): MarketStatsResponse {
  let totalPoolSize = 0n;
  let totalVolume = 0n;

  for (const offer of MOCK_OFFERS) {
    if (offer.status === 'open') {
      totalPoolSize += BigInt(offer.principalWei);
    }
  }

  for (const loan of MOCK_LOANS) {
    totalVolume += BigInt(loan.principalWei);
  }

  const activeLoans = MOCK_LOANS.filter((l) => l.status === 'active');
  const openOffers = MOCK_OFFERS.filter((o) => o.status === 'open');

  return {
    totalPoolSizeWei: totalPoolSize.toString(),
    totalActiveLoansCount: activeLoans.length,
    totalVolumeWei: totalVolume.toString(),
    totalOffersCount: openOffers.length,
  };
}
