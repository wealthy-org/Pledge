import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletDropdownMenu } from '@/components/web3/WalletDropdownMenu';

describe('TICKET-61: WalletDropdownMenu Component Test Suite', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';
  const mockDisconnect = vi.fn();
  const mockClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders dropdown menu with address and action items when open', () => {
    render(
      <WalletDropdownMenu
        isOpen={true}
        onClose={mockClose}
        address={mockAddress}
        chainId={46630}
        onDisconnect={mockDisconnect}
      />
    );

    expect(screen.getByText(/0x1234\.\.\.7890/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /copy address/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /view on explorer/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /my portfolio/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDefined();
  });

  it('copies full address to clipboard on click', async () => {
    render(
      <WalletDropdownMenu
        isOpen={true}
        onClose={mockClose}
        address={mockAddress}
        chainId={46630}
        onDisconnect={mockDisconnect}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /copy address/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAddress);
  });

  it('formats Blockscout explorer link correctly based on chainId', () => {
    render(
      <WalletDropdownMenu
        isOpen={true}
        onClose={mockClose}
        address={mockAddress}
        chainId={46630}
        onDisconnect={mockDisconnect}
      />
    );

    const explorerLink = screen.getByRole('link', { name: /view on explorer/i });
    expect(explorerLink.getAttribute('href')).toContain(mockAddress);
    expect(explorerLink.getAttribute('target')).toBe('_blank');
  });

  it('calls onDisconnect when disconnect button is clicked', () => {
    render(
      <WalletDropdownMenu
        isOpen={true}
        onClose={mockClose}
        address={mockAddress}
        chainId={46630}
        onDisconnect={mockDisconnect}
      />
    );

    const disconnectBtn = screen.getByRole('button', { name: /disconnect/i });
    fireEvent.click(disconnectBtn);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
