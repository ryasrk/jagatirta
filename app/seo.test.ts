import { describe, expect, it } from 'vitest';

import sitemap from './sitemap';
import robots from './robots';
import manifest from './manifest';

/**
 * SEO surfaces are only useful if they are TRUE. A sitemap that advertises a
 * route which 404s actively wastes crawl budget and reports broken pages to
 * search engines, so these tests assert the invariants that keep it honest.
 */

/** Every route the Jagatirta app actually serves (static + prerendered detail). */
const REAL_ROUTES = new Set([
  '/',
  '/program',
  '/lokasi',
  '/lokasi/cisadane',
  '/lokasi/citarum',
  '/lokasi/brantas',
  '/lokasi/bengawan-solo',
  '/lokasi/mahakam',
  '/lokasi/barito',
  '/lokasi/musi',
  '/volunteer',
  '/campaign',
  '/lapor',
]);

describe('sitemap', () => {
  const entries = sitemap();

  it('lists every real route of this app', () => {
    const paths = entries.map((e) => e.url.replace('https://jagatirta.id', ''));
    for (const route of REAL_ROUTES) {
      expect(paths).toContain(route);
    }
  });

  it('never advertises a URL that this app does not serve', () => {
    // The guard for a real defect: a sitemap entry pointing at another app's
    // route (or a typo) sends crawlers to a 404.
    for (const entry of entries) {
      const path = entry.url.replace('https://jagatirta.id', '');
      expect(REAL_ROUTES.has(path)).toBe(true);
    }
  });

  it('does not leak the sibling brand\u2019s routes', () => {
    // Zamroed content lives on zamroed.id, not here.
    for (const entry of entries) {
      expect(entry.url).not.toContain('/liputan-aksi');
    }
  });

  it('builds absolute URLs on the production domain', () => {
    for (const entry of entries) {
      expect(entry.url.startsWith('https://jagatirta.id/')).toBe(true);
    }
  });

  it('gives every entry a lastModified date, a change frequency and a priority', () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBeTruthy();
      expect(typeof entry.priority).toBe('number');
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it('ranks the home page highest', () => {
    const home = entries.find((e) => e.url === 'https://jagatirta.id/');
    expect(home?.priority).toBe(1);
    for (const entry of entries) {
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it('includes one detail entry per monitored river', () => {
    const riverEntries = entries.filter((e) => e.url.includes('/lokasi/') && e.url !== 'https://jagatirta.id/lokasi');
    // Seven basins are monitored; /lokasi plus seven detail pages.
    expect(riverEntries.length).toBeGreaterThanOrEqual(7);
  });

  it('has no duplicate URLs', () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('uses a fresh lastModified per call so a rebuild looks like an update', () => {
    const first = sitemap()[0]!.lastModified as Date;
    const second = sitemap()[0]!.lastModified as Date;
    expect(second.getTime()).toBeGreaterThanOrEqual(first.getTime());
  });
});

describe('robots', () => {
  const r = robots();

  it('allows crawling of the public site', () => {
    expect(r.rules).toBeTruthy();
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const first = rules[0]!;
    expect(first.userAgent).toBe('*');
    expect(first.allow).toBe('/');
  });

  it('keeps private surfaces out of the index', () => {
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const disallow = ([] as string[]).concat(rules[0]!.disallow ?? []);
    expect(disallow).toContain('/api/');
    expect(disallow).toContain('/admin/');
  });

  it('points crawlers at the absolute sitemap URL', () => {
    expect(r.sitemap).toBe('https://jagatirta.id/sitemap.xml');
  });
});

describe('manifest', () => {
  const m = manifest();

  it('identifies the app with an Indonesian locale and a short name', () => {
    expect(m.name).toBe('Jagatirta — River Watch Indonesia');
    expect(m.short_name).toBe('Jagatirta');
    expect(m.lang).toBe('id');
  });

  it('is installable: standalone display with a start URL', () => {
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/');
  });

  it('uses the Jagatirta brand colours', () => {
    expect(m.theme_color).toBe('#0F766E');
    expect(m.background_color).toBe('#F8FAFC');
  });

  it('ships the icon sizes required for install prompts', () => {
    const icons = m.icons ?? [];
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    for (const icon of icons) {
      expect(icon.src).toMatch(/^\/icons\/.+\.png$/);
      expect(icon.type).toBe('image/png');
    }
  });

  it('describes the app in Indonesian', () => {
    expect(m.description).toContain('sungai Indonesia');
  });
});
