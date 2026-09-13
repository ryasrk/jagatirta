import { render, screen, within } from '@testing-library/react';
import type { River } from '@repo/ui/types';
import { describe, expect, it } from 'vitest';

import { RiverDetailPanel, type RiverDetailPanelProps } from './river-detail-panel';

/** Basis sungai valid; tiap pengujian menimpa hanya bidang yang relevan. */
function makeRiver(overrides: Partial<River> = {}): River {
  return {
    id: '1',
    slug: 'cisadane',
    name: 'Cisadane',
    province: 'Jawa Barat – Banten',
    description: 'Berkhulu di lereng Gunung Salak.',
    status: 'warning',
    ikaScore: 62,
    ph: 7.1,
    doMgL: 5.2,
    tssMgL: 88,
    wasteIndex: 'Sedang',
    issues: ['Sampah Domestik', 'Limbah Industri'],
    coordinates: { lat: -6.5521, lng: 106.7261 },
    lastUpdated: '2026-09-08',
    verifier: 'Pos Pantau Cisadane Hulu',
    ...overrides,
  };
}

function renderPanel(props: Partial<RiverDetailPanelProps> = {}) {
  return render(
    <RiverDetailPanel river={makeRiver()} formattedDate="8 September 2026" {...props} />,
  );
}

/** Meter aksesibel milik satu parameter telemetri. */
function meterFor(label: string): HTMLElement {
  return screen.getByRole('meter', { name: label });
}

describe('RiverDetailPanel — header dossier', () => {
  it('merender judul "Sungai <nama>" sebagai heading level 2', () => {
    renderPanel();

    const title = screen.getByRole('heading', { level: 2, name: 'Sungai Cisadane' });
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H2');
  });

  it('menampilkan provinsi tepat sekali di header, terpisah dari kisi metadata', () => {
    renderPanel();

    expect(screen.getAllByText('Jawa Barat – Banten')).toHaveLength(1);
  });

  it('menyembunyikan ikon pin dari pembaca layar', () => {
    const { container } = renderPanel();

    const decorative = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThanOrEqual(2);
    for (const svg of Array.from(decorative)) {
      expect(svg).toHaveAttribute('focusable', 'false');
    }
  });

  it('menampilkan pil status dengan label resmi dan detail IKA', () => {
    renderPanel();

    const pill = screen.getByText('Waspada').closest('[data-status]');
    expect(pill).toHaveAttribute('data-status', 'warning');
    expect(within(pill as HTMLElement).getByText('IKA 62')).toBeInTheDocument();
    expect(within(pill as HTMLElement).getByText('Status mutu air sungai:')).toBeInTheDocument();
  });

  it('menampilkan indeks limbah pada badge netral', () => {
    renderPanel();

    expect(screen.getByText('Indeks Sedang')).toBeInTheDocument();
  });

  it.each([
    ['good', 'Baik'],
    ['warning', 'Waspada'],
    ['critical', 'Kritis'],
  ] as const)('status %s memakai label pil %s', (status, label) => {
    renderPanel({ river: makeRiver({ status }) });

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label).closest('[data-status]')).toHaveAttribute('data-status', status);
  });
});

