import React from 'react';
import { ItemDetailClient } from './ItemDetailClient';

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ collection: string; tokenId: string }>;
}) {
  const { collection, tokenId } = await params;
  return <ItemDetailClient collection={collection} tokenId={tokenId} />;
}
