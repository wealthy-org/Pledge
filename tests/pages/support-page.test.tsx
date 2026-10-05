import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SupportPage from '@/app/support/page';

describe('SupportPage Component', () => {
  it('renders page header and introductory text', () => {
    render(<SupportPage />);
    expect(screen.getByRole('heading', { level: 1, name: /How can we help you\?/i })).toBeDefined();
    expect(screen.getByText(/Everything you need to know about peer-to-peer NFT backed lending/i)).toBeDefined();
  });

  it('renders protocol security pillars cards', () => {
    render(<SupportPage />);
    expect(screen.getByText(/Atomic Escrow/i)).toBeDefined();
    expect(screen.getByText(/Zero Oracle Risk/i)).toBeDefined();
    expect(screen.getByText(/Pull-Payment Safety/i)).toBeDefined();
  });

  it('filters FAQ items when category buttons are clicked', () => {
    render(<SupportPage />);
    expect(screen.getByText(/How does escrow work when I accept a borrow offer\?/i)).toBeDefined();

    const feesButton = screen.getByRole('button', { name: /^Fees$/i });
    fireEvent.click(feesButton);

    expect(screen.getByText(/What is the protocol fee and how is it calculated\?/i)).toBeDefined();
    expect(screen.queryByText(/How does escrow work when I accept a borrow offer\?/i)).toBeNull();
  });

  it('toggles FAQ item open state when clicked', () => {
    render(<SupportPage />);
    const questionButton = screen.getByRole('button', { name: /How does escrow work when I accept a borrow offer\?/i });
    expect(questionButton.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(questionButton);
    expect(questionButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(questionButton);
    expect(questionButton.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders official community links', () => {
    render(<SupportPage />);
    expect(screen.getByText(/Discord Community/i)).toBeDefined();
    expect(screen.getByText(/Twitter \/ X Updates/i)).toBeDefined();
    expect(screen.getByText(/Live Protocol Activity/i)).toBeDefined();
  });
});
