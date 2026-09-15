import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { River } from '@repo/ui/types';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { RiverSelector, type RiverSelectorProps } from './river-selector';

/**
 * jsdom 25 exposes `navigator.clipboard` as a non-configurable own property,
 * which makes `userEvent.setup()` throw before any interaction runs.
 * Mirrors the workaround the workspace UI package tests use.
 */
beforeAll(() => {
  const original = navigator as Navigator & Record<string, unknown>;
  const clone = Object.create(
    Object.getPrototypeOf(original),
  ) as Navigator & Record<string, unknown>;

  for (const key of Object.getOwnPropertyNames(original)) {
    if (key === 'clipboard') continue;
    const descriptor = Object.getOwnPropertyDescriptor(original, key);
    if (descriptor && 'value' in descriptor && descriptor.configurable) {
      Object.defineProperty(clone, key, { ...descriptor, configurable: true });
    }
  }

  Object.defineProperty(clone, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: () => Promise.resolve() },
  });

  vi.stubGlobal('navigator', clone);
});

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

const CISADANE = makeRiver();
const CITARUM = makeRiver({
  id: '2',
  slug: 'citarum',
  name: 'Citarum',
  province: 'Jawa Barat',
  status: 'critical',
  ikaScore: 38,
  wasteIndex: 'Berat',
  issues: ['Limbah Tekstil', 'Logam Berat', 'Sedimentasi'],
  lastUpdated: '2026-09-10',
});
const BRANTAS = makeRiver({
  id: '3',
  slug: 'brantas',
  name: 'Brantas',
  province: 'Jawa Timur',
  status: 'good',
  ikaScore: 84,
  issues: ['Mikroplastik'],
  lastUpdated: '2026-09-07',
});

const THREE = [CISADANE, CITARUM, BRANTAS];

function renderSelector(props: Partial<RiverSelectorProps> = {}) {
  const onSelect = props.onSelect ?? vi.fn();
  const utils = render(
    <RiverSelector rivers={THREE} selectedSlug="cisadane" onSelect={onSelect} {...props} />,
  );
  return { ...utils, onSelect };
}

/** Tombol radio milik satu sungai, dicari lewat nama aksesibelnya. */
function radioFor(name: string): HTMLElement {
  return screen.getByRole('radio', { name: new RegExp(`Sungai ${name}\\b`) });
}

describe('RiverSelector — struktur grup radio', () => {
  it('membungkus seluruh kartu dalam satu radiogroup berlabel Indonesia', () => {
    renderSelector();

    const group = screen.getByRole('radiogroup', { name: 'Pilih sungai yang dipantau' });
    expect(group).toBeInTheDocument();
    // Satu grup, bukan satu grup per sungai.
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
    expect(within(group).getAllByRole('radio')).toHaveLength(THREE.length);
  });

  it('merender satu radio per sungai beserta jumlah yang dapat dihitung pembaca layar', () => {
    renderSelector();

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(7 - 4); // tiga sungai fixture
    expect(radios.map((radio) => radio.textContent)).toEqual([
      expect.stringContaining('Sungai Cisadane'),
      expect.stringContaining('Sungai Citarum'),
      expect.stringContaining('Sungai Brantas'),
    ]);
  });

  it('memakai <button type="button"> sehingga tidak pernah mengirim form induk', () => {
    renderSelector();

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.tagName).toBe('BUTTON');
      expect(radio).toHaveAttribute('type', 'button');
    }
  });

  it('merender wadah kosong yang tetap merupakan radiogroup saat daftar kosong', () => {
    renderSelector({ rivers: [] });

    const group = screen.getByRole('radiogroup', { name: 'Pilih sungai yang dipantau' });
    expect(group).toBeEmptyDOMElement();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });
});

