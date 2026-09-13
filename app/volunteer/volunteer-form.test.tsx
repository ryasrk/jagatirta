import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rivers } from '@repo/data';

import { VolunteerForm } from './volunteer-form';

/* -------------------------------------------------------------------------- */
/*  Harness                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The required `Input` fields are labelled with a screen-reader-only
 * "(wajib diisi)" suffix, so their accessible name is "Nama Lengkap (wajib
 * diisi)". Matching on the stable prefix keeps these queries honest without
 * hard-coding the marker wording.
 */
const LABEL = {
  nama: /^Nama Lengkap/,
  whatsapp: /^Nomor WhatsApp/,
  email: /^Email/,
  domisili: /^Domisili/,
  sungai: /^Sungai pilihan/,
  motivasi: /^Motivasi/,
} as const;

function textbox(label: RegExp): HTMLInputElement | HTMLTextAreaElement {
  return screen.getByRole('textbox', { name: label }) as HTMLInputElement | HTMLTextAreaElement;
}

function selectFor(label: RegExp): HTMLSelectElement {
  return screen.getByRole('combobox', { name: label }) as HTMLSelectElement;
}

function progressNow(): string | null {
  return screen.getByRole('progressbar').getAttribute('aria-valuenow');
}

function interestBox(label: string | RegExp): HTMLInputElement {
  // An interest card's accessible name is "label + description", so anchor the match.
  const pattern = typeof label === 'string' ? new RegExp(`^${label}`) : label;
  return screen.getByRole('checkbox', { name: pattern }) as HTMLInputElement;
}

/**
 * Selects are controlled and start on a disabled placeholder whose `value=""`
 * is also React's default, so wait for the committed value to avoid reading a
 * stale one. Fake timers are never used here: `userEvent` with fake timers plus
 * the 900 ms simulated submit latency is fragile, and the real delay is short
 * enough to await.
 */
async function choose(select: HTMLSelectElement, value: string): Promise<void> {
  await userEvent.selectOptions(select, value);
  await waitFor(() => expect(select.value).toBe(value));
}

const IDENTITY = {
  nama: 'Sari Puspita',
  whatsapp: '81234567890',
  email: 'sari@email.com',
  domisili: 'Bandung',
} as const;

async function fillIdentity(): Promise<void> {
  await userEvent.type(textbox(LABEL.nama), IDENTITY.nama);
  await userEvent.type(textbox(LABEL.whatsapp), IDENTITY.whatsapp);
  await userEvent.type(textbox(LABEL.email), IDENTITY.email);
  await choose(selectFor(LABEL.domisili), IDENTITY.domisili);
}

async function goToStepTwo(): Promise<void> {
  await fillIdentity();
  await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
  await waitFor(() => expect(progressNow()).toBe('2'));
}

/** Fills both steps up to the final submit button, without clicking it. */
async function fillWholeForm(): Promise<void> {
  await goToStepTwo();
  await choose(selectFor(LABEL.sungai), 'citarum');
  await userEvent.click(interestBox('Uji Air'));
  await userEvent.click(interestBox('Dokumentasi'));
  await userEvent.type(textbox(LABEL.motivasi), 'Saya tinggal 200 meter dari Cisadane.');
}

