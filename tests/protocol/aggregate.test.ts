import { describe, it, expect } from 'vitest';
import {
  computeCollectionStats,
  computeMarketStats,
  filterSnapshotOffers,
  filterSnapshotLoans,
  getDistinctCollectionsFromSnapshot,
} from '@/lib/protocol/aggregate';
import { ProtocolSnapshot } from '@/lib/protocol/types';

describe('Protocol Aggregation Pure Functions Suite', () => {
  const mockSnapshot: ProtocolSnapshot = {
    chainId: 46630,
    contractAddress: '0x481F5591D7B26661B651Ab2efB66c10c46958E33',
    blockNumber: 120000,
    protocolFeeBps: 200,
    newActivityPaused: false,
    offers: [
      {
        offerId: 1,
        lender: '0x1111111111111111111111111111111111111111',
        collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
        principalWei: '1000000000000000000',
        termInterestBps: 400,
        durationSeconds: 604800,
        expiresAt: '2026-10-15T00:00:00Z',
        feeBpsSnapshot: 200,
        status: 'open',
        isExpired: false,
      },
      {
        offerId: 2,
        lender: '0x2222222222222222222222222222222222222222',
        collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
        principalWei: '2500000000000000000',
        termInterestBps: 500,
        durationSeconds: 604800,
        expiresAt: '2026-10-15T00:00:00Z',
        feeBpsSnapshot: 200,
        status: 'open',
        isExpired: false,
      },
      {
        offerId: 3,
        lender: '0x1111111111111111111111111111111111111111',
        collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
        principalWei: '5000000000000000000',
        termInterestBps: 500,
        durationSeconds: 604800,
        expiresAt: '2026-09-01T00:00:00Z',
        feeBpsSnapshot: 200,
        status: 'open',
        isExpired: true,
      },
    ],
    loans: [
      {
        loanId: 1,
        offerId: 10,
        lender: '0x1111111111111111111111111111111111111111',
        borrower: '0x3333333333333333333333333333333333333333',
        collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
        tokenId: '42',
        principalWei: '1000000000000000000',
        interestWei: '40000000000000000',
        feeBpsSnapshot: 200,
        startedAt: '2026-10-01T00:00:00Z',
        dueAt: '2026-10-08T00:00:00Z',
        status: 'active',
        isOverdue: false,
      },
    ],
    enabledCollections: ['0xe80385cf259c82359cf5ea4ea98cd6514d9257a9'],
    fetchedAt: Date.now(),
  };

  it('correctly aggregates collection stats excluding expired offers', () => {
    const stats = computeCollectionStats(mockSnapshot, '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9');
    expect(stats.bestOfferWei).toBe('2500000000000000000');
    expect(stats.poolSizeWei).toBe('3500000000000000000');
    expect(stats.offerCount).toBe(2);
    expect(stats.activeLoansCount).toBe(1);
    expect(stats.volumeWei).toBe('1000000000000000000');
  });

  it('correctly aggregates global market stats excluding expired offers', () => {
    const market = computeMarketStats(mockSnapshot);
    expect(market.totalPoolSizeWei).toBe('3500000000000000000');
    expect(market.totalActiveLoansCount).toBe(1);
    expect(market.totalVolumeWei).toBe('1000000000000000000');
    expect(market.totalOffersCount).toBe(2);
  });

  it('filters and sorts snapshot offers correctly', () => {
    const sorted = filterSnapshotOffers(mockSnapshot, {
      collection: '0xe80385cf259c82359cf5ea4ea98cd6514d9257a9',
      status: 'open',
      sort: 'principal',
    });
    expect(sorted.length).toBe(2);
    expect(sorted[0].principalWei).toBe('2500000000000000000');
    expect(sorted[1].principalWei).toBe('1000000000000000000');
  });

  it('extracts distinct collections from snapshot', () => {
    const cols = getDistinctCollectionsFromSnapshot(mockSnapshot);
    expect(cols).toContain('0xe80385cf259c82359cf5ea4ea98cd6514d9257a9');
    expect(cols.length).toBe(1);
  });
});
