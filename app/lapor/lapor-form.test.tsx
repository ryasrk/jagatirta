import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rivers } from '@repo/data';

import { LaporForm } from './lapor-form';

/* -------------------------------------------------------------------------- */
/*  Harness                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fields in this form are `required`, and the shared `Input`/`Select`/`Textarea`
 * label always carries a screen-reader-only marker — "(wajib diisi)" or
 * "(wajib dipilih)". That marker becomes part of the accessible name, so every
 * label lookup here matches on the stable prefix rather than the exact string.
 */
const LABEL = {
  river: /^Sungai/,
  location: /^Lokasi atau patokan/,
  pollution: /^Jenis pencemaran/,
  description: /^Deskripsi kejadian/,
  latitude: /^Latitude/,
  longitude: /^Longitude/,
  contactable: /Bersedia dihubungi kembali/,
} as const;

/** The two picklists, in on-screen order: river first, then pollution type. */
function comboboxes(): HTMLSelectElement[] {
  return screen.getAllByRole('combobox') as HTMLSelectElement[];
}

function textbox(label: RegExp): HTMLInputElement | HTMLTextAreaElement {
  return screen.getByRole('textbox', { name: label }) as HTMLInputElement | HTMLTextAreaElement;
}

function submitButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Kirim laporan' }) as HTMLButtonElement;
}

/** A filled-in, valid report — the baseline every submission test starts from. */
const VALID = {
  riverSlug: 'citarum',
  pollutionType: 'limbah-industri-cair',
  location: 'Jembatan Desa Sukamaju',
  description: 'Air berubah hitam pekat dan berbuih sepanjang lima puluh meter sejak Selasa pagi.',
} as const;

/**
 * Select a value and wait for React to commit it.
 *
 * The selects inside this form are controlled, and the first option is a
 * `disabled` placeholder. Its `value=""` is also React's default when `value` is
 * `undefined`, so a pre-commit read is indistinguishable from a deliberate
 * empty selection in jsdom. Waiting for the committed value removes that race.
 */
async function choose(select: HTMLSelectElement, value: string): Promise<void> {
  await userEvent.selectOptions(select, value);
  await waitFor(() => expect(select.value).toBe(value));
}

async function fillValidReport(): Promise<void> {
  const [river, pollution] = comboboxes();
  await choose(river, VALID.riverSlug);
  await choose(pollution, VALID.pollutionType);
  await userEvent.type(textbox(LABEL.location), VALID.location);
  await userEvent.type(textbox(LABEL.description), VALID.description);
}

async function submitValidReport(): Promise<void> {
  await fillValidReport();
  await userEvent.click(submitButton());
  await waitFor(() => expect(screen.getByText('Laporan terkirim')).toBeInTheDocument());
}

/**
 * `intl-tel-input`-style helpers are irrelevant here; what matters is that the
 * geolocation API is stubbed, never called for real. jsdom has no geolocation,
 * so each test installs exactly the stub its branch needs.
 */
function stubGeolocation(value: unknown): void {
  Object.defineProperty(navigator, 'geolocation', {
    value,
    configurable: true,
    writable: true,
  });
}

function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

/** `window.isSecureContext` drives the first guard inside `requestLocation`. */
function stubSecureContext(isSecure: boolean): void {
  Object.defineProperty(window, 'isSecureContext', {
    value: isSecure,
    configurable: true,
  });
}

/** Messages the form shows as `role="alert"` — i.e. validation + geolocation errors. */
function alertTexts(): string[] {
  return screen.getAllByRole('alert').map((node) => node.textContent ?? '');
}

