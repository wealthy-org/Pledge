import React from 'react';
import Link from 'next/link';
import { fetchLoanDetail } from '@/lib/db/queries';
import { LoanDetailClient } from './LoanDetailClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export interface LoanPageProps {
  params: Promise<{ id: string }>;
}

export default async function LoanDetailPage({ params }: LoanPageProps) {
  const { id } = await params;
  const loanIdNumber = parseInt(id, 10);

  const detail = await fetchLoanDetail(loanIdNumber);

  if (!detail || !detail.loan) {
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

  const { loan } = detail;
  const collectionName = loan.nftMetadata?.collectionName || 'Verified Collection';
  const imageUrl = loan.nftMetadata?.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

  return (
    <LoanDetailClient
      loan={loan}
      collectionName={collectionName}
      imageUrl={imageUrl}
    />
  );
}
