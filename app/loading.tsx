/**
 * Keadaan memuat tingkat segmen untuk Jagatirta.
 *
 * Server Component murni: tanpa `'use client'`, tanpa hook, tanpa state.
 * Animasi hanya dipasang lewat varian `motion-safe:` sehingga pengguna yang
 * mengaktifkan "kurangi gerakan" melihat kerangka statis, bukan denyut lembut.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl px-5 py-section-normal sm:px-8 md:py-section-normal"
    >
      <span className="sr-only">Memuat halaman…</span>

      {/*
       * Kerangka halaman: blok-blok abu-abu lembut dengan denyut halus yang
       * memberi kesan kemajuan tanpa menampilkan informasi palsu.
       */}
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-3 w-32 rounded-full bg-editorial" />

        <div className="mt-6 h-10 w-full max-w-xl rounded-xl bg-editorial sm:h-12" />

        <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-editorial" />
        <div className="mt-3 h-4 w-4/5 max-w-xl rounded-full bg-editorial" />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((kunci) => (
            <div
              key={kunci}
              className="rounded-2xl border border-editorial bg-surface p-5 sm:p-6"
            >
              <div className="h-40 w-full rounded-xl bg-editorial" />
              <div className="mt-5 h-5 w-3/4 rounded-full bg-editorial" />
              <div className="mt-3 h-4 w-full rounded-full bg-editorial" />
              <div className="mt-2 h-4 w-2/3 rounded-full bg-editorial" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