afterEach(() => {
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------------- */
/*  Langkah 1 — render default                                                 */
/* -------------------------------------------------------------------------- */

describe('VolunteerForm — langkah 1', () => {
  it('opens on step 1 with the four identity fields and no preferences yet', () => {
    render(<VolunteerForm />);

    expect(screen.getByText('Empat kolom singkat, sekitar 40 detik. Data ini hanya dipakai koordinator untuk menghubungimu.')).toBeInTheDocument();

    expect(textbox(LABEL.nama)).toHaveValue('');
    expect(textbox(LABEL.whatsapp)).toHaveValue('');
    expect(textbox(LABEL.email)).toHaveValue('');
    expect(selectFor(LABEL.domisili)).toHaveValue('');

    // Step-two controls must not exist until step 1 validates.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: LABEL.motivasi })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kirim Pendaftaran/ })).not.toBeInTheDocument();
  });

  it('renders the step indicator and progressbar for step 1 of 2', () => {
    render(<VolunteerForm />);

    const steps = screen.getByRole('list', { name: 'Tahapan pendaftaran' });
    expect(within(steps).getByText('Data Diri')).toBeInTheDocument();
    expect(within(steps).getByText('Sedang diisi')).toBeInTheDocument();
    expect(within(steps).getByText('Preferensi')).toBeInTheDocument();
    expect(within(steps).getByText('Berikutnya')).toBeInTheDocument();

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '2');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-label', 'Langkah 1 dari 2');
  });

  it('prefixes the WhatsApp field with +62 and shuffles non-digits out as it is typed', async () => {
    render(<VolunteerForm />);

    const whatsapp = textbox(LABEL.whatsapp);
    expect(whatsapp).toHaveAttribute('type', 'tel');
    expect(whatsapp).toHaveAttribute('inputmode', 'tel');

    const adornment = document.querySelector('[data-adornment="prefix"]');
    expect(adornment).toHaveTextContent('+62');

    await userEvent.type(whatsapp, '0812-3456 7890abc');
    // Zeros, separators and letters are all dropped, so only 8… digits remain.
    expect(whatsapp).toHaveValue('081234567890');
  });

  it('offers every supported city as a domisili option', () => {
    render(<VolunteerForm />);

    const domisili = selectFor(LABEL.domisili);
    // Placeholder + twelve cities.
    expect(domisili.options).toHaveLength(13);
    expect(domisili).toHaveTextContent('Pilih kota terdekat');

    const cities = Array.from(domisili.options)
      .map((option) => option.textContent)
      .filter((text) => text !== 'Pilih kota terdekat');
    expect(cities).toEqual([
      'Jakarta',
      'Bogor',
      'Bandung',
      'Semarang',
      'Surabaya',
      'Malang',
      'Solo',
      'Yogyakarta',
      'Balikpapan',
      'Samarinda',
      'Banjarmasin',
      'Palembang',
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/*  Validasi langkah 1                                                         */
/* -------------------------------------------------------------------------- */

describe('VolunteerForm — validasi data diri', () => {
  it('blocks "Lanjut" on an empty step and reports every field in Indonesian', async () => {
    render(<VolunteerForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

    expect(progressNow()).toBe('1');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    expect(screen.getByText('Nama lengkap wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Nomor WhatsApp wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Pilih domisili terdekat.')).toBeInTheDocument();
  });

  it('marks each invalid control with aria-invalid and points it at its own message', async () => {
    render(<VolunteerForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

    for (const field of [textbox(LABEL.nama), textbox(LABEL.whatsapp), textbox(LABEL.email)]) {
      expect(field).toHaveAttribute('aria-invalid', 'true');
      const describedBy = field.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      // The description is a real element, and it carries the error copy.
      expect(document.getElementById(describedBy!)).toHaveTextContent(/wajib diisi/);
    }

    expect(selectFor(LABEL.domisili)).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a two-character name and whitespace-only name', async () => {
    render(<VolunteerForm />);

    await userEvent.type(textbox(LABEL.nama), 'Sa');
    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByText('Tuliskan nama lengkap minimal 3 karakter.')).toBeInTheDocument();

    await userEvent.clear(textbox(LABEL.nama));
    await userEvent.type(textbox(LABEL.nama), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByText('Nama lengkap wajib diisi.')).toBeInTheDocument();
  });

  it.each([
    ['81234567', 'eight digits — one short of the nine-digit minimum'],
    ['81234567890123', 'fourteen digits — one past the thirteen-digit maximum'],
    ['71234567890', 'does not start with 8'],
  ])('rejects the WhatsApp number %s (%s)', async (number) => {
    render(<VolunteerForm />);

    await userEvent.type(textbox(LABEL.whatsapp), number);
    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

    expect(
      screen.getByText('Masukkan nomor tanpa angka 0 atau +62 di depan, mis. 81234567890.'),
    ).toBeInTheDocument();
    expect(progressNow()).toBe('1');
  });

  it.each(['8123456789', '812345678901', '8123456789012'])(
    'accepts the WhatsApp number %s as valid length',
    async (number) => {
      render(<VolunteerForm />);

      await userEvent.type(textbox(LABEL.whatsapp), number);
      await userEvent.type(textbox(LABEL.nama), 'Sari Puspita');
      await userEvent.type(textbox(LABEL.email), 'sari@email.com');
      await choose(selectFor(LABEL.domisili), 'Bandung');
      await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

      await waitFor(() => expect(progressNow()).toBe('2'));
    },
  );

  it.each(['sari', 'sari@', 'sari@email', 'sari@email.c', '@email.com'])(
    'rejects the malformed email %s',
    async (email) => {
      render(<VolunteerForm />);

      await userEvent.type(textbox(LABEL.email), email);
      await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

      expect(screen.getByText('Format email belum benar, mis. nama@email.com.')).toBeInTheDocument();
    },
  );

  it('clears a field error as soon as that field is corrected', async () => {
    render(<VolunteerForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(screen.getByText('Nama lengkap wajib diisi.')).toBeInTheDocument();

    await userEvent.type(textbox(LABEL.nama), 'Sari Puspita');

    expect(screen.queryByText('Nama lengkap wajib diisi.')).not.toBeInTheDocument();
    // Other fields keep their errors; only the edited one is cleared.
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
  });

  it('records the WhatsApp value with the dropped zero, as the success card re-adds +62', async () => {
    render(<VolunteerForm />);

    await userEvent.type(textbox(LABEL.whatsapp), '081234567890');
    // The stored value still carries the leading zero — the validator strips it,
    // the state does not — so this documents the actual behaviour.
    expect(textbox(LABEL.whatsapp)).toHaveValue('081234567890');
  });
});

/* -------------------------------------------------------------------------- */
/*  Langkah 2 — render                                                         */
/* -------------------------------------------------------------------------- */

describe('VolunteerForm — langkah 2', () => {
  it('swaps to the preference fields and flips the step indicator', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    expect(
      screen.getByText('Terakhir, beri tahu kami di mana dan bagaimana kamu ingin terlibat.'),
    ).toBeInTheDocument();

    // Identity fields are replaced, not merely hidden behind CSS.
    expect(screen.queryByRole('textbox', { name: LABEL.nama })).not.toBeInTheDocument();
    expect(textbox(LABEL.motivasi)).toBeInTheDocument();

    const steps = screen.getByRole('list', { name: 'Tahapan pendaftaran' });
    expect(within(steps).getByText('Selesai')).toBeInTheDocument();
    expect(within(steps).getAllByText('Sedang diisi')).toHaveLength(1);
    expect(within(steps).queryByText('Berikutnya')).not.toBeInTheDocument();

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-label', 'Langkah 2 dari 2');
  });

  it('offers the optional river selection built from the shared river data, plus a back button', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    const sungai = selectFor(LABEL.sungai);
    expect(sungai.options).toHaveLength(rivers.length + 1);
    expect(
      screen.getByRole('option', { name: 'Cisadane — Jawa Barat – Banten' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Musi — Sumatera Selatan' }),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Kembali' })).toHaveAttribute('type', 'button');
  });

  it('renders all five interest cards with their descriptions and the two-choice budget', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    for (const label of ['Uji Air', 'Dokumentasi', 'Logistik', 'Edukasi', 'Aksi Lapangan']) {
      expect(interestBox(label)).not.toBeChecked();
    }
    expect(screen.getByText('Pilih maksimal dua bidang agar waktumu terpakai fokus.')).toBeInTheDocument();
    expect(
      screen.getByText('Mengukur pH, oksigen terlarut, dan kekeruhan langsung di titik pantau.'),
    ).toBeInTheDocument();

    // The quota counter is part of the group's description, and each unselected
    // card describes itself with its own explanation.
    const group = screen.getAllByRole('group', { name: /Bidang minat/ })[0];
    expect(group).toHaveAttribute('aria-describedby');
    expect(document.getElementById(group.getAttribute('aria-describedby')!)).toHaveTextContent('0/2 dipilih');
    expect(interestBox('Uji Air')).toHaveAttribute('aria-describedby');
  });

  it('lets the volunteer go back to step 1 and keeps what was already typed', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    await userEvent.click(screen.getByRole('button', { name: 'Kembali' }));

    expect(progressNow()).toBe('1');
    expect(textbox(LABEL.nama)).toHaveValue(IDENTITY.nama);
    expect(textbox(LABEL.email)).toHaveValue(IDENTITY.email);
    expect(selectFor(LABEL.domisili)).toHaveValue(IDENTITY.domisili);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('keeps the motivation textarea auto-resizing and optional', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    const motivasi = textbox(LABEL.motivasi);
    expect(motivasi.tagName).toBe('TEXTAREA');
    expect(motivasi).toHaveAttribute('data-autoresize', 'true');
    expect(motivasi).not.toBeRequired();

    await userEvent.type(motivasi, 'Saya ingin menjaga sungai di kampung saya.');
    expect(motivasi).toHaveValue('Saya ingin menjaga sungai di kampung saya.');
  });
});

/* -------------------------------------------------------------------------- */
/*  Bidang minat — batas dua pilihan                                           */
/* -------------------------------------------------------------------------- */

describe('VolunteerForm — batas bidang minat', () => {
  it('counts selections up and stops accepting a third choice', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    await userEvent.click(interestBox('Uji Air'));
    expect(interestBox('Uji Air')).toBeChecked();
    expect(document.getElementById(
      screen.getAllByRole('group', { name: /Bidang minat/ })[0].getAttribute('aria-describedby')!,
    )).toHaveTextContent('1/2 dipilih');

    const third = interestBox('Logistik');
    // Not yet locked: only one slot used.
    expect(third).not.toHaveAttribute('aria-disabled');

    await userEvent.click(interestBox('Dokumentasi'));
    expect(interestBox('Dokumentasi')).toBeChecked();
    expect(document.getElementById(
      screen.getAllByRole('group', { name: /Bidang minat/ })[0].getAttribute('aria-describedby')!,
    )).toHaveTextContent('2/2 dipilih');

    // At the cap the remaining cards are locked and say how to proceed.
    expect(third).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getAllByText('Lepas satu pilihan dulu')).toHaveLength(3);
    expect(screen.getByText(/lepas satu pilihan untuk memilih yang lain\./)).toBeInTheDocument();

    await userEvent.click(third);
    expect(third).not.toBeChecked();
  });

  it('always allows releasing a chosen interest, even at the cap', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    await userEvent.click(interestBox('Uji Air'));
    await userEvent.click(interestBox('Dokumentasi'));

    // A selected card stays operable: the cap locks only the unselected ones.
    expect(interestBox('Uji Air')).not.toHaveAttribute('aria-disabled');
    await userEvent.click(interestBox('Uji Air'));

    expect(interestBox('Uji Air')).not.toBeChecked();
    expect(interestBox('Dokumentasi')).toBeChecked();
    expect(interestBox('Logistik')).not.toHaveAttribute('aria-disabled');
    expect(screen.getByText('Maksimal 2 pilihan')).toBeInTheDocument();
  });

  it('toggles a single choice off again', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    await userEvent.click(interestBox('Edukasi'));
    expect(interestBox('Edukasi')).toBeChecked();

    await userEvent.click(interestBox('Edukasi'));
    expect(interestBox('Edukasi')).not.toBeChecked();
  });
});

/* -------------------------------------------------------------------------- */
/*  Pengiriman                                                                 */
/* -------------------------------------------------------------------------- */

describe('VolunteerForm — pengiriman', () => {
  it('cannot be submitted from step 2 once the identity data is invalidated', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    // Clear a required field after validation has already passed.
    await userEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    await userEvent.clear(textbox(LABEL.email));
    await userEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    expect(progressNow()).toBe('1');
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
  });

  it('shows a pending state that blocks a second submit, then the success card', async () => {
    render(<VolunteerForm />);
    await fillWholeForm();

    const submit = screen.getByRole('button', { name: 'Kirim Pendaftaran' });
    expect(submit).toHaveAttribute('type', 'submit');

    await userEvent.click(submit);

    // Pending: the label changes, aria-busy is set, and the back button locks so
    // the form cannot be re-entered or re-submitted mid-flight.
    const pending = screen.getByRole('button', { name: /Mengirim/ });
    expect(pending).toHaveAttribute('aria-busy', 'true');
    expect(pending).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('button', { name: 'Kembali' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Kirim Pendaftaran' })).not.toBeInTheDocument();

    // There is no backend, so the delay resolves in place into the success card.
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Terima kasih, pendaftaranmu tercatat!');
    expect(status).toHaveTextContent(/Koordinator wilayah akan menghubungimu lewat WhatsApp dalam 2–3 hari kerja/);
    // The form is gone, not merely hidden.
    expect(screen.queryByRole('button', { name: /Kirim/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('summarises the registration on the success card, including river and interests', async () => {
    render(<VolunteerForm />);
    await fillWholeForm();
    await userEvent.click(screen.getByRole('button', { name: 'Kirim Pendaftaran' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });

    const terms = screen.getAllByRole('term').map((node) => node.textContent);
    const definitions = screen.getAllByRole('definition').map((node) => node.textContent);

    expect(terms).toEqual(['Nama', 'WhatsApp', 'Sungai pilihan', 'Bidang minat']);
    expect(definitions).toEqual([
      IDENTITY.nama,
      // The success card re-attaches the country code to the entered digits.
      `+62${IDENTITY.whatsapp}`,
      'Citarum — Jawa Barat',
      'Uji Air, Dokumentasi',
    ]);
  });

  it('omits the optional river and interest rows when neither was chosen', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();
    await userEvent.click(screen.getByRole('button', { name: 'Kirim Pendaftaran' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });

    const terms = screen.getAllByRole('term').map((node) => node.textContent);
    expect(terms).toEqual(['Nama', 'WhatsApp']);
    // Those two steps are optional, so no empty definition should be rendered.
    expect(screen.queryByText('Sungai pilihan')).not.toBeInTheDocument();
    expect(screen.queryByText('Bidang minat')).not.toBeInTheDocument();
  });

  it('accepts a registration whose motivation is left empty', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();
    await userEvent.click(screen.getByRole('button', { name: 'Kirim Pendaftaran' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });
    // Success proves the empty motivation was never treated as a blocker.
    expect(screen.getByRole('status')).toHaveTextContent('Terima kasih, pendaftaranmu tercatat!');
  });

  it('does not treat a whitespace-only motivation as content worth blocking on', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();
    await userEvent.type(textbox(LABEL.motivasi), '    ');
    await userEvent.click(screen.getByRole('button', { name: 'Kirim Pendaftaran' }));

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('re-runs step-one validation on a form submit and refuses to advance', async () => {
    render(<VolunteerForm />);

    // The form's own submit path (what Enter ultimately triggers) must apply the
    // same identity guard as the "Lanjut" button, so a bare form submit on an
    // empty step 1 reports the errors and stays put.
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText('Nama lengkap wajib diisi.')).toBeInTheDocument());
    expect(progressNow()).toBe('1');
    expect(screen.queryByText('Terima kasih, pendaftaranmu tercatat!')).not.toBeInTheDocument();
  });

  it('submits successfully from step 2 through the form submit event', async () => {
    render(<VolunteerForm />);
    await goToStepTwo();

    // Same guard, valid data: this is the path the Enter key takes inside the
    // motivation textarea, which has only one line and so does not swallow Enter.
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole('status')).toHaveTextContent('Terima kasih, pendaftaranmu tercatat!');
  });
});
