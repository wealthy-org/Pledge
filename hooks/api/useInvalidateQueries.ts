'use client';

import { useQueryClient } from '@tanstack/react-query';

export function useInvalidateProtocolQueries() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['collections'] }),
      queryClient.invalidateQueries({ queryKey: ['offers'] }),
      queryClient.invalidateQueries({ queryKey: ['loans'] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
      queryClient.invalidateQueries({ queryKey: ['activity'] }),
      queryClient.invalidateQueries({ queryKey: ['eligible-nfts'] }),
    ]);
  };

  const invalidateOffers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['offers'] });
    await queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  const invalidateLoans = async (loanId?: number | string) => {
    await queryClient.invalidateQueries({ queryKey: ['loans'] });
    if (loanId) {
      await queryClient.invalidateQueries({ queryKey: ['loans', loanId] });
    }
    await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
  };

  const invalidatePortfolio = async (address?: string) => {
    if (address) {
      await queryClient.invalidateQueries({ queryKey: ['portfolio', address] });
    } else {
      await queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    }
  };

  return {
    invalidateAll,
    invalidateOffers,
    invalidateLoans,
    invalidatePortfolio,
  };
}
