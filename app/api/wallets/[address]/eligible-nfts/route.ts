import { NextRequest } from 'next/server';
import { gondiClient, extractGondiImageUrl } from '@/lib/gondi';
import { resolveCollectionImageUrl } from '@/lib/services/metadata';
import { formatShortAddress } from '@/lib/services/collectionSafety';
import { jsonResponse, errorResponse, validateAddress } from '@/lib/api/response';
import { WalletNftsResponse, WalletNftItem } from '@/types/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  if (!validateAddress(address)) {
    return errorResponse(
      `Invalid Ethereum address format: ${address}`,
      'INVALID_ADDRESS',
      400
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 100);
  const cursor = searchParams.get('cursor');
  const chainIdParam = searchParams.get('chainId');
  const chainId = chainIdParam ? parseInt(chainIdParam, 10) : undefined;

  let nfts: WalletNftItem[] = [];

  try {
    const { getProtocolSnapshot } = await import('@/lib/protocol/snapshot');
    const snapshot = await getProtocolSnapshot(chainId);

    const list = await gondiClient.listNfts(limit);
    for (const node of list) {
      const contractAddress = (node.collection?.contractData?.contractAddress || node.collection?.id || '').toLowerCase();
      if (!contractAddress) {
        continue;
      }

      const isCollateral = snapshot.loans.some(
        (l) =>
          l.status === 'active' &&
          l.collection.toLowerCase() === contractAddress &&
          String(l.tokenId) === String(node.tokenId)
      );
      if (isCollateral) {
        continue;
      }

      const collectionName = node.collection?.name || formatShortAddress(contractAddress);
      const name = node.name || `${collectionName} #${node.tokenId}`;
      const imageUrl = extractGondiImageUrl(node.image) || resolveCollectionImageUrl(contractAddress, collectionName);

      nfts.push({
        contractAddress,
        tokenId: node.tokenId,
        collectionName,
        name,
        imageUrl,
        tokenUri: '',
      });
    }
  } catch {
    nfts = [];
  }

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const paginated = cursor ? nfts : nfts.slice(startIndex, startIndex + limit);
  const nextCursor = !cursor && startIndex + limit < nfts.length ? (startIndex + limit).toString() : null;

  const response: WalletNftsResponse = {
    nfts: paginated,
    nextCursor,
    total: nfts.length,
  };

  return jsonResponse(response);
}