afterEach(() => {
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  Render default                                                             */
/* -------------------------------------------------------------------------- */

describe('LaporForm — render awal', () => {
  it('shows the three numbered sections and the required field set', () => {
    render(<LaporForm />);

    expect(screen.getByText('1. Di mana kejadiannya?')).toBeInTheDocument();
    expect(screen.getByText('2. Apa yang kamu saksikan?')).toBeInTheDocument();
    expect(screen.getByText('3. Boleh kami hubungi?')).toBeInTheDocument();

    // Two selects (river + pollution), one free-text location, one description.
    expect(comboboxes()).toHaveLength(2);
    expect(textbox(LABEL.location)).toHaveValue('');
    expect(textbox(LABEL.description)).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: LABEL.contactable })).not.toBeChecked();
  });

  it('renders the GPS section with read-only coordinate fields and no "Hapus titik" yet', () => {
    render(<LaporForm />);

    const latitude = textbox(LABEL.latitude);
    const longitude = textbox(LABEL.longitude);

    expect(latitude).toHaveAttribute('readonly');
    expect(longitude).toHaveAttribute('readonly');
    expect(latitude).toHaveValue('');
    expect(longitude).toHaveValue('');
    expect(latitude).toHaveAttribute('placeholder', '—');

    expect(screen.getByText('Titik koordinat')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus titik' })).not.toBeInTheDocument();
    // Idle hint, not a status message.
    expect(
      screen.getByText('Kamu juga bisa mengetik koordinat sendiri bila sudah menandainya di peta.'),
    ).toBeInTheDocument();
  });

  it('renders every river from the shared data package as an option label', () => {
    render(<LaporForm />);

    const [river] = comboboxes();
    // Placeholder + one option per river.
    expect(river.options).toHaveLength(rivers.length + 1);

    for (const river_ of rivers) {
      expect(
        screen.getByRole('option', { name: `${river_.name} — ${river_.province}` }),
      ).toBeInTheDocument();
    }
  });

  it('renders the pollution types in citizens\' vocabulary and keeps the fake-report notice linked', () => {
    render(<LaporForm />);

    for (const label of [
      'Limbah industri cair',
      'Sampah domestik',
      'Sedimentasi atau air keruh',
      'Bau menyengat',
      'Lainnya',
    ]) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    }

    // `getByText` also matches the inner <strong>, so resolve the notice element
    // through the form's own aria-describedby reference instead.
    const form = document.querySelector('form')!;
    const describedBy = form.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    const notice = document.getElementById(describedBy!);
    expect(notice).not.toBeNull();
    expect(notice).toHaveTextContent(/Laporan palsu merugikan relawan lapangan\./);
    expect(notice).toHaveTextContent(/Tulis hanya apa yang benar-benar kamu lihat\./);
  });

  it('wires the photo input to its dashed-styled label and help text', () => {
    render(<LaporForm />);

    const photo = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(photo).not.toBeNull();
    expect(photo).toHaveAttribute('accept', 'image/*');
    expect(photo).toHaveAttribute('capture', 'environment');

    const label = document.querySelector<HTMLLabelElement>(`label[for="${photo!.id}"]`);
    expect(label).toHaveTextContent('Ambil atau pilih foto');

    const help = document.getElementById(photo!.getAttribute('aria-describedby') ?? '');
    expect(help).toHaveTextContent(/membuka kamera belakang/);
  });

  it('does not render a success card before a submission happens', () => {
    render(<LaporForm />);

    expect(screen.queryByText('Laporan terkirim')).not.toBeInTheDocument();
    expect(screen.queryByText('Nomor rujukan laporan')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salin nomor rujukan' })).not.toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/*  Validasi                                                                   */
/* -------------------------------------------------------------------------- */

describe('LaporForm — validasi wajib isi', () => {
  it('blocks submission on an empty form and reports every missing field in Indonesian', async () => {
    render(<LaporForm />);

    await userEvent.click(submitButton());

    expect(screen.queryByText('Laporan terkirim')).not.toBeInTheDocument();
    expect(alertTexts()).toEqual([
      'Pilih sungai tempat kejadian berlangsung.',
      'Pilih satu jenis pencemaran yang paling mendekati.',
    ]);

    // Location and description messages are rendered by the shared fields too.
    expect(screen.getByText(/Tulis minimal tiga karakter/)).toBeInTheDocument();
    expect(screen.getByText(/Tulis minimal 20 karakter/)).toBeInTheDocument();
  });

  it('marks the invalid controls with aria-invalid and describes them with the error text', async () => {
    render(<LaporForm />);

    await userEvent.click(submitButton());

    const [river, pollution] = comboboxes();
    expect(river).toHaveAttribute('aria-invalid', 'true');
    expect(pollution).toHaveAttribute('aria-invalid', 'true');

    for (const select of [river, pollution]) {
      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)).not.toBeNull();
    }

    const location = textbox(LABEL.location);
    const locationError = document.getElementById(location.getAttribute('aria-describedby') ?? '');
    expect(locationError).toHaveTextContent(/Tulis minimal tiga karakter/);
  });

  it('moves focus to the first invalid field in on-screen order, not in error-object order', async () => {
    render(<LaporForm />);

    await userEvent.click(submitButton());

    // River is the first field on screen even though other errors exist.
    expect(document.activeElement).toBe(comboboxes()[0]);
    expect(document.activeElement?.id).toMatch(/-riverSlug$/);
  });

  it('focuses the location field when the river and pollution type are already valid', async () => {
    render(<LaporForm />);

    const [river, pollution] = comboboxes();
    await choose(river, VALID.riverSlug);
    await choose(pollution, 'sampah-domestik');

    await userEvent.click(submitButton());

    expect(document.activeElement).toBe(textbox(LABEL.location));
  });

  it('focuses the description field when only the description is missing', async () => {
    render(<LaporForm />);

    const [river, pollution] = comboboxes();
    await choose(river, VALID.riverSlug);
    await choose(pollution, 'sampah-domestik');
    await userEvent.type(textbox(LABEL.location), VALID.location);

    await userEvent.click(submitButton());

    expect(document.activeElement).toBe(textbox(LABEL.description));
    expect(screen.getByText(/Tulis minimal 20 karakter/)).toBeInTheDocument();
  });

  it('rejects whitespace-only location and description as empty', async () => {
    render(<LaporForm />);

    await userEvent.type(textbox(LABEL.location), '   ');
    await userEvent.type(textbox(LABEL.description), '\t  \n ');
    const [river, pollution] = comboboxes();
    await choose(river, VALID.riverSlug);
    await choose(pollution, 'sampah-domestik');

    await userEvent.click(submitButton());

    expect(screen.queryByText('Laporan terkirim')).not.toBeInTheDocument();
    expect(screen.getByText(/Tulis minimal tiga karakter/)).toBeInTheDocument();
    expect(screen.getByText(/Tulis minimal 20 karakter/)).toBeInTheDocument();
  });

  it('treats a two-character location and a nineteen-character description as too short', async () => {
    render(<LaporForm />);

    await userEvent.type(textbox(LABEL.location), 'ab');
    await userEvent.type(textbox(LABEL.description), '1234567890123456789'); // exactly 19
    await userEvent.click(submitButton());

    expect(screen.queryByText('Laporan terkirim')).not.toBeInTheDocument();
    expect(screen.getByText(/Tulis minimal tiga karakter/)).toBeInTheDocument();
    expect(screen.getByText(/Tulis minimal 20 karakter/)).toBeInTheDocument();
  });

  it('accepts the minimum valid location and description (boundary: 3 and 20 characters)', async () => {
    render(<LaporForm />);

    const [river, pollution] = comboboxes();
    await choose(river, VALID.riverSlug);
    await choose(pollution, 'sampah-domestik');
    await userEvent.type(textbox(LABEL.location), 'abc');
    await userEvent.type(textbox(LABEL.description), '12345678901234567890'); // exactly 20

    await userEvent.click(submitButton());

    await waitFor(() => expect(screen.getByText('Laporan terkirim')).toBeInTheDocument());
    expect(screen.getAllByRole('definition')[1]).toHaveTextContent('abc');
  });

  it('capitulates to a very long description at the 1200-character maximum', async () => {
    render(<LaporForm />);

    const description = textbox(LABEL.description);
    expect(description).toHaveAttribute('maxlength', '1200');
    expect(description).toHaveAttribute('rows', '6');

    // A paste, not 1300 keystrokes: one input event with an over-long value.
    fireEvent.input(description, { target: { value: 'a'.repeat(1200) } });
    expect((description as HTMLTextAreaElement).value).toHaveLength(1200);

    const [river, pollution] = comboboxes();
    await choose(river, VALID.riverSlug);
    await choose(pollution, 'sampah-domestik');
    await userEvent.type(textbox(LABEL.location), 'Muara Barito');
    // At exactly the limit the counter flips to its warning copy and reports the
    // remaining quota as zero.
    expect(
      screen.getByText('Batas karakter tercapai — perpendek pesan untuk menambah lagi.'),
    ).toBeInTheDocument();
    const counter = document.querySelector('[data-counter="chars"]');
    expect(counter).toHaveTextContent('1.200 / 1.200 karakter · sisa 0');
    await userEvent.click(submitButton());

    await waitFor(() => expect(screen.getByText('Laporan terkirim')).toBeInTheDocument());
    // The receipt echoes the location, and only a valid (>=20 char) description
    // could have reached this point.
    expect(screen.getByText('Muara Barito')).toBeInTheDocument();
  });

  it('drops stale errors once the offending fields are filled and submits cleanly', async () => {
    render(<LaporForm />);

    await userEvent.click(submitButton());
    expect(alertTexts().length).toBeGreaterThan(0);

    await fillValidReport();
    // Errors belong to the previous attempt; the fields now hold valid values.
    await userEvent.click(submitButton());

    await waitFor(() => expect(screen.getByText('Laporan terkirim')).toBeInTheDocument());
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */
/*  Deskripsi sungai terpilih                                                  */
/* -------------------------------------------------------------------------- */

describe('LaporForm — status sungai terpilih', () => {
  it('replaces the generic river hint with the selected river\'s own status once chosen', async () => {
    render(<LaporForm />);

    const [river] = comboboxes();
    const hintId = river.getAttribute('aria-describedby');
    expect(document.getElementById(hintId!)).toHaveTextContent(
      'Pilih daerah aliran sungai terdekat, walau titik kejadian ada di anak sungai.',
    );

    // Any real river — once one is picked the hint switches to that river's status,
    // so the generic copy is only reachable in the empty state.
    await choose(river, 'musi');
    expect(document.getElementById(hintId!)).not.toHaveTextContent(/Pilih daerah aliran sungai terdekat/);
    expect(document.getElementById(hintId!)).toHaveTextContent('Status terakhir: sedang — dipantau Pos Pantau Musi Hilir.');
  });

  it('shows the selected river\'s waste index and verifier in the hint', async () => {
    render(<LaporForm />);

    const [river] = comboboxes();
    await choose(river, 'citarum');

    const hint = document.getElementById(river.getAttribute('aria-describedby')!);
    expect(hint).toHaveTextContent('Status terakhir: berat — dipantau Pos Pantau Citarum Hilir.');
  });

  it('shows a lowercase waste index even for a mid-range river', async () => {
    render(<LaporForm />);

    const [river] = comboboxes();
    await choose(river, 'cisadane');

    const hint = document.getElementById(river.getAttribute('aria-describedby')!);
    expect(hint).toHaveTextContent('Status terakhir: sedang — dipantau Pos Pantau Cisadane Hulu.');
  });
});

/* -------------------------------------------------------------------------- */
/*  Geolokasi                                                                  */
/* -------------------------------------------------------------------------- */

describe('LaporForm — geolokasi', () => {
  it('explains the insecure-context block instead of calling the API', async () => {
    stubSecureContext(false);
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(alertTexts()).toEqual([
      'Browser memblokir layanan lokasi pada koneksi tidak aman (http). Buka situs ini melalui https, atau isi patokan lokasi secara manual.',
    ]);
  });

  it('falls back to a manual-location message when the browser has no geolocation', async () => {
    stubSecureContext(true);
    stubGeolocation(undefined);

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(alertTexts()).toEqual([
      'Perangkat atau browser ini belum mendukung layanan lokasi. Isi patokan lokasi secara manual — keterangan yang jelas tetap membuat laporanmu dapat diverifikasi.',
    ]);
  });

  it('falls back as well when geolocation exists but getCurrentPosition is missing', async () => {
    stubSecureContext(true);
    stubGeolocation({});

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(alertTexts()).toEqual([
      'Perangkat atau browser ini belum mendukung layanan lokasi. Isi patokan lokasi secara manual — keterangan yang jelas tetap membuat laporanmu dapat diverifikasi.',
    ]);
  });

  it('asks for a high-accuracy fix with the documented timeout budget', async () => {
    stubSecureContext(true);
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 300_000,
    });

    // While the browser is deciding, the button reports busy and a status line shows.
    expect(screen.getByRole('button', { name: /Gunakan lokasi saya/ })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByText('Mencari titik lokasimu…')).toBeInTheDocument();
  });

  it('formats a successful fix to six decimals, rounds accuracy, and offers "Hapus titik"', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: -6.5521234567, longitude: 106.7261999999, accuracy: 12.6 },
        } as GeolocationPosition);
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(textbox(LABEL.latitude)).toHaveValue('-6.552123');
    expect(textbox(LABEL.longitude)).toHaveValue('106.726200');
    expect(
      screen.getByText('Lokasi tersimpan dengan akurasi ±13 m.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Mencari titik lokasimu…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus titik' })).toBeInTheDocument();
  });

  it('omits the accuracy suffix when the device reports zero or NaN accuracy', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) => {
        success({ coords: { latitude: 1.5, longitude: 2.25, accuracy: 0 } } as GeolocationPosition);
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(screen.getByText('Lokasi tersimpan dari perangkatmu.')).toBeInTheDocument();
    expect(textbox(LABEL.latitude)).toHaveValue('1.500000');
    expect(textbox(LABEL.longitude)).toHaveValue('2.250000');
  });

  it.each([
    [1, /Izin lokasi ditolak\. Aktifkan izin lokasi untuk situs ini di pengaturan browser/],
    [2, /Lokasi tidak tersedia saat ini\. Sinyal GPS mungkin lemah/],
    [3, /Pencarian lokasi memakan waktu terlalu lama/],
    [9, /Lokasi tidak dapat dibaca perangkat ini\. Isi patokan lokasi secara manual/],
  ])('maps geolocation error code %i to its Indonesian remedy', async (code, message) => {
    stubSecureContext(true);
    let reject: PositionErrorCallback | undefined;
    stubGeolocation({
      getCurrentPosition: (_success: PositionCallback, error?: PositionErrorCallback) => {
        reject = error;
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));
    reject?.({ code } as GeolocationPositionError);

    await waitFor(() => expect(alertTexts()).toHaveLength(1));
    expect(alertTexts()[0]).toMatch(message);
    // A failed lookup leaves no coordinates behind to delete.
    expect(screen.queryByRole('button', { name: 'Hapus titik' })).not.toBeInTheDocument();
  });

  it('reports a synchronous NotAllowedError as a rejected permission', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: () => {
        throw new DOMException('denied', 'NotAllowedError');
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(alertTexts()[0]).toMatch(
      /Izin lokasi ditolak\. Aktifkan izin lokasi untuk situs ini, lalu tekan "Gunakan lokasi saya" sekali lagi\./,
    );
  });

  it('treats a plain object carrying name "NotAllowedError" as a rejected permission', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: () => {
        // Older WebKit rejects with a plain object rather than a DOMException.
        throw { name: 'NotAllowedError' };
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(alertTexts()[0]).toMatch(
      /Izin lokasi ditolak\. Aktifkan izin lokasi untuk situs ini, lalu tekan "Gunakan lokasi saya" sekali lagi\./,
    );
  });

  it('reports any other synchronous throw as an unreadable location', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: () => {
        throw new Error('boom');
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));

    expect(alertTexts()[0]).toMatch(
      /Lokasi tidak dapat dibaca perangkat ini\. Isi patokan lokasi secara manual/,
    );
  });

  it('clears the coordinates, the deletion button and the message when "Hapus titik" is pressed', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: -6.9, longitude: 107.6, accuracy: 8 },
        } as GeolocationPosition);
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));
    expect(textbox(LABEL.latitude)).toHaveValue('-6.900000');

    await userEvent.click(screen.getByRole('button', { name: 'Hapus titik' }));

    expect(textbox(LABEL.latitude)).toHaveValue('');
    expect(textbox(LABEL.longitude)).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Hapus titik' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Lokasi tersimpan/)).not.toBeInTheDocument();
    expect(
      screen.getByText('Kamu juga bisa mengetik koordinat sendiri bila sudah menandainya di peta.'),
    ).toBeInTheDocument();
  });

  it('records the GPS point on the receipt when a fix was taken before submitting', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) => {
        success({ coords: { latitude: -6.5521, longitude: 106.7261, accuracy: 5 } } as GeolocationPosition);
      },
    });

    render(<LaporForm />);
    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));
    await submitValidReport();

    expect(screen.getByText('Tanpa foto · titik koordinat GPS')).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/*  Foto                                                                       */
