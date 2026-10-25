# AGENTS.md — Falette

Aturan kerja untuk asisten AI yang mengerjakan kode Falette. Baca file ini di awal setiap sesi, lalu baca bagian PRD yang relevan sebelum menulis kode.

## Sumber kebenaran

- `docs/PRD.md` — apa yang dibangun. Setiap kebutuhan punya ID, mis. `ENG-02`, `PAT-04`, `HOME-03`.
- `docs/falette-100-pattern.md` — Katalog Pola: ID, fase, kategori, parameter, dan catatan teknis tiap pola.
- `docs/wireframes/` — gambar wireframe dan diagram yang dirujuk dari PRD. Buka gambar yang relevan sebelum membangun UI.
- Bila file ini, PRD, dan katalog bertentangan, PRD yang berlaku. Sebutkan pertentangannya di laporan; jangan memilih sendiri diam-diam.

## Stack (Q2, sudah diputuskan)

- SvelteKit dengan TypeScript `strict`, dibangun dengan Vite.
- `@sveltejs/adapter-static`: semua halaman di-prerender (`prerender = true`, `trailingSlash = 'always'`).
- Hosting di Vercel sebagai situs statis. Tidak ada server, API route, `+page.server.ts`, atau fungsi serverless.
- Tes: Vitest untuk unit dan snapshot, Playwright untuk tes browser dan tangkapan layar preset.
- ESLint dan Prettier untuk gaya kode.
- Jangan menambah dependensi tanpa izin. Bila butuh library, usulkan dulu beserta alasan dan ukuran gzip-nya.

## Cara kerja per sesi

1. Kerjakan satu kebutuhan PRD atau satu pola per sesi. Ikuti urutan rilis: Fase 1a (engine dan ekspor), lalu Fase 1b (preview dan Home). Jangan mengerjakan P1 atau P2 sebelum semua P0 selesai.
2. Sebelum menulis kode, tulis rencana singkat: ID kebutuhan, file yang akan dibuat atau diubah, dan cara mengujinya. Untuk perubahan struktur atau arsitektur, tunggu persetujuan.
3. Bila PRD tidak mengatur sesuatu atau maknanya ambigu, berhenti dan tanyakan. Jangan menebak atau menambah perilaku baru.
4. Buat perubahan sekecil mungkin yang memenuhi kebutuhan. Jangan merapikan atau menulis ulang kode lain yang tidak diminta.
5. Akhiri dengan laporan singkat: apa yang berubah beserta ID kebutuhannya, perintah uji yang dijalankan dan hasilnya, serta apa yang belum diuji.

Urutan awal Fase 1a:

1. Siapkan proyek: SvelteKit, adapter-static, TypeScript strict, ESLint, Prettier, Vitest, Playwright, dan skrip `check`, `lint`, `test`, `build` di `package.json`. Belum ada fitur.
2. Inti engine: PRNG ber-seed (ENG-02), warna OKLCH (ENG-05), `render(config)` (ENG-01), dan kerangka uji snapshot (ENG-08).
3. Pola MVP satu per satu: `arcs`, `hills`, `waves`, `gradient` (PAT-01).
4. Ekspor SVG, kode SVG, dan PNG (EXP-01 sampai EXP-07), lalu link berbagi (SHR-01 sampai SHR-03, Lampiran B).
5. Setelah itu baru Fase 1b: halaman Create, preview, navbar, dan Home.

## Aturan engine (Bagian 10 PRD)

- `render(config)` adalah fungsi murni yang mengembalikan string SVG (ENG-01). Tanpa akses DOM, `window`, jam, atau penyimpanan.
- Semua keacakan berasal dari PRNG ber-seed (ENG-02). `Math.random()` dilarang di `src/lib/engine` dan `src/lib/patterns`.
- Satu modul per pola berisi `id`, nama, kategori, skema parameter, dan `generate()` (ENG-03). Daftar pola ringan dimuat di awal; modul pola dimuat terpisah (ENG-10).
- Koordinat relatif terhadap ukuran kanvas (ENG-04). Warna dihitung di OKLCH dan ditulis sebagai HEX sRGB (ENG-05).
- Tanpa filter SVG berat; efek lembut memakai `radialGradient` atau `linearGradient` (ENG-06).
- SVG hanya memakai atribut presentasi seperti `fill`, `stroke`, `opacity`, dan `stop-color`, tanpa atribut atau elemen `style` (ENG-01). Angka dibulatkan maksimal 2 desimal (EXP-02).
- Palet kurang warna: isi dengan gradasi OKLCH. Palet lebih warna: pakai slot berurutan dari yang pertama (ENG-11).
- Tombol Acak hanya mengganti seed, jadi seed yang berbeda harus menghasilkan variasi yang terlihat (PAT-04, PAT-10).
- ID pola dan kunci URL tidak boleh diganti atau dipakai ulang (PAT-09, Lampiran B).

