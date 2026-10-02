import React from 'react';
import Link from 'next/link';
import { getCollectionByAddress } from '@/config/collections';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { CollectionDetailClient } from './CollectionDetailClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export interface CollectionPageProps {
  params: Promise<{ address: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { address } = await params;
  const collection = getCollectionByAddress(address, TESTNET_CHAIN_ID);

  if (!collection) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <EmptyState
          title="Collection Not Found"
          description="The requested NFT collection is not supported or does not exist on Robinhood Chain."
        />
        <div className="flex justify-center">
          <Link href="/">
            <Button variant="primary" size="md">
              Back to Markets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <CollectionDetailClient collection={collection} />;
}