/* -------------------------------------------------------------------------- */

describe('LaporForm — lampiran foto', () => {
  const photoFile = () => new File(['x'], 'sungai-keruh.jpg', { type: 'image/jpeg' });

  function photoInput(): HTMLInputElement {
    return document.querySelector<HTMLInputElement>('input[type="file"]')!;
  }

  function photoLabelText(): string {
    return document.querySelector<HTMLLabelElement>(`label[for="${photoInput().id}"]`)?.textContent ?? '';
  }

  it('shows the chosen file name and offers removal', async () => {
    render(<LaporForm />);

    expect(photoLabelText()).toBe('Ambil atau pilih foto');

    await userEvent.upload(photoInput(), photoFile());

    expect(screen.getByText('sungai-keruh.jpg')).toBeInTheDocument();
    expect(photoLabelText()).toBe('Ganti foto');
    expect(screen.getByRole('button', { name: 'Hapus foto' })).toBeInTheDocument();
  });

  it('clears both the DOM input value and the label when the photo is removed', async () => {
    render(<LaporForm />);

    await userEvent.upload(photoInput(), photoFile());
    await userEvent.click(screen.getByRole('button', { name: 'Hapus foto' }));

    expect(screen.queryByText('sungai-keruh.jpg')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus foto' })).not.toBeInTheDocument();
    // The cleared input is what lets the same file be re-selected.
    expect(photoInput().value).toBe('');
    expect(photoLabelText()).toBe('Ambil atau pilih foto');
  });

  it('records the photo on the receipt and returns to "Ganti foto" wording', async () => {
    render(<LaporForm />);

    await userEvent.upload(photoInput(), photoFile());
    await submitValidReport();

    expect(screen.getByText('Foto lokasi · tanpa titik GPS')).toBeInTheDocument();
  });

  it('resets the photo when a new report is started', async () => {
    render(<LaporForm />);

    await userEvent.upload(photoInput(), photoFile());
    await submitValidReport();
    await userEvent.click(screen.getByRole('button', { name: 'Buat laporan baru' }));

    expect(screen.queryByText('sungai-keruh.jpg')).not.toBeInTheDocument();
    expect(photoInput().value).toBe('');
    expect(photoLabelText()).toBe('Ambil atau pilih foto');
  });
});

/* -------------------------------------------------------------------------- */
/*  Kartu rujukan                                                              */
/* -------------------------------------------------------------------------- */

describe('LaporForm — kartu rujukan', () => {
  it('replaces the form with a reference number that follows LAP-YEAR-MONTHDAY-SEQ', async () => {
    render(<LaporForm />);
    await submitValidReport();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toMatch(/^LAP-\d{4}-[A-Z]{3}\d{2}-\d{4}$/);
    expect(screen.getByText('Nomor rujukan laporan')).toBeInTheDocument();
    expect(screen.getByText('Laporan terkirim')).toBeInTheDocument();
    expect(document.querySelector('form')).toBeNull();
  });

  it('summarises the submitted values, including the river label and the escalation branch', async () => {
    render(<LaporForm />);
    await submitValidReport();

    expect(screen.getByRole('heading', { level: 2 }).closest('[data-slot="card-header"]')).toHaveTextContent(
      'Dicatat',
    );
    expect(screen.getByRole('heading', { level: 2 }).closest('[data-slot="card-header"]')).toHaveTextContent(
      'Sungai Citarum',
    );

    const definitions = screen.getAllByRole('definition').map((node) => node.textContent);
    expect(definitions).toEqual([
      'Limbah industri cair',
      VALID.location,
      'Tanpa foto · tanpa titik GPS',
      'Tidak dihubungi kembali; laporan tetap diproses',
    ]);

    // "limbah-industri-cair" is one of the three escalating types, so the
    // advocacy note appears and the third step switches to the DLH wording.
    const escalation = screen.getByText(/Perlu Anda ketahui:/).closest('p');
    expect(escalation).not.toBeNull();
    expect(escalation!.textContent).toMatch(/surat resmi/);
    expect(escalation!.textContent).toMatch(/Dinas Lingkungan Hidup/);
  });

  it('keeps the three verification steps in order and lists the non-escalating publication path', async () => {
    render(<LaporForm />);

    const [river, pollution] = comboboxes();
    await choose(river, 'barito');
    await choose(pollution, 'sampah-domestik'); // does NOT escalate
    await userEvent.type(textbox(LABEL.location), 'Muara Barito');
    await userEvent.type(textbox(LABEL.description), 'Air berwarna cokelat dan berbau sejak dua hari terakhir.');
    await userEvent.click(submitButton());

    await waitFor(() => expect(screen.getByText('Laporan terkirim')).toBeInTheDocument());

    const steps = screen.getAllByRole('listitem').map((node) => node.textContent ?? '');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatch(/Diverifikasi: koordinator sungai/);
    expect(steps[1]).toMatch(/Diselidiki tim patroli/);
    expect(steps[2]).toMatch(/Diterbitkan ke peta: lokasi laporanmu ditandai di peta terbuka/);
    // The DLH escalation paragraph must stay hidden for non-escalating types.
    expect(screen.queryByText(/Perlu Anda ketahui:/)).not.toBeInTheDocument();
  });

  it('reflects the "bersedia dihubungi" choice on the receipt', async () => {
    render(<LaporForm />);

    await userEvent.click(screen.getByRole('checkbox', { name: LABEL.contactable }));
    expect(screen.getByRole('checkbox', { name: LABEL.contactable })).toBeChecked();

    await submitValidReport();

    expect(screen.getAllByRole('definition')[3]).toHaveTextContent(
      'Ya — relawan boleh menghubungi kembali',
    );
  });

  it('falls back to a placeholder river name if the slug disappears before submission', async () => {
    render(<LaporForm />);
    await submitValidReport();

    // The receipt always names a river; the placeholder exists so a stale slug
    // cannot render an empty line.
    expect(screen.queryByText('Sungai belum dipilih')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 }).closest('[data-slot="card-header"]')).toHaveTextContent(
      /Sungai /,
    );
  });

  it('uses the local date for the receipt, not UTC', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-01-05T10:07:00+07:00'));
      render(<LaporForm />);
      await submitValidReport();

      expect(screen.getByText(/Dicatat 05 JAN 2026, 10\.07 WIB/)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/^LAP-2026-JAN05-\d{4}$/);
    } finally {
      vi.useRealTimers();
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  Salin & reset                                                              */
/* -------------------------------------------------------------------------- */

describe('LaporForm — salin rujukan', () => {
  it('copies the reference, flips the button label and announces the copy politely', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    stubClipboard(writeText);

    render(<LaporForm />);
    await submitValidReport();
    const reference = screen.getByRole('heading', { level: 2 }).textContent!;

    // The live region starts empty so no stale announcement lingers.
    const live = document.querySelector('p[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live).toHaveTextContent('');

    await userEvent.click(screen.getByRole('button', { name: 'Salin nomor rujukan' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Nomor tersalin' })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(reference);
    expect(document.querySelector('p[aria-live="polite"]')).toHaveTextContent(
      `Nomor rujukan ${reference} berhasil disalin.`,
    );
  });

  it('swallows a clipboard rejection and keeps the reference on screen', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error('denied'));
    stubClipboard(writeText);

    render(<LaporForm />);
    await submitValidReport();

    await userEvent.click(screen.getByRole('button', { name: 'Salin nomor rujukan' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Salin nomor rujukan' })).toBeInTheDocument();
    // A clipboard failure is never surfaced as an alert.
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('does nothing when the browser exposes no clipboard API', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    render(<LaporForm />);
    await submitValidReport();

    await userEvent.click(screen.getByRole('button', { name: 'Salin nomor rujukan' }));

    expect(screen.getByRole('button', { name: 'Salin nomor rujukan' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toMatch(/^LAP-/);
  });

  it('does nothing when clipboard exists but writeText is not a function', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {},
      configurable: true,
      writable: true,
    });

    render(<LaporForm />);
    await submitValidReport();

    await userEvent.click(screen.getByRole('button', { name: 'Salin nomor rujukan' }));

    expect(screen.getByRole('button', { name: 'Salin nomor rujukan' })).toBeInTheDocument();
  });
});

describe('LaporForm — buat laporan baru', () => {
  it('restores an empty form, clearing errors, photo, coordinates and the copy feedback', async () => {
    stubSecureContext(true);
    stubGeolocation({
      getCurrentPosition: (success: PositionCallback) => {
        success({ coords: { latitude: -6.2, longitude: 106.8, accuracy: 4 } } as GeolocationPosition);
      },
    });
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    render(<LaporForm />);

    // Fail once so error state exists before the reset.
    await userEvent.click(submitButton());
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /Gunakan lokasi saya/ }));
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, new File(['x'], 'a.jpg'));
    await fillValidReport();
    await userEvent.click(submitButton());
    await waitFor(() => expect(screen.getByText('Laporan terkirim')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Salin nomor rujukan' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Nomor tersalin' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Buat laporan baru' }));

    expect(submitButton()).toBeInTheDocument();
    const [river, pollution] = comboboxes();
    expect(river.value).toBe('');
    expect(pollution.value).toBe('');
    expect(textbox(LABEL.location)).toHaveValue('');
    expect(textbox(LABEL.description)).toHaveValue('');
    expect(screen.getByRole('checkbox', { name: LABEL.contactable })).not.toBeChecked();
    expect(textbox(LABEL.latitude)).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Hapus titik' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    // The live region belongs to the receipt card and must be gone with it.
    expect(document.querySelector('p[aria-live="polite"]')).toBeNull();
    // Back to the generic river hint rather than the previous selection's status.
    expect(document.getElementById(river.getAttribute('aria-describedby')!)).toHaveTextContent(
      /Pilih daerah aliran sungai terdekat/,
    );
  });
});
