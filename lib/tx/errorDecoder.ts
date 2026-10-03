export interface DecodedTxError {
  message: string;
  code?: string;
  isUserRejection: boolean;
  isSilent: boolean;
  actionHint?: string;
}

export function decodeTxError(err: unknown): DecodedTxError {
  const rawMessage = err instanceof Error ? err.message : String(err || '');
  const lower = rawMessage.toLowerCase();

  const isUserRejection =
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('rejected the request') ||
    lower.includes('action rejected');

  if (isUserRejection) {
    return {
      message: 'Transaction rejected by user in wallet.',
      code: 'USER_REJECTED',
      isUserRejection: true,
      isSilent: true,
    };
  }

  if (rawMessage.includes('CollectionDisabled')) {
    return {
      message: 'This collection is currently disabled for new loan offers.',
      code: 'CollectionDisabled',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Please choose an active curated collection.',
    };
  }

  if (rawMessage.includes('CollectionNotAllowed')) {
    return {
      message: 'This collection is currently not allowed for new loan offers.',
      code: 'CollectionNotAllowed',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Please choose an active curated collection.',
    };
  }

  if (rawMessage.includes('OfferNotOpen')) {
    return {
      message: 'This offer is no longer open (it has been accepted or cancelled).',
      code: 'OfferNotOpen',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Please refresh the page to view updated offers.',
    };
  }

  if (rawMessage.includes('OfferExpired')) {
    return {
      message: 'This offer has expired.',
      code: 'OfferExpired',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Please browse current active offers.',
    };
  }

  if (rawMessage.includes('LoanOverdue')) {
    return {
      message: 'Loan is overdue. Repayment deadline has passed and collateral is subject to foreclosure.',
      code: 'LoanOverdue',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Review loan status or contact the counterparty.',
    };
  }

  if (rawMessage.includes('LoanNotOverdue')) {
    return {
      message: 'Loan has not reached its maturity deadline yet.',
      code: 'LoanNotOverdue',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Foreclosure is only possible after the repayment deadline.',
    };
  }

  if (rawMessage.includes('ExactRepaymentRequired') || rawMessage.includes('IncorrectPaymentAmount')) {
    return {
      message: 'Exact repayment amount (principal + interest in wei) is required.',
      code: 'ExactRepaymentRequired',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Ensure your transaction includes the exact amount due.',
    };
  }

  if (rawMessage.includes('NoClaimableBalance')) {
    return {
      message: 'No claimable balance available for withdrawal.',
      code: 'NoClaimableBalance',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Proceeds will appear once loans are repaid or offers are cancelled.',
    };
  }

  if (rawMessage.includes('NoClaimableProceeds')) {
    return {
      message: 'No claimable proceeds available for withdrawal.',
      code: 'NoClaimableProceeds',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Proceeds will appear once loans are repaid or offers are cancelled.',
    };
  }

  if (rawMessage.includes('Unauthorized')) {
    return {
      message: 'Unauthorized: You are not authorized to perform this action.',
      code: 'Unauthorized',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Switch to the authorized account address in your wallet.',
    };
  }

  if (rawMessage.includes('TokenAlreadyInCollateral')) {
    return {
      message: 'This NFT is already escrowed as collateral in an active loan.',
      code: 'TokenAlreadyInCollateral',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('NewActivityPausedError')) {
    return {
      message: 'New lending and borrowing activities are temporarily paused by governance.',
      code: 'NewActivityPausedError',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('InvalidAddress')) {
    return {
      message: 'Invalid address provided for destination or recipient.',
      code: 'InvalidAddress',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('TransferFailed')) {
    return {
      message: 'ETH transfer failed on execution.',
      code: 'TransferFailed',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('ZeroPrincipal') || rawMessage.includes('InvalidPrincipal')) {
    return {
      message: 'Loan principal amount must be greater than zero.',
      code: 'InvalidPrincipal',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (
    rawMessage.includes('DurationTooShort') ||
    rawMessage.includes('DurationTooLong') ||
    rawMessage.includes('InvalidDuration')
  ) {
    return {
      message: 'Loan duration is outside the permitted protocol range (7, 14, or 30 days).',
      code: 'InvalidDuration',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('InterestBpsTooHigh') || rawMessage.includes('InvalidInterestRate')) {
    return {
      message: 'Interest rate exceeds the protocol maximum limit.',
      code: 'InvalidInterestRate',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('ExpiryInPast') || rawMessage.includes('InvalidExpiration')) {
    return {
      message: 'Offer expiration time must be in the future.',
      code: 'InvalidExpiration',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (rawMessage.includes('LoanNotActive')) {
    return {
      message: 'Loan is not in active state.',
      code: 'LoanNotActive',
      isUserRejection: false,
      isSilent: false,
    };
  }

  if (
    lower.includes('insufficient funds') ||
    lower.includes('exceeds the balance') ||
    lower.includes('insufficient eth balance') ||
    lower.includes('insufficient balance')
  ) {
    return {
      message: 'Insufficient ETH balance for offer principal and gas fee.',
      code: 'INSUFFICIENT_FUNDS',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Add more ETH to your wallet on Robinhood Chain to cover the transaction value and network fees.',
    };
  }

  if (lower.includes('wallet not connected')) {
    return {
      message: 'Wallet not connected. Please connect your wallet to continue.',
      code: 'WALLET_NOT_CONNECTED',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Click Connect Wallet in the top right corner.',
    };
  }

  if (lower.includes('wallet client unavailable') || lower.includes('wallet client')) {
    return {
      message: 'Wallet client is unavailable. Please unlock your wallet extension.',
      code: 'WALLET_UNAVAILABLE',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Open your browser wallet extension and ensure it is unlocked.',
    };
  }

  if (lower.includes('chainmismatch') || lower.includes('chain mismatch') || lower.includes('does not match the target chain')) {
    return {
      message: 'Wallet is connected to the wrong network. Please switch to Robinhood Chain.',
      code: 'CHAIN_MISMATCH',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Switch your network in your wallet to Robinhood Chain.',
    };
  }

  if (lower.includes('rpctimeout') || lower.includes('timed out') || lower.includes('timeout') || lower.includes('longer than')) {
    return {
      message: 'RPC node connection timed out. Please try again.',
      code: 'RPC_TIMEOUT',
      isUserRejection: false,
      isSilent: false,
      actionHint: 'Check your internet connection and retry the transaction.',
    };
  }

  return {
    message: rawMessage || 'Transaction failed. Please try again.',
    code: 'UNKNOWN_ERROR',
    isUserRejection: false,
    isSilent: false,
  };
}
