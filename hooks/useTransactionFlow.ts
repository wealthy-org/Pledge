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

export interface TransactionDetailItem {
  label: string;
  value: string;
}

export interface TransactionState {
  stage: TransactionStage;
  stageStartedAt?: number | null;
  startedAt?: number | null;
  txHash: `0x${string}` | null;
  error: string | null;
  errorCode?: string;
  actionHint?: string;
  isUserRejection: boolean;
  isSilent?: boolean;
  title: string | null;
  description: string | null;
  details?: TransactionDetailItem[];
  timeoutSeconds?: number;
}

export interface ExecuteTransactionParams {
  title: string;
  description?: string;
  details?: TransactionDetailItem[];
  prepare?: () => Promise<void>;
  simulate?: () => Promise<void>;
  write: () => Promise<`0x${string}`>;
  waitForReceipt?: (hash: `0x${string}`) => Promise<unknown>;
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (err: Error) => void;
  promptTimeoutMs?: number;
  receiptTimeoutMs?: number;
}

const INITIAL_STATE: TransactionState = {
  stage: 'IDLE',
  stageStartedAt: null,
  startedAt: null,
  txHash: null,
  error: null,
  errorCode: undefined,
  actionHint: undefined,
  isUserRejection: false,
  isSilent: false,
  title: null,
  description: null,
  details: undefined,
  timeoutSeconds: undefined,
};

export function decodeTransactionError(err: unknown): DecodedTxError {
  return decodeTxError(err);
}

function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMsg: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(timeoutMsg);
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export function useTransactionFlow() {
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const reportFailure = useCallback((err: unknown, title?: string, description?: string) => {
    console.error('[TransactionFlow Failure]:', err);
    const decoded = decodeTxError(err);
    const now = Date.now();
    setState({
      stage: 'ERROR',
      stageStartedAt: now,
      startedAt: now,
      txHash: null,
      error: decoded.message,
      errorCode: decoded.code,
      actionHint: decoded.actionHint,
      isUserRejection: decoded.isUserRejection,
      isSilent: decoded.isSilent,
      title: title || 'Transaction Failed',
      description: description || null,
      details: undefined,
    });
  }, []);

  const executeTransaction = useCallback(
    async ({
      title,
      description,
      details,
      prepare,
      simulate,
      write,
      waitForReceipt,
      onSuccess,
      onError,
      promptTimeoutMs = 120000,
      receiptTimeoutMs = 45000,
    }: ExecuteTransactionParams): Promise<`0x${string}` | null> => {
      const now = Date.now();
      let capturedHash: `0x${string}` | null = null;

      try {
        setState({
          stage: 'PREPARING',
          stageStartedAt: now,
          startedAt: now,
          txHash: null,
          error: null,
          errorCode: undefined,
          actionHint: undefined,
          isUserRejection: false,
          isSilent: false,
          title,
          description: description || null,
          details,
          timeoutSeconds: Math.round(promptTimeoutMs / 1000),
        });

        if (prepare) {
          await prepare();
        }

        if (simulate) {
          setState((prev) => ({
            ...prev,
            stage: 'SIMULATING',
            stageStartedAt: Date.now(),
          }));
          await simulate();
        }

        setState((prev) => ({
          ...prev,
          stage: 'PROMPTING',
          stageStartedAt: Date.now(),
          timeoutSeconds: Math.round(promptTimeoutMs / 1000),
        }));

        const hash = await runWithTimeout(
          write(),
          promptTimeoutMs,
          'Wallet signature request timed out. Please check your wallet extension or try again.'
        );

        capturedHash = hash;

        setState((prev) => ({
          ...prev,
          stage: 'PENDING',
          stageStartedAt: Date.now(),
          txHash: hash,
          timeoutSeconds: Math.round(receiptTimeoutMs / 1000),
        }));

        if (waitForReceipt) {
          setState((prev) => ({
            ...prev,
            stage: 'CONFIRMING',
            stageStartedAt: Date.now(),
            timeoutSeconds: Math.round(receiptTimeoutMs / 1000),
          }));

          try {
            await runWithTimeout(
              waitForReceipt(hash),
              receiptTimeoutMs,
              'Block confirmation timed out on Robinhood Chain.'
            );
          } catch (receiptErr: unknown) {
            console.error('[TransactionFlow Receipt Error]:', receiptErr);
            const isTimeout =
              receiptErr instanceof Error &&
              (receiptErr.name === 'TimeoutError' || receiptErr.message.includes('timed out'));

            if (isTimeout) {
              setState((prev) => ({
                ...prev,
                stage: 'ERROR',
                stageStartedAt: Date.now(),
                txHash: hash,
                error: 'Block confirmation timed out. The transaction was broadcasted to the network and may still be confirmed.',
                errorCode: 'RECEIPT_TIMEOUT',
                actionHint: 'Please check your transaction hash on the block explorer before retrying to avoid duplicate submissions.',
                isUserRejection: false,
              }));

              if (onError) {
                onError(receiptErr instanceof Error ? receiptErr : new Error('RECEIPT_TIMEOUT'));
              }
              return null;
            }
            throw receiptErr;
          }
        }

        setState((prev) => ({
          ...prev,
          stage: 'SUCCESS',
          stageStartedAt: Date.now(),
          txHash: hash,
          timeoutSeconds: undefined,
        }));

        if (onSuccess) {
          onSuccess(hash);
        }

        return hash;
      } catch (err: unknown) {
        console.error('[TransactionFlow Error]:', err);
        const decoded = decodeTxError(err);
        const errorObj = err instanceof Error ? err : new Error(decoded.message);

        setState((prev) => ({
          ...prev,
          stage: 'ERROR',
          stageStartedAt: Date.now(),
          txHash: capturedHash,
          error: decoded.message,
          errorCode: decoded.code,
          actionHint: decoded.actionHint,
          isUserRejection: decoded.isUserRejection,
          isSilent: decoded.isSilent,
          timeoutSeconds: undefined,
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
    reportFailure,
    reset,
  };
}
