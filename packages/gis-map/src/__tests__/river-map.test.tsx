import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { River } from '@repo/ui/types';

/**
 * Leaflet is a heavy, DOM-owning library that cannot run meaningfully in jsdom.
 * Instead of stubbing the component's behaviour away, we replace Leaflet with a
 * recording double so the tests can assert the REAL contract the map promises:
 * one marker per river, correct status colour, a pulsing halo only for critical
 * basins, an Indonesian popup, and a selection callback on click.
 */

type MockMarker = {
  latlng: [number, number];
  options: Record<string, unknown>;
  handlers: Record<string, () => void>;
  popupHtml: string;
  addTo: ReturnType<typeof vi.fn>;
  bindPopup: (html: string) => MockMarker;
  on: (event: string, cb: () => void) => MockMarker;
};

const state = {
  markers: [] as MockMarker[],
  tiles: [] as Array<{ url: string; options: Record<string, unknown> }>,
  maps: [] as Array<{ center: [number, number]; zoom: number }>,
  mapRemove: vi.fn(),
  setView: vi.fn(),
  layerGroupAddTo: vi.fn(),
};

vi.mock('leaflet', () => {
  const divIcon = (options: Record<string, unknown>) => ({ __type: 'divIcon', options });
  const marker = (latlng: [number, number], options: Record<string, unknown>): MockMarker => {
    const m: MockMarker = {
      latlng,
      options,
      handlers: {},
      popupHtml: '',
      addTo: vi.fn(() => m),
      bindPopup: (html: string) => {
        m.popupHtml = html;
        return m;
      },
      on: (event: string, cb: () => void) => {
        m.handlers[event] = cb;
        return m;
      },
    };
    state.markers.push(m);
    return m;
  };

  // A single stable instance: the component keeps whatever L.map() returns in
  // a ref and calls setView/remove on it, so the double must not hand back a
  // fresh object per call.
  const instance = {
    remove: (...a: unknown[]) => state.mapRemove(...a),
    setView: (...a: unknown[]) => state.setView(...a),
  };

  return {
    default: {
      map: (_el: HTMLElement, opts: { center: [number, number]; zoom: number }) => {
        state.maps.push({ center: opts.center, zoom: opts.zoom });
        return instance;
      },
      tileLayer: (url: string, options: Record<string, unknown>) => {
        state.tiles.push({ url, options });
        return { addTo: vi.fn() };
      },
      layerGroup: () => ({ addTo: state.layerGroupAddTo }),
      divIcon,
      marker,
    },
  };
});

const { default: RiverMap } = await import('../river-map');

function makeRiver(over: Partial<River> & Pick<River, 'slug' | 'name' | 'status'>): River {
  return {
    id: over.slug,
    province: 'Jawa Barat',
    description: 'Deskripsi sungai untuk pengujian yang cukup panjang.',
    ikaScore: 75,
    ph: 7,
    doMgL: 6,
    tssMgL: 30,
    wasteIndex: 'Rendah',
    issues: ['Sampah domestik'],
    coordinates: { lat: -6.5, lng: 106.7 },
    lastUpdated: '2026-09-08',
    verifier: 'Pos Pantau Uji',
    ...over,
  } as River;
}

const HEALTHY = makeRiver({ slug: 'cisadane', name: 'Cisadane', status: 'good', ikaScore: 80 });
const WATCH = makeRiver({ slug: 'musi', name: 'Musi', status: 'warning', ikaScore: 60 });
const URGENT = makeRiver({ slug: 'citarum', name: 'Citarum', status: 'critical', ikaScore: 38 });

beforeEach(() => {
  state.markers.length = 0;
  state.tiles.length = 0;
  state.maps.length = 0;
  state.mapRemove.mockClear();
  state.setView.mockClear();
  state.layerGroupAddTo.mockClear();
});

describe('RiverMap — inisialisasi peta', () => {
  it('centres on Indonesia at country zoom', async () => {
    render(<RiverMap rivers={[HEALTHY]} />);

    await waitFor(() => expect(state.maps).toHaveLength(1));
    expect(state.maps[0]!.center).toEqual([-2.5, 118]);
    expect(state.maps[0]!.zoom).toBe(5);
  });

  it('loads OpenStreetMap tiles with the required attribution', async () => {
    render(<RiverMap rivers={[HEALTHY]} />);

    await waitFor(() => expect(state.tiles).toHaveLength(1));
    expect(state.tiles[0]!.url).toContain('tile.openstreetmap.org');
    expect(String(state.tiles[0]!.options.attribution)).toContain('OpenStreetMap');
  });

  it('exposes the map to assistive tech with an Indonesian label', async () => {
    render(<RiverMap rivers={[HEALTHY]} />);
    expect(
      screen.getByRole('application', { name: /tujuh daerah aliran sungai/i })
    ).toBeInTheDocument();
  });

  it('honours a custom height', async () => {
    const { container } = render(<RiverMap rivers={[HEALTHY]} height="380px" />);
    const mapEl = container.querySelector('[role="application"]') as HTMLElement;
    expect(mapEl.style.height).toBe('380px');
  });

  it('defaults to a tall map on desktop', async () => {
    const { container } = render(<RiverMap rivers={[HEALTHY]} />);
    const mapEl = container.querySelector('[role="application"]') as HTMLElement;
    expect(mapEl.style.height).toBe('520px');
  });

  it('places every river group on the map', async () => {
    render(<RiverMap rivers={[HEALTHY, WATCH, URGENT]} />);
    await waitFor(() => expect(state.markers).toHaveLength(3));
    expect(state.layerGroupAddTo).toHaveBeenCalled();
  });
});

