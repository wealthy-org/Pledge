export type TransactionStageKey =
  | 'IDLE'
  | 'PREPARING'
  | 'SIMULATING'
  | 'PROMPTING'
  | 'PENDING'
  | 'CONFIRMING'
  | 'SUCCESS'
  | 'ERROR';

export interface StageEstimate {
  stage: TransactionStageKey;
  label: string;
  stepNumber: number;
  totalSteps: number;
  typicalSeconds: number;
  description: string;
}

export const STAGE_ESTIMATES: Record<TransactionStageKey, StageEstimate> = {
  IDLE: {
    stage: 'IDLE',
    label: 'Ready',
    stepNumber: 0,
    totalSteps: 4,
    typicalSeconds: 0,
    description: 'Ready to submit transaction',
  },
  PREPARING: {
    stage: 'PREPARING',
    label: 'Validating',
    stepNumber: 1,
    totalSteps: 4,
    typicalSeconds: 2,
    description: 'Validating balance and contract permissions...',
  },
  SIMULATING: {
    stage: 'SIMULATING',
    label: 'Simulating',
    stepNumber: 2,
    totalSteps: 4,
    typicalSeconds: 3,
    description: 'Simulating transaction execution against smart contracts...',
  },
  PROMPTING: {
    stage: 'PROMPTING',
    label: 'Wallet Prompt',
    stepNumber: 3,
    totalSteps: 4,
    typicalSeconds: 15,
    description: 'Please confirm and sign the transaction in your wallet...',
  },
  PENDING: {
    stage: 'PENDING',
    label: 'Broadcasting',
    stepNumber: 4,
    totalSteps: 4,
    typicalSeconds: 5,
    description: 'Transaction submitted to mempool. Awaiting inclusion...',
  },
  CONFIRMING: {
    stage: 'CONFIRMING',
    label: 'Confirming',
    stepNumber: 4,
    totalSteps: 4,
    typicalSeconds: 20,
    description: 'Confirming block receipt on Robinhood Chain...',
  },
  SUCCESS: {
    stage: 'SUCCESS',
    label: 'Confirmed',
    stepNumber: 4,
    totalSteps: 4,
    typicalSeconds: 0,
    description: 'Transaction confirmed successfully on-chain!',
  },
  ERROR: {
    stage: 'ERROR',
    label: 'Failed',
    stepNumber: 0,
    totalSteps: 4,
    typicalSeconds: 0,
    description: 'Transaction encountered an error.',
  },
};
