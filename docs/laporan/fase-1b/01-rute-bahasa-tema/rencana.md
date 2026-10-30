# Sesi 1: Rute, bahasa, dan tema — rencana

Sesi 1 dari [rencana Fase 1b](../rencana.md). **Status:** menunggu persetujuan FaL. Belum ada kode.

**Pengecekan awal:** main sudah memuat PR #13 (`b3b2744`). Branch `claude/charming-albattani-ms0114` dimulai ulang dari main itu.

---

## Cakupan

| Masuk | Belum (sesi lain) |
| --- | --- |
| NAV-10 (membaca bahasa tersimpan dan bahasa browser), NAV-11 (rute per bahasa, `hreflang`, pengalih `/` dan `/create/`) | Dropdown bahasa yang menyimpan pilihan (NAV-09, Sesi 2) |
| THM-01, THM-02, THM-04, THM-06 | Toggle tema (THM-03, THM-05, Sesi 2) |
| Rute 404 (tabel rute Bagian 6, T1), title dan meta description (NFR SEO) | Isi Home dan Create (Sesi 3–12) |
| NFR Bahasa (kamus per bahasa), NFR Keamanan (hash skrip inline, `vercel.json`), Q7 (`SITE_URL`) | Sitemap dan Open Graph (Sesi 13) |
| CI GitHub Actions (T5), anggaran JS, pemeriksa CSP, axe | |

Home dan Create masih kerangka: hanya judul halaman dari kamus, dengan token warna dan font yang sudah aktif.

---

## File

| File | Isi |
| --- | --- |
| `src/app.html` | Penanda `lang` di `<html>` dan tempat skrip inline setelah `%sveltekit.head%`, supaya skrip berada di bawah meta CSP |
| `src/hooks.server.ts` | Hanya berjalan saat prerender: mengisi `lang` dan menyisipkan skrip inline sesuai rute |
| `src/lib/inline/theme.js` | Semua halaman. Membaca `falette:theme` dari `localStorage` (try/catch), atau `prefers-color-scheme` bila kosong; memasang `data-theme`; mengikuti perubahan setelan sistem selama belum ada pilihan tersimpan (THM-02, THM-04) |
| `src/lib/inline/lang-redirect.js` | `/` dan `/create/`. Memilih `falette:lang` yang tersimpan, atau bahasa pertama di `navigator.languages` yang didukung, atau English; lalu `location.replace` dengan hash utuh (NAV-10, NAV-11) |
| `src/lib/inline/lang-404.js` | Halaman 404. Memasang `lang` dan judul sesuai bahasa tersimpan, dengan cadangan English |
| `vite.config.ts` | Hash SHA-256 ketiga skrip, dibaca dari file yang sama, ditambahkan ke `script-src` |
| `src/app.css` | Token warna, jarak, radius, dan tipografi; `[data-theme="dark"]` menimpa token warna (THM-01) |
| `src/lib/i18n/en.json`, `id.json`, `index.ts` | Kamus dan `t()` dengan `{placeholder}`; kunci bertipe dari `en.json`; modul kamus dimuat per bahasa, jadi browser hanya mengunduh bahasa aktif |
| `src/lib/site.ts` | `SITE_URL = 'https://falette.vercel.app'` (jawaban 5) |
| `src/routes/+layout.svelte` | Mengimpor `app.css` dan font |
| `src/routes/[lang=lang]/+layout.ts`, `+layout.svelte` | Memuat kamus; `hreflang` en, id, dan `x-default`; memperbarui `lang` saat navigasi di browser |
| `src/routes/[lang=lang]/+page.svelte`, `create/+page.svelte` | Title, description, dan judul halaman dari kamus |
| `src/routes/+page.svelte`, `src/routes/create/+page.svelte`, dan `+page.ts` masing-masing | Pengalih dengan `csr = false`, jadi tanpa JavaScript aplikasi; tautan English dan Bahasa Indonesia di `noscript`; `/` bertanda `x-default` |
| `src/routes/404.html/+page.ts`, `+page.svelte` | `trailingSlash = 'never'` dan `csr = false`, sehingga build menulis `404.html`; teks kedua bahasa ada di HTML, dan yang tampil dipilih lewat atribut `lang` (T1) |
| `vercel.json` | `Content-Security-Policy: frame-ancestors 'none'` untuk semua path |
| `.github/workflows/ci.yml` | Job wajib `verify` (check, lint, tes unit, build) dan `e2e-chromium`; job informasi `e2e-firefox-webkit` dengan `continue-on-error` sampai Sesi 13 (T5) |
| `package.json` | Dependensi `@fontsource-variable/inter@5.3.0` (OFL-1.1) dan devDependency `@axe-core/playwright@4.14.0` (rilis 15 Oktober 2026; tidak ikut ke situs) |
| `tests/` | `i18n.test.ts`, `tokens.test.ts`, `inline-scripts.test.ts`, `site.e2e.ts`, `budget.e2e.ts`, `a11y.e2e.ts`, dan `helpers/` (pemeriksa CSP) |
| `AGENTS.md` | Baris peta folder: `src/hooks.server.ts`, `src/app.css`, `src/lib/inline/`, `src/lib/site.ts`, `src/routes/404.html/`, `tests/helpers/`, `vercel.json`, dan `.github/` |