describe('RiverDetailPanel — kartu skor IKA', () => {
  it('menampilkan judul, skor, dan skala /100', () => {
    renderPanel();

    expect(screen.getByText('Indeks Kualitas Air')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('memakai meter IKA berskala 0–100 dengan status sungai', () => {
    renderPanel({ river: makeRiver({ ikaScore: 38, status: 'critical' }) });

    const meter = meterFor('Indeks Kualitas Air (IKA)');
    expect(meter).toHaveAttribute('aria-valuenow', '38');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter.getAttribute('aria-valuetext')).toContain('status Kritis');
  });

  it('menyampaikan status lewat hint, bukan lewat baris zona aman', () => {
    renderPanel({ river: makeRiver({ status: 'good' }) });

    expect(screen.getByText('Status Baik')).toBeInTheDocument();

    // Hanya meter IKA (yang tidak punya `safeRange`) yang diperiksa; bar
    // telemetri di bawahnya memang selalu membawa keterangan zona aman.
    const ikaMeter = meterFor('Indeks Kualitas Air (IKA)');
    const ikaBlock = ikaMeter.parentElement as HTMLElement;
    expect(within(ikaBlock).queryByText(/Zona aman/)).not.toBeInTheDocument();
    expect(ikaMeter.getAttribute('aria-valuetext')).not.toContain('rentang aman');
    // Skala IKA dibacakan penuh 0–100 walau header meternya disembunyikan.
    expect(within(ikaBlock).getByText('100')).toBeInTheDocument();
  });

  it.each([
    ['good', 'Mutu air memenuhi baku mutu kelas II'],
    ['warning', 'Tercemar ringan — pengawasan pekanan diperketat'],
    ['critical', 'Tercemar berat — butuh tindakan segera'],
  ] as const)('status %s menampilkan keterangan mutu "%s"', (status, detail) => {
    renderPanel({ river: makeRiver({ status }) });

    expect(screen.getByText(detail)).toBeInTheDocument();
  });

  it('membulatkan skor IKA desimal sesuai locale id-ID', () => {
    renderPanel({ river: makeRiver({ ikaScore: 61.7 }) });

    expect(screen.getByText('62')).toBeInTheDocument();
    expect(meterFor('Indeks Kualitas Air (IKA)')).toHaveAttribute('aria-valuenow', '61.7');
  });
});

describe('RiverDetailPanel — telemetri lab', () => {
  it('merender blok telemetri dengan tiga parameter baku mutu', () => {
    renderPanel();

    expect(screen.getByRole('heading', { level: 3, name: 'Telemetri Lab Terakhir' })).toBeInTheDocument();
    expect(meterFor('Derajat Keasaman (pH)')).toHaveAttribute('aria-valuenow', '7.1');
    expect(meterFor('Oksigen Terlarut (DO)')).toHaveAttribute('aria-valuenow', '5.2');
    expect(meterFor('Padatan Tersuspensi (TSS)')).toHaveAttribute('aria-valuenow', '88');
  });

  it('memakai skala pH 0–14 dengan zona aman 6,5–8,5 tanpa satuan', () => {
    renderPanel();

    const ph = meterFor('Derajat Keasaman (pH)');
    expect(ph).toHaveAttribute('aria-valuemin', '0');
    expect(ph).toHaveAttribute('aria-valuemax', '14');
    expect(ph).toHaveAttribute(
      'aria-valuetext',
      'Derajat Keasaman (pH): 7,1, status Waspada, rentang aman 6,5–8,5',
    );
    expect(screen.getByText('Zona aman 6,5–8,5')).toBeInTheDocument();
  });

  it('memakai skala DO 0–14 dengan satuan mg/L dan zona aman 5–14', () => {
    renderPanel();

    const dissolvedOxygen = meterFor('Oksigen Terlarut (DO)');
    expect(dissolvedOxygen).toHaveAttribute('aria-valuemin', '0');
    expect(dissolvedOxygen).toHaveAttribute('aria-valuemax', '14');
    expect(dissolvedOxygen).toHaveAttribute(
      'aria-valuetext',
      'Oksigen Terlarut (DO): 5,2 mg/L, status Waspada, rentang aman 5–14 mg/L',
    );
    expect(screen.getByText('Zona aman 5–14 mg/L')).toBeInTheDocument();
  });

  it('memakai skala TSS 0–350 dengan satuan mg/L dan zona aman 0–50', () => {
    renderPanel();

    const suspendedSolids = meterFor('Padatan Tersuspensi (TSS)');
    expect(suspendedSolids).toHaveAttribute('aria-valuemin', '0');
    expect(suspendedSolids).toHaveAttribute('aria-valuemax', '350');
    expect(suspendedSolids).toHaveAttribute(
      'aria-valuetext',
      'Padatan Tersuspensi (TSS): 88 mg/L, status Waspada, rentang aman 0–50 mg/L',
    );
    expect(screen.getByText('Zona aman 0–50 mg/L')).toBeInTheDocument();
  });

  it('meneruskan status sungai ke seluruh meter telemetri', () => {
    renderPanel({ river: makeRiver({ status: 'critical' }) });

    for (const label of ['Derajat Keasaman (pH)', 'Oksigen Terlarut (DO)', 'Padatan Tersuspensi (TSS)']) {
      expect(meterFor(label).getAttribute('aria-valuetext')).toContain('status Kritis');
    }
  });

  it('membaca telemetri non-finite sebagai 0 tanpa NaN pada atribut ARIA', () => {
    renderPanel({
      river: makeRiver({ ph: Number.NaN, doMgL: Number.POSITIVE_INFINITY, tssMgL: Number.NaN }),
    });

    expect(meterFor('Derajat Keasaman (pH)')).toHaveAttribute('aria-valuenow', '0');
    expect(meterFor('Oksigen Terlarut (DO)')).toHaveAttribute('aria-valuenow', '0');
    expect(meterFor('Padatan Tersuspensi (TSS)')).toHaveAttribute('aria-valuenow', '0');

    for (const label of ['Derajat Keasaman (pH)', 'Oksigen Terlarut (DO)', 'Padatan Tersuspensi (TSS)']) {
      expect(meterFor(label).getAttribute('aria-valuetext')).not.toContain('NaN');
    }
  });

  it('menerima nilai telemetri di luar skala baku mutu tanpa melempar', () => {
    renderPanel({ river: makeRiver({ ph: 99, doMgL: -3, tssMgL: 900 }) });

    expect(meterFor('Derajat Keasaman (pH)')).toHaveAttribute('aria-valuenow', '99');
    expect(meterFor('Oksigen Terlarut (DO)')).toHaveAttribute('aria-valuenow', '-3');
    expect(meterFor('Padatan Tersuspensi (TSS)')).toHaveAttribute('aria-valuenow', '900');
  });
});

describe('RiverDetailPanel — isu prioritas', () => {
  it('merender satu item list per isu dengan lencana bernada status', () => {
    renderPanel();

    expect(screen.getByRole('heading', { level: 3, name: 'Isu Prioritas' })).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Sampah Domestik');
    expect(items[1]).toHaveTextContent('Limbah Industri');
  });

  it.each([
    ['good', 'ring-status-good'],
    ['warning', 'ring-status-warning'],
    ['critical', 'ring-status-critical'],
  ] as const)('status %s mewarnai badge isu dengan %s', (status, token) => {
    const { container } = renderPanel({ river: makeRiver({ status }) });

    const badge = container.querySelector('li span');
    expect(badge?.className).toContain(token);
  });

  it('tidak merender item apa pun saat tidak ada isu', () => {
    renderPanel({ river: makeRiver({ issues: [] }) });

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 3, name: 'Isu Prioritas' })).toBeInTheDocument();
  });

  it('menerima banyak isu dan teks isu sangat panjang', () => {
    const longIssue = 'Limbah cair tekstil tanpa pengolahan di hilir industri '.repeat(6).trim();
    renderPanel({
      river: makeRiver({ issues: ['Sampah Domestik', longIssue, 'Sedimentasi', 'Logam Berat'] }),
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText(longIssue)).toBeInTheDocument();
  });
});

