import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NftImage } from '@/components/nft/NftImage';

describe('NftImage Component', () => {
  const contract = '0x20d53e329144A328ad2B8005BB7Eaa88D6BCA16c';
  const tokenId = '9124';

  it('renders standard image when valid src is provided', () => {
    render(
      <NftImage
        src="https://example.com/nft.png"
        alt="Robinhood Silver"
        contractAddress={contract}
        tokenId={tokenId}
      />
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('https://example.com/nft.png');
    expect(img.getAttribute('alt')).toBe('Robinhood Silver');
  });

  it('renders generative fallback SVG when src is missing or empty', () => {
    render(
      <NftImage
        src=""
        alt="Fallback Asset"
        contractAddress={contract}
        tokenId={tokenId}
      />
    );

    const img = screen.getByRole('img');
    const src = img.getAttribute('src') || '';
    expect(src.startsWith('data:image/svg+xml;utf8,')).toBe(true);
  });

  it('switches to generative fallback on image load error', () => {
    const onErrorSpy = vi.fn();
    render(
      <NftImage
        src="https://broken-gateway.com/unreachable.png"
        alt="Broken Asset"
        contractAddress={contract}
        tokenId={tokenId}
        onError={onErrorSpy}
      />
    );

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('https://broken-gateway.com/unreachable.png');

    fireEvent.error(img);

    const fallbackSrc = img.getAttribute('src') || '';
    expect(fallbackSrc.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(onErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('toggles skeleton loading state on image load event', () => {
    render(
      <NftImage
        src="https://example.com/photo.png"
        alt="Loading Asset"
        contractAddress={contract}
        tokenId={tokenId}
      />
    );

    expect(screen.getByTestId('nft-image-skeleton')).toBeDefined();

    const img = screen.getByRole('img');
    fireEvent.load(img);

    expect(screen.queryByTestId('nft-image-skeleton')).toBeNull();
  });

  it('displays generative badge when showBadge is enabled and image is fallback', () => {
    render(
      <NftImage
        src=""
        alt="Fallback Asset"
        contractAddress={contract}
        tokenId={tokenId}
        showBadge={true}
      />
    );

    expect(screen.getByText('Generative')).toBeDefined();
  });
});
