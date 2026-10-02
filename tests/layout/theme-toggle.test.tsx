import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

describe('TICKET-59: ThemeToggle Component & Theme Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('renders theme toggle button with accessible aria-label', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to/i });
    expect(button).toBeDefined();
  });

  it('toggles theme between light and dark on click and updates localStorage and document attribute', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to/i });

    fireEvent.click(button);
    const updatedTheme = localStorage.getItem('pledge:theme');
    expect(updatedTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(button);
    expect(localStorage.getItem('pledge:theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('initializes from localStorage if preset', () => {
    localStorage.setItem('pledge:theme', 'dark');
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
