import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MapLegend } from '../legend';

/**
 * The legend is the key that makes the map readable: a visitor must be able to
 * translate a marker colour into urgency. These tests protect that mapping.
 */

describe('MapLegend', () => {
  it('lists all three water-quality states', () => {
    render(<MapLegend />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(screen.getByText('Baik')).toBeInTheDocument();
    expect(screen.getByText('Waspada')).toBeInTheDocument();
    expect(screen.getByText('Kritis')).toBeInTheDocument();
  });

  it('renders as a list so screen readers announce the item count', () => {
    render(<MapLegend />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('explains what each colour means through a title tooltip', () => {
    render(<MapLegend />);

    expect(screen.getByTitle('Mutu air memenuhi baku mutu')).toBeInTheDocument();
    expect(screen.getByTitle('Tercemar ringan, perlu pengawasan')).toBeInTheDocument();
    expect(screen.getByTitle('Tercemar berat, butuh tindakan segera')).toBeInTheDocument();
  });

  it('keeps the coloured swatch purely decorative for assistive tech', () => {
    // The meaning is carried by the Indonesian label, not the colour swatch,
    // so the swatch must not be announced on its own.
    const { container } = render(<MapLegend />);
    const swatches = container.querySelectorAll('span[aria-hidden="true"]');
    expect(swatches).toHaveLength(3);
  });

  it('orders the legend from safest to most urgent', () => {
    render(<MapLegend />);
    const labels = screen.getAllByRole('listitem').map((li) => li.textContent?.trim());
    expect(labels).toEqual(['Baik', 'Waspada', 'Kritis']);
  });

  it('forwards an extra className for layout control', () => {
    const { container } = render(<MapLegend className="mb-4" />);
    expect(container.querySelector('ul')).toHaveClass('mb-4');
  });

  it('renders without a className', () => {
    const { container } = render(<MapLegend />);
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelector('ul')?.className).not.toContain('undefined');
  });
});
