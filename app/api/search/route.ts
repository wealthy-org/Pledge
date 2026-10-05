import { NextRequest } from 'next/server';
import { isAddress } from 'viem';
import { indexerStore } from '@/lib/indexer/store';
import { jsonResponse } from '@/lib/api/response';
import { fetchCuratedCollections, getCuratedCollections } from '@/config/collections';
import { gondiClient, extractGondiImageUrl } from '@/lib/gondi';

export interface SearchResultItem {
  type: 'collection' | 'wallet' | 'item';
  id: string;
  title: string;
  subtitle: string;
  url: string;
  badge?: string;
  image?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const chainId = parseInt(searchParams.get('chainId') || process.env.NEXT_PUBLIC_CHAIN_ID || '46630', 10);

  if (!q) {
    return jsonResponse({
      query: '',
      results: [],
      collections: [],
      wallets: [],
      items: [],
    });
  }

  const queryLower = q.toLowerCase();
  const collections: SearchResultItem[] = [];
  const wallets: SearchResultItem[] = [];
  const items: SearchResultItem[] = [];

  const [onChainCurated, gondiOverview, gondiList] = await Promise.all([
    fetchCuratedCollections(chainId).catch(() => []),
    gondiClient.getMarketOverviewData('DAY').catch(() => ({ top: [], volume: [], movers: [] })),
    gondiClient.listCollections(50).catch(() => []),
  ]);

  const known: Array<{ address: string; name: string; symbol: string; image?: string }> = [];
  for (const c of onChainCurated) {
    known.push({
      address: c.contractAddress,
      name: c.name,
      symbol: c.symbol,
    });
  }

  for (const c of getCuratedCollections(chainId)) {
    if (!known.some((k) => k.address.toLowerCase() === c.contractAddress.toLowerCase())) {
      known.push({
        address: c.contractAddress,
        name: c.name,
        symbol: c.symbol,
      });
    }
  }

  const allGondiCollections = [
    ...(gondiOverview.top || []).map((t) => t.collection),
    ...(gondiOverview.volume || []).map((v) => v.collection),
    ...(gondiOverview.movers || []).map((m) => m.collection),
    ...gondiList,
  ];

  for (const gc of allGondiCollections) {
    if (!gc) continue;
    const addr = gc.contractData?.contractAddress || gc.id;
    if (!addr) continue;
    if (!known.some((k) => k.address.toLowerCase() === addr.toLowerCase())) {
      known.push({
        address: addr,
        name: gc.name || 'Gondi Collection',
        symbol: gc.slug?.toUpperCase() || 'NFT',
        image: extractGondiImageUrl(gc.image) || undefined,
      });
    }
  }

  const matchedAddresses = new Set<string>();

  for (const c of known) {
    if (
      c.name.toLowerCase().includes(queryLower) ||
      c.symbol.toLowerCase().includes(queryLower) ||
      c.address.toLowerCase().includes(queryLower)
    ) {
      matchedAddresses.add(c.address.toLowerCase());
      collections.push({
        type: 'collection',
        id: c.address.toLowerCase(),
        title: c.name,
        subtitle: `${c.symbol} · ${c.address.slice(0, 6)}...${c.address.slice(-4)}`,
        url: `/collection/${c.address}`,
        badge: c.image ? 'Verified' : 'Curated',
        image: c.image,
      });
    }
  }

  for (const row of indexerStore.collections.values()) {
    if (!row.is_enabled) continue;
    if (matchedAddresses.has(row.address.toLowerCase())) continue;
    if (
      (row.name && row.name.toLowerCase().includes(queryLower)) ||
      (row.symbol && row.symbol.toLowerCase().includes(queryLower)) ||
      (row.address && row.address.toLowerCase().includes(queryLower))
    ) {
      matchedAddresses.add(row.address.toLowerCase());
      collections.push({
        type: 'collection',
        id: row.address.toLowerCase(),
        title: row.name || 'ERC-721 Collection',
        subtitle: `${row.symbol || 'NFT'} · ${row.address.slice(0, 6)}...${row.address.slice(-4)}`,
        url: `/collection/${row.address}`,
        badge: 'Verified',
      });
    }
  }

  const seenWallets = new Set<string>();

  if (isAddress(q)) {
    seenWallets.add(queryLower);
    wallets.push({
      type: 'wallet',
      id: queryLower,
      title: `${q.slice(0, 6)}...${q.slice(-4)}`,
      subtitle: 'Public Wallet Profile',
      url: `/profile/${q}`,
      badge: 'Address',
    });
  } else if (q.startsWith('0x') && q.length >= 4) {
    for (const l of indexerStore.loans.values()) {
      if (l.borrower.toLowerCase().includes(queryLower) && !seenWallets.has(l.borrower.toLowerCase())) {
        seenWallets.add(l.borrower.toLowerCase());
        wallets.push({
          type: 'wallet',
          id: l.borrower.toLowerCase(),
          title: `${l.borrower.slice(0, 6)}...${l.borrower.slice(-4)}`,
          subtitle: 'Active Protocol Borrower',
          url: `/profile/${l.borrower}`,
        });
      }
      if (l.lender.toLowerCase().includes(queryLower) && !seenWallets.has(l.lender.toLowerCase())) {
        seenWallets.add(l.lender.toLowerCase());
        wallets.push({
          type: 'wallet',
          id: l.lender.toLowerCase(),
          title: `${l.lender.slice(0, 6)}...${l.lender.slice(-4)}`,
          subtitle: 'Active Protocol Lender',
          url: `/profile/${l.lender}`,
        });
      }
    }
  }

  if (q.includes(':') || q.includes('#')) {
    const parts = q.includes(':') ? q.split(':') : q.split('#');
    const colPart = parts[0].trim();
    const tokenPart = parts[1]?.trim();

    if (tokenPart && /^\d+$/.test(tokenPart)) {
      let matchedCol = known.find(
        (c) =>
          c.address.toLowerCase() === colPart.toLowerCase() ||
          c.symbol.toLowerCase() === colPart.toLowerCase() ||
          c.name.toLowerCase().includes(colPart.toLowerCase())
      );

      if (!matchedCol && isAddress(colPart)) {
        matchedCol = {
          address: colPart,
          name: `Contract ${colPart.slice(0, 6)}...`,
          symbol: 'ERC721',
        };
      }

      if (matchedCol) {
        items.push({
          type: 'item',
          id: `${matchedCol.address.toLowerCase()}:${tokenPart}`,
          title: `${matchedCol.name} #${tokenPart}`,
          subtitle: `${matchedCol.symbol} Token Item`,
          url: `/item/${matchedCol.address}/${tokenPart}`,
          badge: 'Item',
        });
      }
    }
  } else if (/^\d+$/.test(q)) {
    for (const c of known.slice(0, 3)) {
      items.push({
        type: 'item',
        id: `${c.address.toLowerCase()}:${q}`,
        title: `${c.name} #${q}`,
        subtitle: `${c.symbol} Token Item`,
        url: `/item/${c.address}/${q}`,
        badge: 'Item',
      });
    }
  }

  const allResults = [...collections, ...wallets, ...items];

  return jsonResponse({
    query: q,
    results: allResults,
    collections,
    wallets,
    items,
  });
}