**Font:** Inter Variable sumbu `wght` saja. Untuk teks Indonesia dan English, browser hanya mengunduh subset latin, satu file woff2 sebesar 48.256 byte (47 KB). Subset lain dipisah lewat `unicode-range` dan tidak diunduh. Sumbu `opsz` (72.920 byte untuk subset latin) tidak dipakai; kalau jam besar di Sesi 9 butuh, aku mengusulkannya di sana.

**Tanpa JavaScript:** skrip tema tidak berjalan, jadi tema tetap terang walaupun setelan sistem gelap. Pengalih menampilkan dua tautan bahasa, dan 404 tampil dalam English.

---

## Token warna

Abu-abu netral dengan aksen biru seperti wireframe (jawaban 7). Rasio kontras dihitung dengan rumus WCAG; batasnya 4,5:1 untuk teks dan 3:1 untuk batas komponen.

| Token | Terang | Gelap | Kontras terang | Kontras gelap |
| --- | --- | --- | --- | --- |
| `--color-bg` | `#ffffff` | `#131313` | — | — |
| `--color-surface` | `#f3f3f1` | `#1f1f1e` | — | — |
| `--color-text` | `#1b1b1a` | `#f1f1ef` | 17,24 di bg · 15,51 di surface | 16,43 · 14,59 |
| `--color-text-muted` | `#5c5c58` | `#a6a6a1` | 6,72 · 6,04 | 7,60 · 6,75 |
| `--color-accent` (tautan, cincin fokus, garis tombol Create) | `#1d6ad1` | `#6ea6f5` | 5,21 · 4,68 | 7,46 · 6,63 |
| `--color-accent-soft` (isi tombol Create) | `#e5eefb` | `#1b2b42` | teks 14,74 · aksen 4,45 | teks 12,62 · aksen 5,74 |
| `--color-border` (pemisah dekoratif) | `#dcdcd8` | `#353533` | — | — |
| `--color-border-strong` (garis kontrol) | `#8a8a85` | `#7c7c77` | 3,47 · 3,12 | 4,43 · 3,93 |

Jarak memakai `--space-1` sampai `--space-8` (4, 8, 12, 16, 24, 32, 48, dan 64 px). Radius memakai `--radius-s` 6 px, `--radius-m` 10 px, `--radius-l` 16 px, dan `--radius-pill`. Font memakai `--font-sans: 'Inter Variable', system-ui, sans-serif` dengan skala ukuran 14, 16, 20, 28, dan 40 px.

---

## Teks ID/EN

Teks dari PRD ditandai di kolom Asal; sisanya usulanku.

| Kunci | Indonesia | English | Asal |
| --- | --- | --- | --- |
| `meta.home.title` | Falette · Wallpaper minimalis dari algoritma | Falette · Minimalist wallpapers from algorithms | HOME-01 |
| `meta.home.description` | Buat wallpaper minimalis untuk ponsel, tablet, dan laptop di browser, lalu unduh PNG atau SVG. Gratis, tanpa akun. | Make minimalist wallpapers for your phone, tablet, and laptop in the browser, then download PNG or SVG. Free, no account. | Usulan |
| `home.heading` | Wallpaper minimalis dari algoritma. | Minimalist wallpapers from algorithms. | HOME-01 |
| `meta.create.title` | Create · Falette | Create · Falette | Nama halaman tetap English |
| `meta.create.description` | Pilih perangkat, pola, dan warna, lalu unduh wallpaper-mu sebagai PNG atau SVG. Semua dibuat di browser. | Pick a device, pattern, and colors, then download your wallpaper as PNG or SVG. Everything is made in your browser. | Usulan |
| `create.heading` | Create | Create | Nama halaman tetap English |
| `notFound.title` | Halaman tidak ditemukan · Falette | Page not found · Falette | Usulan |
| `notFound.heading` | Halaman tidak ditemukan | Page not found | Usulan |
| `notFound.message` | Alamat ini tidak ada di Falette. | This address doesn't exist on Falette. | Usulan |
| `notFound.home`, `notFound.create` | Home · Create | Home · Create | Tabel rute; nama halaman tetap English |
| `languages.en`, `languages.id` | English · Bahasa Indonesia | English · Bahasa Indonesia | NAV-09: nama bahasa dalam bahasanya sendiri, jadi sama di semua file |
| Title halaman pengalih | Falette | Falette | Nama situs |

