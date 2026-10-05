import { describe, it, expect } from 'vitest';
import { metadata, viewport } from '@/app/layout';

describe('SEO & OpenGraph Metadata Configuration', () => {
  it('defines metadataBase pointing to valid URL', () => {
    expect(metadata.metadataBase).toBeDefined();
    expect(metadata.metadataBase?.toString()).toMatch(/^https?:\/\//);
  });

  it('configures descriptive title and template', () => {
    expect(metadata.title).toBeDefined();
    if (typeof metadata.title === 'object' && metadata.title !== null && 'default' in metadata.title) {
      expect(metadata.title.default).toContain('Pledge');
      expect(metadata.title.template).toContain('%s');
    }
  });

  it('configures OpenGraph and Twitter card objects', () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph?.siteName).toBe('Pledge');
    expect((metadata.openGraph as any)?.type).toBe('website');

    expect(metadata.twitter).toBeDefined();
    expect((metadata.twitter as any)?.card).toBe('summary_large_image');
  });

  it('configures robots directive allowing indexing', () => {
    expect(metadata.robots).toBeDefined();
    if (typeof metadata.robots === 'object' && metadata.robots !== null && 'index' in metadata.robots) {
      expect(metadata.robots.index).toBe(true);
      expect(metadata.robots.follow).toBe(true);
    }
  });

  it('configures viewport with theme color variants', () => {
    expect(viewport).toBeDefined();
    expect(viewport.themeColor).toBeDefined();
  });
});
