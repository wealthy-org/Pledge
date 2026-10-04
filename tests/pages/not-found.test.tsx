import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

describe('NotFound Page Component', () => {
  it('renders 404 badge, heading, and description', () => {
    render(<NotFound />);

    expect(screen.getByText(/404 · Page Not Found/i)).toBeDefined();
    expect(screen.getByText(/Lost in the liquidity matrix/i)).toBeDefined();
    expect(
      screen.getByText(/The page, collection address, or loan contract you are trying to reach/i)
    ).toBeDefined();
  });

  it('renders primary navigation links to markets and explore', () => {
    render(<NotFound />);

    const marketsLink = screen.getByRole('link', { name: /Back to Markets/i });
    expect(marketsLink.getAttribute('href')).toBe('/');

    const exploreLink = screen.getByRole('link', { name: /Explore Collections/i });
    expect(exploreLink.getAttribute('href')).toBe('/explore');

    const returnLink = screen.getByRole('link', { name: /Return to App/i });
    expect(returnLink.getAttribute('href')).toBe('/');
  });

  it('renders clean minimal full-width container', () => {
    const { container } = render(<NotFound />);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('min-h-screen');
    expect(rootDiv.className).toContain('w-full');
  });
});
