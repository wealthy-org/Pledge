'use client';

import { useState, useCallback } from 'react';
import { decodeTxError, type DecodedTxError } from '@/lib/tx/errorDecoder';

export type TransactionStage =
  | 'IDLE'
  | 'PREPARING'
  | 'SIMULATING'
  | 'PROMPTING'
  | 'PENDING'
  | 'CONFIRMING'
  | 'SUCCESS'
  | 'ERROR';

export interface TransactionState {
  stage: TransactionStage;
  txHash: `0x${string}` | null;
  error: string | null;
  errorCode?: string;
  actionHint?: string;
  isUserRejection: boolean;
  isSilent?: boolean;
  title: string | null;
  description: string | null;
}

export interface ExecuteTransactionParams {
  title: string;
  description?: string;
  prepare?: () => Promise<void>;
  simulate?: () => Promise<void>;
  write: () => Promise<`0x${string}`>;
  waitForReceipt?: (hash: `0x${string}`) => Promise<unknown>;
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (err: Error) => void;
}

const INITIAL_STATE: TransactionState = {
  stage: 'IDLE',
  txHash: null,
  error: null,
  errorCode: undefined,
  actionHint: undefined,
  isUserRejection: false,
  isSilent: false,
  title: null,
  description: null,
};

export function decodeTransactionError(err: unknown): DecodedTxError {
  return decodeTxError(err);
}

export function useTransactionFlow() {
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const executeTransaction = useCallback(
    async ({
      title,
      description,
      prepare,
      simulate,
      write,
      waitForReceipt,
      onSuccess,
      onError,
    }: ExecuteTransactionParams): Promise<`0x${string}` | null> => {
      try {
        setState({
          stage: 'PREPARING',
          txHash: null,
          error: null,
          errorCode: undefined,
          actionHint: undefined,
          isUserRejection: false,
          isSilent: false,
          title,
          description: description || null,
        });

        if (prepare) {
          await prepare();
        }

        if (simulate) {
          setState((prev) => ({ ...prev, stage: 'SIMULATING' }));
          await simulate();
        }

        setState((prev) => ({ ...prev, stage: 'PROMPTING' }));
        const hash = await write();

        setState((prev) => ({
          ...prev,
          stage: 'PENDING',
          txHash: hash,
        }));

        if (waitForReceipt) {
          setState((prev) => ({ ...prev, stage: 'CONFIRMING' }));
          await waitForReceipt(hash);
        }

        setState((prev) => ({
          ...prev,
          stage: 'SUCCESS',
          txHash: hash,
        }));

        if (onSuccess) {
          onSuccess(hash);
        }

        return hash;
      } catch (err: unknown) {
        const decoded = decodeTxError(err);
        const errorObj = err instanceof Error ? err : new Error(decoded.message);

        setState((prev) => ({
          ...prev,
          stage: 'ERROR',
          error: decoded.message,
          errorCode: decoded.code,
          actionHint: decoded.actionHint,
          isUserRejection: decoded.isUserRejection,
          isSilent: decoded.isSilent,
        }));

        if (onError) {
          onError(errorObj);
        }

        return null;
      }
    },
    []
  );

  return {
    state,
    executeTransaction,
    reset,
  };
}
