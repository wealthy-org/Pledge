import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { resolveNftImage, buildGenerativeResolvedImage } from '@/lib/nft-image';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const contract = searchParams.get('contract')?.trim();
  const tokenId = searchParams.get('tokenId')?.trim();
  const chainIdParam = searchParams.get('chainId')?.trim();
  const bypassCache = searchParams.get('bypassCache') === 'true';

  if (!contract || !isAddress(contract, { strict: false })) {
    return NextResponse.json(
      { error: 'Invalid or missing contract address' },
      { status: 400 }
    );
  }

  if (!tokenId) {
    return NextResponse.json(
      { error: 'Missing tokenId parameter' },
      { status: 400 }
    );
  }

  const chainId = chainIdParam ? Number(chainIdParam) : undefined;

  try {
    const resolved = await resolveNftImage(contract, tokenId, {
      chainId: isNaN(chainId as number) ? undefined : chainId,
      bypassCache,
    });

    return NextResponse.json({
      success: true,
      ...resolved,
    });
  } catch {
    const fallback = buildGenerativeResolvedImage(contract, tokenId);
    return NextResponse.json({
      success: true,
      ...fallback,
    });
  }
}
