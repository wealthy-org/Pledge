export type AnalyticsEventName =
  | 'page_view'
  | 'wallet_connect'
  | 'wallet_disconnect'
  | 'create_offer_click'
  | 'create_offer_submitted'
  | 'accept_offer_click'
  | 'accept_offer_submitted'
  | 'repay_click'
  | 'repay_submitted'
  | 'foreclose_click'
  | 'foreclose_submitted'
  | 'cancel_offer_click'
  | 'withdraw_proceeds_click'
  | 'search_performed'
  | 'collection_viewed'
  | 'item_viewed'
  | 'theme_changed';

export interface AnalyticsPayload {
  chainId?: number;
  walletAddress?: string;
  collectionAddress?: string;
  tokenId?: string;
  loanId?: string;
  offerId?: string;
  valueEth?: string;
  metadata?: Record<string, unknown>;
}

export function trackEvent(eventName: AnalyticsEventName, payload?: AnalyticsPayload): void {
  if (!eventName || typeof eventName !== 'string') {
    throw new Error('Analytics: eventName is required and must be a string');
  }

  if (typeof window === 'undefined') {
    return;
  }

  const timestamp = new Date().toISOString();
  const fullPayload = {
    event: eventName,
    timestamp,
    ...payload,
  };

  const win = window as unknown as {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: string, event: string, params: Record<string, unknown>) => void;
  };

  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push(fullPayload);
  }

  if (typeof win.gtag === 'function') {
    win.gtag('event', eventName, fullPayload);
  }
}
