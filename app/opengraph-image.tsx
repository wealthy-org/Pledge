import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pledge - NFT Lending Marketplace';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#090a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            P
          </div>
          <span style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            PLEDGE
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              maxWidth: '960px',
            }}
          >
            Peer-to-Peer NFT Liquidity Marketplace
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              lineHeight: 1.4,
              maxWidth: '850px',
            }}
          >
            Borrow ETH at fixed rates on Robinhood Chain with atomic settlement and zero liquidation risk.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Robinhood Chain
          </div>
          <div
            style={{
              padding: '10px 22px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Fixed Term Loans
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
