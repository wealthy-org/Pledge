import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '@/components/common/Tooltip';

describe('TICKET-71: Accessible Tooltip System Test Suite', () => {
  it('renders trigger and shows tooltip on hover', () => {
    render(
      <Tooltip content="Max Loan to Value ratio">
        <button type="button">Info</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Info' });
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(tooltip.textContent).toContain('Max Loan to Value ratio');

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip on focus and closes on blur', () => {
    render(
      <Tooltip content="Total liquidity available">
        <button type="button">Pool Info</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Pool Info' });
    fireEvent.focus(trigger);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeDefined();
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);

    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('dismisses tooltip on Escape key press', () => {
    render(
      <Tooltip content="Highest available offer">
        <button type="button">Best Offer Info</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Best Offer Info' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
