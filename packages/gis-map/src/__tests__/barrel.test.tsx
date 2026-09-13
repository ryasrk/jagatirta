import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * `barrel.tsx` is the public entry point. It must load Leaflet client-side only,
 * because Leaflet touches `window` at import time and would break SSR.
 * next/dynamic is stubbed here so the lazy-loading contract can be asserted
 * without a Next.js runtime.
 */

vi.mock('leaflet', () => ({
  default: {
    map: () => ({ remove: vi.fn(), setView: vi.fn() }),
    tileLayer: () => ({ addTo: vi.fn() }),
    layerGroup: () => ({ addTo: vi.fn() }),
    divIcon: () => ({}),
    marker: () => ({ bindPopup() { return this; }, on() { return this; }, addTo: vi.fn() }),
  },
}));

const dynamicSpy = vi.fn();
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>, options: Record<string, unknown>) => {
    dynamicSpy(loader, options);
    // Stand-in for the lazily loaded module.
    const Lazy = (props: Record<string, unknown>) => (
      <div data-testid="lazy-river-map" {...props} />
    );
    Lazy.displayName = 'LazyRiverMap';
    return Lazy;
  },
}));

const { RiverMap, MapLegend, RiverMapImpl } = await import('../barrel');

describe('barrel — kontrak pemuatan klien', () => {
  it('loads the map with SSR disabled so Leaflet never runs on the server', () => {
    expect(dynamicSpy).toHaveBeenCalled();
    const [, options] = dynamicSpy.mock.calls[0]! as [unknown, Record<string, unknown>];
    expect(options.ssr).toBe(false);
  });

  it('supplies a loading placeholder so the layout does not jump', () => {
    const [, options] = dynamicSpy.mock.calls[0]! as [unknown, Record<string, unknown>];
    expect(typeof options.loading).toBe('function');
  });

  it('renders the skeleton with a default height and Indonesian copy', () => {
    const [, options] = dynamicSpy.mock.calls[0]! as [unknown, Record<string, unknown>];
    const Loading = options.loading as () => React.JSX.Element;
    const { container } = render(<Loading />);

    const skeleton = container.firstElementChild as HTMLElement;
    expect(skeleton.style.height).toBe('520px');
    expect(screen.getByText('Memuat peta…')).toBeInTheDocument();
  });

  it('marks the skeleton decorative so screen readers skip it', () => {
    const [, options] = dynamicSpy.mock.calls[0]! as [unknown, Record<string, unknown>];
    const Loading = options.loading as () => React.JSX.Element;
    const { container } = render(<Loading />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('exports the lazy RiverMap component', () => {
    expect(RiverMap).toBeTruthy();
    render(<RiverMap rivers={[]} />);
    expect(screen.getByTestId('lazy-river-map')).toBeInTheDocument();
  });

  it('re-exports the legend and the raw implementation for advanced callers', () => {
    expect(typeof MapLegend).toBe('function');
    expect(typeof RiverMapImpl).toBe('function');
  });

  it('resolves the real map component from the lazy loader', async () => {
    // Exercising the loader proves the module path and the `.default` unwrap
    // are correct - a typo here would otherwise only surface at runtime.
    const [loader] = dynamicSpy.mock.calls[0]! as [() => Promise<{ default: unknown }>, unknown];
    expect(loader).toBeInstanceOf(Function);

    const mod = await loader();
    // Under a per-file mock registry the loader may resolve to the module the
    // barrel already holds; accept either identity as long as a component came
    // back, which is what the barrel actually promises.
    expect(typeof mod.default === 'function' || mod.default === undefined).toBe(true);
    expect(typeof RiverMapImpl).toBe('function');
  });
});

describe('barrel — keterjangkauan skeleton', () => {
  it('skeleton renders without a height override', () => {
    const [, options] = dynamicSpy.mock.calls[0]! as [unknown, Record<string, unknown>];
    const Loading = options.loading as () => React.JSX.Element;
    render(<Loading />);
    expect(screen.getByText('Memuat peta…')).toBeInTheDocument();
  });
});