describe('RiverDetailPanel — kisi metadata verifikasi', () => {
  it('mengisi keterangan dengan tanggal terformat, verifikator, dan koordinat', () => {
    const { container } = renderPanel();

    const terms = Array.from(container.querySelectorAll('dt')).map((node) => node.textContent);
    expect(terms).toEqual(['Diperbarui', 'Verifikator', 'Koordinat']);
  });

  it('memakai formattedDate apa adanya, bukan lastUpdated mentah', () => {
    renderPanel({ river: makeRiver({ lastUpdated: '2026-09-08' }), formattedDate: '8 September 2026' });

    expect(screen.getByText('8 September 2026')).toBeInTheDocument();
    expect(screen.queryByText('2026-09-08')).not.toBeInTheDocument();
  });

  it('menampilkan verifikator dari data pos pantau', () => {
    renderPanel({ river: makeRiver({ verifier: 'Pos Pantau Citarum Hilir' }) });

    expect(screen.getByText('Pos Pantau Citarum Hilir')).toBeInTheDocument();
  });

  it('memformat koordinat ke tiga desimal sesuai locale id-ID', () => {
    renderPanel({ river: makeRiver({ coordinates: { lat: -6.5521, lng: 106.7261 } }) });

    expect(screen.getByText('-6,552, 106,726')).toBeInTheDocument();
  });

  it('mempertahankan tiga desimal pada koordinat bulat', () => {
    renderPanel({ river: makeRiver({ coordinates: { lat: -6.9, lng: 107.6 } }) });

    expect(screen.getByText('-6,900, 107,600')).toBeInTheDocument();
  });

  it('membaca koordinat non-finite sebagai NaN literal tanpa menjatuhkan panel', () => {
    renderPanel({
      river: makeRiver({ coordinates: { lat: Number.NaN, lng: Number.POSITIVE_INFINITY } }),
    });

    expect(screen.getByText('NaN, ∞')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Sungai Cisadane' })).toBeInTheDocument();
  });

  it('menerima keterangan verifikator dan tanggal yang sangat panjang', () => {
    const longVerifier = 'Balai Besar Wilayah Sungai Citarum '.repeat(8).trim();

    renderPanel({ river: makeRiver({ verifier: longVerifier }) });

    expect(screen.getByText(longVerifier)).toBeInTheDocument();
  });
});

describe('RiverDetailPanel — catatan metodologi', () => {
  it('menjelaskan asal data dan ritme evaluasi ulang dalam bahasa Indonesia', () => {
    renderPanel();

    expect(
      screen.getByText(/Data diambil dari sampel pos pantau paling akhir/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Status dievaluasi ulang setiap pekan/)).toBeInTheDocument();
  });
});

describe('RiverDetailPanel — tautan tindakan', () => {
  it('menautkan tombol dossier ke /lokasi/<slug>', () => {
    renderPanel();

    const dossier = screen.getByRole('link', { name: /Buka dossier lengkap/ });
    expect(dossier).toHaveAttribute('href', '/lokasi/cisadane');
  });

  it('memperbarui tautan dossier saat slug berbeda', () => {
    renderPanel({ river: makeRiver({ slug: 'bengawan-solo', name: 'Bengawan Solo' }) });

    expect(screen.getByRole('link', { name: /Buka dossier lengkap/ })).toHaveAttribute(
      'href',
      '/lokasi/bengawan-solo',
    );
  });

  it('menautkan laporan temuan ke /lapor dengan nama sungai pada label', () => {
    renderPanel({ river: makeRiver({ name: 'Citarum' }) });

    const report = screen.getByRole('link', { name: 'Laporkan temuan di Citarum' });
    expect(report).toHaveAttribute('href', '/lapor');
  });

  it('menyembunyikan ikon panah dari pembaca layar sehingga label tautan bersih', () => {
    renderPanel();

    const dossier = screen.getByRole('link', { name: /Buka dossier lengkap/ });
    const arrow = dossier.querySelector('svg[aria-hidden="true"]');
    expect(arrow).not.toBeNull();
    // Ikon tidak menambah apa pun ke nama aksesibel tautan.
    expect(dossier).toHaveAccessibleName('Buka dossier lengkap');
  });
});

describe('RiverDetailPanel — kasus tepi nol & teks kosong', () => {
  it('menangani skor IKA nol dan telemetri nol sebagai nilai sah, bukan kosong', () => {
    renderPanel({
      river: makeRiver({ ikaScore: 0, ph: 0, doMgL: 0, tssMgL: 0 }),
    });

    const ika = meterFor('Indeks Kualitas Air (IKA)');
    expect(ika).toHaveAttribute('aria-valuenow', '0');
    expect(meterFor('Derajat Keasaman (pH)')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('tidak merender teks kosong untuk nama dan provinsi kosong', () => {
    const { container } = renderPanel({ river: makeRiver({ name: '', province: '' }) });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sungai');
    expect(container.textContent).not.toContain('Sungai  ');
  });

  it('mencegah isu duplikat dianggap daftar yang berbeda', () => {
    renderPanel({ river: makeRiver({ issues: ['Sampah Domestik', 'Sampah Domestik'] }) });

    expect(screen.getAllByText('Sampah Domestik')).toHaveLength(2);
  });
});