## Aturan UI

- Ikuti wireframe dan teks di PRD. Jangan mengarang copy; headline, FAQ, dan label sudah ada di PRD.
- Semua teks UI lewat `src/lib/i18n/en.json` dan `id.json`, tidak ditulis langsung di komponen (NFR Bahasa). Nama menu dan section, judul kartu Features, serta tombol Create dan Preview tetap berbahasa Inggris di semua bahasa.
- Warna, jarak, dan radius hanya dari token CSS custom properties (THM-01). Tidak ada warna hardcode di komponen.
- Arah visual: UI netral abu-abu dengan satu warna aksen (Bagian 9). Antarmuka tanpa gradien dekoratif, bayangan tebal, atau emoji.
- Semua kontrol bisa dipakai dengan keyboard dan punya label. Hormati `prefers-reduced-motion` (NFR Aksesibilitas).
- Svelte memakai runes (`$state`, `$derived`, `$props`, `$effect`). Jangan memakai sintaks lama seperti `export let` atau `$:`.

## Larangan (sumber AI slop yang paling sering)

- Menambah fitur, halaman, animasi, atau pengaturan yang tidak ada di PRD.
- Menambah library, font, ikon, atau skrip pihak ketiga tanpa izin (NFR Keamanan, NFR Performa).
- Mengarang API atau opsi library. Cek dokumentasi versi yang terpasang.
- Mengubah, melewati (`.skip`), atau menghapus tes supaya lulus. Bila tes gagal, perbaiki kodenya atau laporkan.
- Memperbarui snapshot (ENG-08) tanpa alasan. Setelah rilis publik, perubahan hasil engine wajib menaikkan versi `v` (SHR-03); sebelum rilis, versi tetap 1.
- Meninggalkan kode mati, kode yang dikomentari, `console.log`, tipe `any`, atau TODO yang tidak disebut di laporan.
- Mengubah PRD, katalog, atau file ini tanpa diminta.

## Kriteria selesai

- `npm run check`, `npm run lint`, dan `npm test` lulus, dan `npm run build` berhasil.
- Uji snapshot engine lulus. Snapshot hanya berubah bila memang disengaja dan dijelaskan di laporan.
- JavaScript awal ≤ 100 KB gzip di Home dan ≤ 200 KB gzip di Create (NFR Performa).
- Pola baru lolos PAT-10: dicek di 6 preset perwakilan (`and-fhd20`, `ios-63`, `ipad-pro-13`, `mba-13`, `desk-uw`, `desk-5k`) dalam mode terang dan gelap, lalu diberi tanda ✅ di katalog.
- Laporan akhir menyebut ID kebutuhan, hasil uji, dan apa yang belum diuji.

## Peta folder

```
src/
  lib/
    engine/       render(), PRNG, warna OKLCH, utilitas SVG (tanpa Svelte)
    patterns/     satu file per pola (<id>.ts) dan daftar ringan: ID, nama, kategori
    export/       ekspor PNG dan SVG, kode SVG Rapi/Ringkas, nama file, dan worker PNG (tanpa Svelte)
    presets/      presets.json (Lampiran A) dan 5 templat overlay
    i18n/         en.json, id.json
    components/   komponen Svelte
  params/
    lang.ts       pencocok parameter bahasa: en, id
  routes/
    +page.svelte                     pengalih bahasa di / (NAV-11)
    create/+page.svelte              pengalih bahasa di /create/
    [lang=lang]/+page.svelte         Home
    [lang=lang]/create/+page.svelte  Create
tests/            tes unit, snapshot, dan browser
  harness/        halaman uji ekspor di browser untuk Playwright dan ponsel (tidak ikut ke situs)
docs/
  PRD.md
  falette-100-pattern.md
  wireframes/     gambar wireframe dan diagram dari PRD
```

## Konvensi

- Kode, nama variabel, komentar, dan pesan commit dalam bahasa Inggris. Teks yang dilihat pengguna hanya ada di file terjemahan.
- Nama file pola sama dengan ID-nya, mis. `src/lib/patterns/arcs.ts`.
- Commit kecil dengan ID kebutuhan di pesannya, mis. `feat(engine): seeded PRNG (ENG-02)`.
