import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationProgressBar } from '@/components/layout/NavigationProgressBar';

describe('TICKET-65: NavigationProgressBar Component Test Suite', () => {
  it('renders top progress bar element with proper accessibility attributes', () => {
    render(<NavigationProgressBar isNavigating={true} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toBeDefined();
    expect(bar.getAttribute('aria-label')).toBe('Page navigation progress');
  });

  it('renders in inactive state when not navigating', () => {
    render(<NavigationProgressBar isNavigating={false} />);
    const bar = screen.getByRole('progressbar', { hidden: true });
    expect(bar.className).toContain('opacity-0');
  });
});