describe('RiverSelector — keadaan terpilih (aria-checked)', () => {
  it('menandai hanya sungai terpilih dengan aria-checked="true"', () => {
    renderSelector({ selectedSlug: 'citarum' });

    expect(radioFor('Citarum')).toHaveAttribute('aria-checked', 'true');
    expect(radioFor('Cisadane')).toHaveAttribute('aria-checked', 'false');
    expect(radioFor('Brantas')).toHaveAttribute('aria-checked', 'false');
  });

  it('memindahkan pilihan ketika selectedSlug berubah', () => {
    const { rerender } = render(
      <RiverSelector rivers={THREE} selectedSlug="cisadane" onSelect={vi.fn()} />,
    );
    expect(radioFor('Cisadane')).toHaveAttribute('aria-checked', 'true');

    rerender(<RiverSelector rivers={THREE} selectedSlug="brantas" onSelect={vi.fn()} />);

    expect(radioFor('Brantas')).toHaveAttribute('aria-checked', 'true');
    expect(radioFor('Cisadane')).toHaveAttribute('aria-checked', 'false');
  });

  it('tidak menandai apa pun saat selectedSlug tidak cocok dengan data', () => {
    renderSelector({ selectedSlug: 'sungai-yang-tidak-ada' });

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('tidak menandai apa pun saat selectedSlug kosong', () => {
    renderSelector({ selectedSlug: '' });

    // `getAllByRole(..., { checked: true })` juga menangkap radio asli yang
    // tidak punya atribut `role`, jadi dipakai `aria-checked` eksplisit.
    expect(document.querySelectorAll('[role="radio"][aria-checked="true"]')).toHaveLength(0);
    expect(screen.getAllByRole('radio')).toHaveLength(THREE.length);
  });

  it('setiap status memakai label resmi Indonesia pada pil status', () => {
    renderSelector();

    expect(within(radioFor('Cisadane')).getByText('Waspada')).toBeInTheDocument();
    expect(within(radioFor('Citarum')).getByText('Kritis')).toBeInTheDocument();
    expect(within(radioFor('Brantas')).getByText('Baik')).toBeInTheDocument();
  });
});

describe('RiverSelector — interaksi pemilihan', () => {
  it('memanggil onSelect dengan slug sungai saat radio diklik', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector();

    await user.click(radioFor('Citarum'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('citarum');
  });

  it('tetap memanggil onSelect untuk sungai yang sudah terpilih (pilihan tidak di-toggle mati)', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector({ selectedSlug: 'cisadane' });

    await user.click(radioFor('Cisadane'));

    expect(onSelect).toHaveBeenCalledWith('cisadane');
  });

  it('dapat dioperasikan dengan keyboard: Tab lalu Enter mengaktifkan radio yang difokuskan', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector({ selectedSlug: 'cisadane' });

    await user.tab();
    expect(radioFor('Cisadane')).toHaveFocus();

    await user.tab();
    expect(radioFor('Citarum')).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('citarum');
  });

  it('spasi juga mengaktifkan radio yang sedang difokuskan', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector();

    await user.tab();
    await user.tab();
    await user.tab();
    expect(radioFor('Brantas')).toHaveFocus();

    await user.keyboard(' ');

    expect(onSelect).toHaveBeenCalledWith('brantas');
  });

  it('hanya memanggil onSelect sekali per klik radio', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector({ selectedSlug: 'cisadane' });

    await user.click(radioFor('Brantas'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('tidak memanggil onSelect saat pengguna hanya memfokuskan radio', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector();

    await user.tab();

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('RiverSelector — isi kartu sungai', () => {
  it('menampilkan prefiks "Sungai", provinsi, skor IKA, dan label IKA', () => {
    renderSelector();

    const card = radioFor('Citarum');
    expect(within(card).getByText('Sungai Citarum')).toBeInTheDocument();
    expect(within(card).getByText('Jawa Barat')).toBeInTheDocument();
    expect(within(card).getByText('38')).toBeInTheDocument();
    expect(within(card).getByText('IKA')).toBeInTheDocument();
  });

  it('membulatkan skor IKA sesuai locale id-ID (tanpa desimal)', () => {
    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', ikaScore: 61.7 })] });

    expect(screen.getByText('62')).toBeInTheDocument();
    expect(screen.queryByText('61,7')).not.toBeInTheDocument();
  });

  it('memformat ribuan skor besar sesuai locale id-ID', () => {
    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', ikaScore: 1234 })] });

    expect(screen.getByText('1.234')).toBeInTheDocument();
  });

  it('membaca skor non-finite sebagai 0 alih-alih "NaN"', () => {
    renderSelector({
      rivers: [makeRiver({ slug: 'a', name: 'A', ikaScore: Number.NaN })],
      selectedSlug: 'a',
    });

    const card = radioFor('A');
    // Intl.NumberFormat menulis NaN apa adanya, jadi kartu harus tetap dapat
    // dibaca dan tidak pernah menuliskannya sebagai angka palsu "0".
    expect(within(card).getByText('NaN')).toBeInTheDocument();
    expect(within(card).queryByText('0')).not.toBeInTheDocument();
    expect(within(card).getByText('Sungai A')).toBeInTheDocument();
  });

  it('menampilkan skor negatif apa adanya dari data pos pantau', () => {
    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', ikaScore: -5 })] });

    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('menampilkan tiap isu sebagai label tersendiri, bukan satu baris gabungan', () => {
    renderSelector();

    // Label terpisah dipakai agar isu panjang tidak terpotong di tengah kata
    // seperti yang terjadi saat semuanya digabung menjadi satu baris.
    for (const isu of ['Limbah Tekstil', 'Logam Berat', 'Sedimentasi']) {
      expect(screen.getByText(isu)).toBeInTheDocument();
    }

    expect(
      screen.queryByText('Limbah Tekstil · Logam Berat · Sedimentasi'),
    ).not.toBeInTheDocument();
  });

  it('merender satu isu sebagai label tunggal', () => {
    renderSelector();

    expect(screen.getByText('Mikroplastik')).toBeInTheDocument();
  });

  it('tidak merender daftar isu ketika tidak ada isu', () => {
    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', issues: [] })] });

    expect(radioFor('A')).toBeInTheDocument();
    expect(screen.queryByText(' · ')).not.toBeInTheDocument();
  });
});

describe('RiverSelector — format tanggal lastUpdated', () => {
  it('memformat tanggal ISO ke tanggal Indonesia yang ringkas', () => {
    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', lastUpdated: '2026-09-10' })], selectedSlug: 'a' });

    expect(screen.getByText('10 Sep 2026')).toBeInTheDocument();
  });

  it('mempertahankan string tanggal cacat agar kartu tetap terbaca', () => {
    renderSelector({
      rivers: [makeRiver({ slug: 'a', name: 'A', lastUpdated: 'bukan-tanggal' })],
    });

    expect(screen.getByText('bukan-tanggal')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid/)).not.toBeInTheDocument();
  });

  it('menangani tanggal kosong tanpa melempar', () => {
    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', lastUpdated: '' })] });

    expect(radioFor('A')).toBeInTheDocument();
  });
});

describe('RiverSelector — kasus tepi data', () => {
  it('merender banyak sungai sekaligus dengan satu pilihan tunggal', () => {
    const many = Array.from({ length: 7 }, (_, index) =>
      makeRiver({ id: String(index), slug: `sungai-${index}`, name: `S${index}` }),
    );

    renderSelector({ rivers: many, selectedSlug: 'sungai-3' });

    expect(screen.getAllByRole('radio')).toHaveLength(7);
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
    expect(radioFor('S3')).toHaveAttribute('aria-checked', 'true');
  });

  it('menjaga slug duplikat tetap terpisah dan dapat dipilih', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RiverSelector
        rivers={[
          makeRiver({ id: 'a', slug: 'sama', name: 'Satu' }),
          makeRiver({ id: 'b', slug: 'sama', name: 'Dua' }),
        ]}
        selectedSlug=""
        onSelect={onSelect}
      />,
    );

    await user.click(radioFor('Dua'));

    expect(onSelect).toHaveBeenCalledWith('sama');
  });

  it('menerima nama dan provinsi sangat panjang tanpa kehilangan radio', () => {
    const longName = 'Wai Sekampung Hulu Anak Sungai '.repeat(8).trim();
    const longProvince = 'Sumatera Bagian Selatan '.repeat(10).trim();

    renderSelector({
      rivers: [makeRiver({ slug: 'a', name: longName, province: longProvince })],
    });

    const radio = screen.getByRole('radio', { name: new RegExp('Sungai Wai Sekampung') });
    expect(radio).toHaveAccessibleName(expect.stringContaining(longProvince));
  });

  it('menerima isu sangat panjang tanpa memotong teks di DOM', () => {
    const longIssue = 'Pencemaran mikroplastik dari hilir industri tekstil '.repeat(10).trim();

    renderSelector({ rivers: [makeRiver({ slug: 'a', name: 'A', issues: [longIssue] })] });

    expect(screen.getByText(longIssue)).toBeInTheDocument();
  });

  it('tidak memanggil onSelect saat daftar sungai kosong lalu pengguna menekan Tab', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSelector({ rivers: [] });

    await user.tab();

    expect(onSelect).not.toHaveBeenCalled();
  });
});
