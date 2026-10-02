import React from 'react';
import Link from 'next/link';
import { MOCK_LOANS, MOCK_WALLET_NFTS } from '@/lib/mock/fixtures';
import { getCollectionByAddress } from '@/config/collections';
import { TESTNET_CHAIN_ID } from '@/config/chains';
import { LoanDetailClient } from './LoanDetailClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export interface LoanPageProps {
  params: Promise<{ id: string }>;
}

export default async function LoanDetailPage({ params }: LoanPageProps) {
  const { id } = await params;
  const loanIdNumber = parseInt(id, 10);

  const loan = MOCK_LOANS.find((l) => l.loanId === loanIdNumber);

  if (!loan) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <EmptyState
          title="Loan Not Found"
          description="The requested loan ID does not exist or has not been recorded on Robinhood Chain."
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

  const collectionDef = getCollectionByAddress(loan.collection, TESTNET_CHAIN_ID);
  const collectionName = collectionDef?.name || 'Verified Collection';

  const walletNft = MOCK_WALLET_NFTS.find(
    (n) =>
      n.contractAddress.toLowerCase() === loan.collection.toLowerCase() &&
      n.tokenId === loan.tokenId
  );

  const imageUrl =
    walletNft?.imageUrl ||
    collectionDef?.imageUrl ||
    'https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

  return (
    <LoanDetailClient
      loan={loan}
      collectionName={collectionName}
      imageUrl={imageUrl}
    />
  );
}
