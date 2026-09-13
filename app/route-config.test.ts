import { describe, expect, it } from 'vitest';

import * as riverPage from './lokasi/[slug]/page';

/**
 * Guard for a real defect found in the production build.
 *
 * The river dossier page calls `notFound()` for an unknown slug, which renders
 * the 404 UI - but without `dynamicParams = false` Next.js still serves that
 * response as HTTP 200 and caches it for a year. Search engines then index a
 * "not found" page as valid content.
 *
 * The route config cannot be exercised through jsdom, so this asserts the
 * export that makes the status code correct.
 */

describe('route config — dossier sungai', () => {
  it('disables dynamic params so an unknown slug is a real 404', () => {
    expect((riverPage as { dynamicParams?: boolean }).dynamicParams).toBe(false);
  });

  it('still prerenders exactly the seven monitored basins', () => {
    const params = (riverPage as { generateStaticParams: () => Array<{ slug: string }> })
      .generateStaticParams();

    expect(params).toHaveLength(7);
    expect(params.map((p) => p.slug)).toEqual([
      'cisadane',
      'citarum',
      'brantas',
      'bengawan-solo',
      'mahakam',
      'barito',
      'musi',
    ]);
  });

  it('exports a default page component and a metadata builder', () => {
    expect(typeof (riverPage as { default?: unknown }).default).toBe('function');
    expect(typeof (riverPage as { generateMetadata?: unknown }).generateMetadata).toBe('function');
  });
});