---

## Uji

**Unit (Vitest)**

- `en.json` dan `id.json` punya kunci dan placeholder yang sama; `t()` mengisi placeholder.
- Setiap pasangan di tabel token lolos batas kontrasnya di kedua tema.
- Ketiga skrip inline dijalankan di `node:vm` dengan `localStorage`, `navigator`, `location`, dan `matchMedia` tiruan, termasuk saat `localStorage` melempar error. Dengan begitu yang diuji adalah teks skrip yang sama persis dengan yang di-hash.

**Playwright (Chromium)**

- `/` dan `/create/#v=1&p=waves` dengan locale `id-ID` diarahkan ke `/id/` dan `/id/create/#v=1&p=waves`; `de-DE` ke `/en/`; `falette:lang=id` menang atas locale `en-US`.
- Tanpa JavaScript, kedua tautan `noscript` terlihat.
- `<html lang>` benar di `/en/`, `/id/`, `/en/create/`, dan `/id/create/`. `hreflang` lengkap dan memakai `SITE_URL`.
- Tema: saat `<body>` mulai dibuat, `data-theme` sudah terpasang (diperiksa lewat MutationObserver di init script). Tema ikut `colorScheme` yang diemulasi dan berubah saat setelan sistem berubah, kecuali ada `falette:theme` tersimpan.
- `/404.html` berisi teks English, atau Indonesia bila `falette:lang=id`, dengan tautan ke Home dan Create dalam bahasa yang sama. Build menulis `build/404.html`, bukan `build/404.html/index.html`.
- Tidak ada pelanggaran CSP di semua halaman, termasuk tidak ada atribut `style` di HTML prerender (T2).
- JS awal ≤ 100 KB gzip di `/en/` dan ≤ 200 KB gzip di `/en/create/`. Semua skrip yang dimuat sampai jaringan tenang dijumlahkan.
- axe (WCAG 2.2 AA) di semua halaman, dalam tema terang dan gelap.

Koreksi untuk rencana induk: server `vite preview` dijalankan SvelteKit, bukan Vercel, jadi path tak dikenal di sana tidak menampilkan `404.html`. Karena itu yang diuji lokal adalah `/404.html` dan file build-nya; perilaku sebenarnya dibuktikan di link Preview.

**Link Preview Vercel (T1)**, dicatat di laporan beserta keluaran `curl -I`:

- Path asal-asalan mengembalikan status 404 dengan halaman 404 Falette.
- Header `Content-Security-Policy: frame-ancestors 'none'` terkirim.

**CI:** hasil ketiga job di PR ini, termasuk job Firefox dan WebKit.

---

## Yang bisa FaL cek

Di link Preview Vercel dari komentar PR:

- Di ponsel berbahasa Indonesia, `/` pindah ke `/id/`, dan `/create/#coba` pindah ke `/id/create/#coba`.
- Ganti mode gelap di setelan ponsel: halaman ikut berubah tanpa dimuat ulang, dan tidak berkedip saat dimuat ulang.
- Path asal-asalan menampilkan 404 Falette.

---

## Perlu persetujuan

1. **Font dipasang di Sesi 1,** bukan Sesi 9 seperti di tabel rencana induk, karena token tipografi dibuat di sini. Biayanya satu file 47 KB untuk en dan id.
2. **Cadangan bila Vercel tidak mengikuti aturan.** `node_modules/@sveltejs/adapter-static/platforms.js` menulis `.vercel/output/config.json` tanpa aturan 404, jadi kemungkinan besar path asal-asalan masih menampilkan 404 bawaan Vercel. Kalau Preview membuktikan itu, atau header dari `vercel.json` tidak terkirim, aku membungkus adapter di `vite.config.ts` supaya menambahkan dua aturan ke `config.json`: header `frame-ancestors` dan `404.html` dengan status 404. Fungsi pengubahnya diuji di unit test. Bila `vercel.json` terbukti diabaikan, itu bertentangan dengan NFR Keamanan, yang menyebut `vercel.json`, dan akan kucatat di laporan. Boleh kupakai langsung di PR ini bila perlu?
3. **404 tanpa JavaScript aplikasi** (`csr = false`). Teks kedua bahasa ada di HTML, dan skrip inline ketiga memilih bahasanya. Alternatifnya halaman yang di-hydrate SvelteKit, tetapi teks English akan sempat tampil sebelum berganti.
4. **Teks di tabel ID/EN,** termasuk "Home" dan "Create" yang tetap English sebagai nama halaman di tautan 404.
