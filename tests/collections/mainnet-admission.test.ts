import { describe, it, expect } from 'vitest';
import { getMainnetCollectionByAddress } from '@/config/collections.mainnet';

describe('TICKET-19b: Mainnet Collection Admission Technical Audit Suite', () => {
  it('TS-01: getMainnetCollectionByAddress returns null for unknown address safely', () => {
    const unwhitelisted = getMainnetCollectionByAddress('0x000000000000000000000000000000000000dead');
    expect(unwhitelisted).toBeNull();
  });

  it('TS-02: Returns null for empty address', () => {
    const empty = getMainnetCollectionByAddress('');
    expect(empty).toBeNull();
  });
});