describe('RiverMap — marker dan status', () => {
  it('draws one marker per river at its coordinates', async () => {
    render(<RiverMap rivers={[HEALTHY, URGENT]} />);

    await waitFor(() => expect(state.markers).toHaveLength(2));
    expect(state.markers[0]!.latlng).toEqual([HEALTHY.coordinates.lat, HEALTHY.coordinates.lng]);
    expect(state.markers[1]!.latlng).toEqual([URGENT.coordinates.lat, URGENT.coordinates.lng]);
  });

  it('colours each marker by water-quality status', async () => {
    render(<RiverMap rivers={[HEALTHY, WATCH, URGENT]} />);

    await waitFor(() => expect(state.markers).toHaveLength(3));

    const html = state.markers.map((m) => String((m.options.icon as any).options.html));
    expect(html[0]).toContain('#10B981'); // good  -> green
    expect(html[1]).toContain('#F59E0B'); // warning -> amber
    expect(html[2]).toContain('#EF4444'); // critical -> red
  });

  it('adds a pulsing halo ONLY to critical basins', async () => {
    render(<RiverMap rivers={[HEALTHY, WATCH, URGENT]} />);

    await waitFor(() => expect(state.markers).toHaveLength(3));

    const html = state.markers.map((m) => String((m.options.icon as any).options.html));
    expect(html[2]).toContain('river-pin__halo');
    expect(html[0]).not.toContain('river-pin__halo');
    expect(html[1]).not.toContain('river-pin__halo');
  });

  it('gives the marker a title naming the river', async () => {
    render(<RiverMap rivers={[URGENT]} />);

    await waitFor(() => expect(state.markers).toHaveLength(1));
    expect(state.markers[0]!.options.title).toBe('Sungai Citarum');
  });

  it('reports the status and IKA score in an Indonesian popup', async () => {
    render(<RiverMap rivers={[URGENT]} />);

    await waitFor(() => expect(state.markers).toHaveLength(1));
    const popup = state.markers[0]!.popupHtml;
    expect(popup).toContain('Sungai Citarum');
    expect(popup).toContain('Kritis');
    expect(popup).toContain('38');
  });
});

describe('RiverMap — pemilihan sungai', () => {
  it('calls onSelectRiver with the slug when a marker is clicked', async () => {
    const onSelectRiver = vi.fn();
    render(<RiverMap rivers={[HEALTHY, URGENT]} onSelectRiver={onSelectRiver} />);

    await waitFor(() => expect(state.markers).toHaveLength(2));
    state.markers[1]!.handlers.click?.();

    expect(onSelectRiver).toHaveBeenCalledWith('citarum');
  });

  it('does not throw when a marker is clicked without a handler', async () => {
    render(<RiverMap rivers={[URGENT]} />);

    await waitFor(() => expect(state.markers).toHaveLength(1));
    expect(() => state.markers[0]!.handlers.click?.()).not.toThrow();
  });

  it('recentres the map when selectedSlug changes', async () => {
    const { rerender } = render(<RiverMap rivers={[HEALTHY, URGENT]} />);
    await waitFor(() => expect(state.markers).toHaveLength(2));

    rerender(<RiverMap rivers={[HEALTHY, URGENT]} selectedSlug="citarum" />);

    await waitFor(() =>
      expect(state.setView).toHaveBeenCalledWith(
        [URGENT.coordinates.lat, URGENT.coordinates.lng],
        8,
        { animate: true }
      )
    );
  });

  it('ignores a selectedSlug that is not among the rivers', async () => {
    render(<RiverMap rivers={[HEALTHY]} selectedSlug="tidak-ada" />);
    await waitFor(() => expect(state.markers).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 20));

    expect(state.setView).not.toHaveBeenCalled();
  });
});

describe('RiverMap — pembersihan', () => {
  it('removes the Leaflet map on unmount to avoid a detached-DOM leak', async () => {
    const { unmount } = render(<RiverMap rivers={[HEALTHY]} />);
    await waitFor(() => expect(state.maps).toHaveLength(1));

    unmount();

    expect(state.mapRemove).toHaveBeenCalled();
  });
});
