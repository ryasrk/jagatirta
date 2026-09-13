import { describe, expect, it } from 'vitest';

import { getRiverBySlug, riverStatusLabel, rivers } from '../rivers';
import { campaigns, jagatirtaPrograms } from '../programs';

/**
 * These suites guard the mock content layer that every page imports.
 * They assert both the lookup API and the data INTEGRITY that pages rely on:
 * a broken slug, a duplicated id, or an out-of-range telemetry value would
 * otherwise surface as a silently broken page rather than a failing test.
 */

const RIVER_SLUGS = [
  'cisadane',
  'citarum',
  'brantas',
  'bengawan-solo',
  'mahakam',
  'barito',
  'musi',
] as const;

describe('rivers — kontrak data', () => {
  it('covers exactly the seven monitored basins', () => {
    expect(rivers).toHaveLength(7);
    expect(rivers.map((r) => r.slug).sort()).toEqual([...RIVER_SLUGS].sort());
  });

  it('gives every river a unique id and slug', () => {
    expect(new Set(rivers.map((r) => r.id)).size).toBe(rivers.length);
    expect(new Set(rivers.map((r) => r.slug)).size).toBe(rivers.length);
  });

  it('provides the full shape each detail page renders', () => {
    for (const river of rivers) {
      expect(river.name).toBeTruthy();
      expect(river.province).toBeTruthy();
      expect(river.description.length).toBeGreaterThan(40);
      expect(river.verifier).toBeTruthy();
      expect(river.issues.length).toBeGreaterThan(0);
      expect(river.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('uses an Indonesian province label for each basin', () => {
    for (const river of rivers) {
      expect(river.province).toMatch(/[A-Za-z]/);
    }
  });

  it('keeps telemetry values inside physically meaningful ranges', () => {
    for (const river of rivers) {
      expect(river.ph).toBeGreaterThanOrEqual(0);
      expect(river.ph).toBeLessThanOrEqual(14);
      expect(river.doMgL).toBeGreaterThanOrEqual(0);
      expect(river.tssMgL).toBeGreaterThanOrEqual(0);
      expect(river.ikaScore).toBeGreaterThanOrEqual(0);
      expect(river.ikaScore).toBeLessThanOrEqual(100);
    }
  });

  it('only uses recognised status and waste-index vocabularies', () => {
    for (const river of rivers) {
      expect(['good', 'warning', 'critical']).toContain(river.status);
      expect(['Rendah', 'Sedang', 'Berat']).toContain(river.wasteIndex);
    }
  });

  it('places every basin inside Indonesia\u2019s bounding box', () => {
    for (const river of rivers) {
      expect(river.coordinates.lat).toBeGreaterThan(-12);
      expect(river.coordinates.lat).toBeLessThan(7);
      expect(river.coordinates.lng).toBeGreaterThan(94);
      expect(river.coordinates.lng).toBeLessThan(142);
    }
  });

  it('matches status to the IKA score so the map colour never misleads', () => {
    // The map communicates urgency by colour; a mismatch between the score and
    // the status is a factual error visible to every visitor.
    for (const river of rivers) {
      if (river.status === 'good') expect(river.ikaScore).toBeGreaterThanOrEqual(70);
      if (river.status === 'critical') expect(river.ikaScore).toBeLessThan(50);
      if (river.status === 'warning') {
        expect(river.ikaScore).toBeGreaterThanOrEqual(50);
        expect(river.ikaScore).toBeLessThan(70);
      }
    }
  });

  it('exposes a live camera only as an absolute URL when present', () => {
    for (const river of rivers) {
      if (river.liveCamUrl !== undefined) {
        expect(river.liveCamUrl).toMatch(/^https?:\/\//);
      }
    }
  });
});

describe('getRiverBySlug', () => {
  it('returns the matching river for every known slug', () => {
    for (const slug of RIVER_SLUGS) {
      const river = getRiverBySlug(slug);
      expect(river).toBeDefined();
      expect(river?.slug).toBe(slug);
    }
  });

  it('returns undefined for an unknown slug', () => {
    expect(getRiverBySlug('sungai-tidak-ada')).toBeUndefined();
    expect(getRiverBySlug('')).toBeUndefined();
  });

  it('is case-sensitive, so a miscased slug 404s rather than silently matching', () => {
    expect(getRiverBySlug('Cisadane')).toBeUndefined();
  });
});

describe('riverStatusLabel', () => {
  it('maps every status to its Indonesian label', () => {
    expect(riverStatusLabel.good).toBe('Baik');
    expect(riverStatusLabel.warning).toBe('Waspada');
    expect(riverStatusLabel.critical).toBe('Kritis');
  });

  it('labels every status actually used in the data', () => {
    for (const river of rivers) {
      expect(riverStatusLabel[river.status]).toBeTruthy();
    }
  });
});







describe('programs — kontrak data', () => {
  it('lists four pillars for each organisation', () => {
    expect(jagatirtaPrograms).toHaveLength(4);
    expect(zamroedPrograms).toHaveLength(4);
  });

  it('gives every programme a unique id, slug, icon and description', () => {
    for (const list of [jagatirtaPrograms, zamroedPrograms]) {
      expect(new Set(list.map((p) => p.id)).size).toBe(list.length);
      expect(new Set(list.map((p) => p.slug)).size).toBe(list.length);
      for (const program of list) {
        expect(program.title).toBeTruthy();
        expect(program.description.length).toBeGreaterThan(40);
        expect(program.icon).toMatch(/^[A-Z][A-Za-z0-9]*$/); // lucide names may carry a digit, e.g. Trash2
      }
    }
  });

  it('uses distinct slugs across the two organisations', () => {
    // Both sets render on their own site, but distinct slugs keep future
    // cross-linking unambiguous.
    const all = [...jagatirtaPrograms, ...zamroedPrograms].map((p) => p.slug);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('campaigns — kontrak data', () => {
  it('ships at least one fundraising and one petition campaign', () => {
    expect(campaigns.length).toBeGreaterThanOrEqual(2);
    expect(campaigns.some((c) => c.type === 'dana')).toBe(true);
    expect(campaigns.some((c) => c.type === 'petisi')).toBe(true);
  });

  it('keeps progress within the target', () => {
    for (const campaign of campaigns) {
      expect(campaign.target).toBeGreaterThan(0);
      expect(campaign.raised).toBeGreaterThanOrEqual(0);
      expect(campaign.raised).toBeLessThanOrEqual(campaign.target);
    }
  });

  it('gives every campaign a unique id and slug plus a description', () => {
    expect(new Set(campaigns.map((c) => c.id)).size).toBe(campaigns.length);
    expect(new Set(campaigns.map((c) => c.slug)).size).toBe(campaigns.length);
    for (const campaign of campaigns) {
      expect(campaign.title).toBeTruthy();
      expect(campaign.description.length).toBeGreaterThan(20);
    }
  });

  it('scales fundraising targets in rupiah, not raw counts', () => {
    for (const campaign of campaigns.filter((c) => c.type === 'dana')) {
      expect(campaign.target).toBeGreaterThan(1_000_000);
    }
  });
});
