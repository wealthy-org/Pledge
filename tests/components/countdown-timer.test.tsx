import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CountdownTimer } from '@/components/common/CountdownTimer';

describe('TICKET-60: CountdownTimer Component Test Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders days, hours, and minutes for deadline > 24 hours away', () => {
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    const dueAt = now + 2 * 86400 + 5 * 3600 + 12 * 60; // +2d 5h 12m

    render(<CountdownTimer dueAt={dueAt} />);
    expect(screen.getByText(/2d 5h/i)).toBeDefined();
  });

  it('renders hours, minutes, seconds for urgent deadline < 24 hours away', () => {
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    const dueAt = now + 3 * 3600 + 20 * 60 + 15; // +3h 20m 15s

    render(<CountdownTimer dueAt={dueAt} />);
    expect(screen.getByText(/3h 20m/i)).toBeDefined();
  });

  it('renders Overdue badge when current time is past dueAt', () => {
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    const dueAt = now - 100; // 100s in past

    render(<CountdownTimer dueAt={dueAt} />);
    expect(screen.getByText(/overdue/i)).toBeDefined();
  });

  it('updates remaining time every second', () => {
    const now = 1700000000;
    vi.setSystemTime(now * 1000);
    const dueAt = now + 40;

    render(<CountdownTimer dueAt={dueAt} />);
    expect(screen.getByText(/40s/i)).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText(/35s/i)).toBeDefined();
  });
});
