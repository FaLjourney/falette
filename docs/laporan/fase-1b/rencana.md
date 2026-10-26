# Rencana Fase 1b: Create, preview, navbar, dan Home

Langkah 5 di AGENTS.md. Rencana ini hanya menyusun urutan sesi; belum ada kode. Setiap sesi menjadi satu draft PR kecil yang bisa diuji sendiri.

**Disetujui:** FaL menyetujui 13 sesi dengan urutan di bagian 1. Untuk pertanyaan di bagian 6, jawabannya pilihan a, kecuali jawaban dan tambahan yang dicatat di [Keputusan FaL](#keputusan-fal). Rincian sesi di bawah sudah disesuaikan dengan keputusan itu. Di PR yang sama, `docs/PRD.md` diperbarui dengan tiga perubahan: Q7 diputuskan (`falette.vercel.app`), EXP-03 memakai label "Salin kode" (Copy code), dan kalimat di atas tabel Pertanyaan terbuka.

**Pengecekan awal:** main sudah memuat PR #12 (`12744a5`, pembaruan PRD dengan keputusan sebelum Fase 1b), digabung lewat `7ddf46b`. `docs/PRD.md` di main identik dengan ekspor yang FaL lampirkan. Branch `claude/charming-albattani-ms0114` dimulai ulang dari main itu.

**Bahan yang dibaca:** AGENTS.md, seluruh `docs/PRD.md`, Katalog Pola untuk empat pola MVP, kesebelas gambar di `docs/wireframes/`, kode di `src/lib/` (engine, ekspor, link, preset), serta catatan Fase 1b di laporan ekspor dan link. Butir 1–11 di daftar "belum diatur PRD" dari laporan link sudah diputuskan di PRD terbaru.

---

## Keputusan FaL

### Jawaban bagian 6

Pilihan a untuk semua pertanyaan, kecuali dan dengan catatan berikut.

| No. | Jawaban |
| --- | --- |
| 2 | (b), dengan rencana yang singkat. Tiap sesi punya folder `docs/laporan/fase-1b/NN-nama/` berisi `rencana.md` (rencana singkat dan tabel teks ID/EN), lalu `laporan.md`. Rencana wajib berupa file di branch PR, bukan hanya di deskripsi PR. |
| 5 | URL produksi `https://falette.vercel.app` (Q7 di PRD). Disimpan di satu konstanta supaya mudah diganti bila nanti memakai domain sendiri. |
| 12 | (a). Senja memakai Latar Otomatis, karena nilai awal Create di Lampiran B adalah palet Senja dengan Latar Otomatis; `bg=f4efe6` di link contoh hanya contoh. Warna `e07a5f.3d405b.81b29a` boleh menjadi dasar Senja. Nama palet di ringkasan dicocokkan dari `pal` saja, dengan warna dan urutan sama persis; `bg` tidak memengaruhi nama karena latar diatur terpisah (COL-05). |
| 17 | (a), dengan aturan umum: pilih susunan kiri-kanan atau atas-bawah yang membuat kedua gambar lebih besar di area preview. Untuk preset hasilnya sama dengan aturan potret dan lanskap, dan ukuran Custom yang mendekati persegi ikut benar. |
| 20 | (a). Bila Sesi 6 terlalu besar, color picker boleh menjadi PR sendiri. |
| 29 | (a). Jam besar tidak menampilkan AM/PM, seperti lock screen asli. id-ID menulis jam dengan titik ("9.41"), dan ini ditampilkan di tangkapan layar laporan Sesi 9. |
| 33 | (b): satu kalimat pendek per kartu sesuai HOME-09, karena PRD yang berlaku. Judul kartu tetap English. |
| 34 | Footer EN: "© 2026 Falette. All rights reserved. Made by FaL." ID: "© 2026 Falette. Hak cipta dilindungi undang-undang. Dibuat oleh FaL." Tahun diambil saat build. Tanpa tautan repositori. |
| 37 | (a), dibuat dengan Playwright yang sudah terpasang, tanpa dependensi baru. |
| 38 | Dijawab FaL sebelum Sesi 13. |

### Tambahan

| No. | Sesi | Isi |
| --- | --- | --- |
| T1 | 1 | Layout akar memakai `trailingSlash = 'always'`, jadi `src/routes/404.html/` butuh `trailingSlash = 'never'` sendiri; tanpa itu build menghasilkan `404.html/index.html`. adapter-static di Vercel menulis `.vercel/output/config.json` sendiri tanpa aturan 404. Karena itu, di link Preview harus dibuktikan dan dilaporkan dua hal: path asal-asalan menampilkan 404 Falette, bukan 404 bawaan Vercel, dan header `frame-ancestors` terkirim (`curl -I`). |
| T2 | Semua | Tidak boleh ada atribut `style="…"` di HTML prerender, karena `style-src` tanpa `'unsafe-inline'` memblokirnya. Pakai class, atau set lewat JavaScript setelah mount, mis. posisi slider Bandingkan dan rasio bingkai device. |
| T3 | 3 | Uji juga bahwa hash yang ditulis Create sendiri tidak memicu muat ulang desain (jumlah render tidak bertambah), dan bahwa fokus serta posisi scroll tidak berubah saat hash ditulis. |
| T4 | 4 | Selama Unduh berjalan, tampilkan indikator proses dan nonaktifkan tombolnya. Bila PNG terlalu besar atau gagal, tampilkan satu baris teks dari tabel teks ekspor PRD, tanpa tombol tawaran; kotak lengkap tetap di Sesi 10. Laporan Sesi 4 memuat langkah uji ekspor di iPhone untuk FaL: ukuran hasil deteksi, `d=desk-5k` (14,7 MP), `w=7680&h=4320` (33,2 MP, di atas batas Safari iOS), dan `p=gradient` untuk melihat banding (Q11). |
| T5 | 1 | CI GitHub Actions untuk setiap PR: `npm run check`, `npm run lint`, tes unit, `npm run build`, dan e2e Chromium sebagai syarat lulus. E2e dengan `PW_BROWSERS=all` di Firefox dan WebKit berjalan sebagai job informasi yang boleh gagal sampai Sesi 13, dan hasilnya disebut di setiap laporan. `.github/` ditambahkan ke peta folder AGENTS.md. |

### Yang disesuaikan di rencana ini

- Bagian 3: folder rencana dan laporan per sesi (jawaban 2), larangan atribut `style` (T2), dan CI (T5).
- Sesi 1: konstanta URL produksi (jawaban 5), rute 404 dan bukti di link Preview (T1), serta CI (T5).
- Sesi 3: susunan Berdampingan (jawaban 17) dan uji hash milik Create sendiri (T3). Sesi 4: Unduh (T4). Sesi 6: color picker boleh jadi PR sendiri (jawaban 20). Sesi 9: format jam (jawaban 29). Sesi 11: kartu Features dan footer (jawaban 33 dan 34). Sesi 13: gambar Open Graph (jawaban 37).
- Bagian 5: butir 6 dan 8 selesai lewat pembaruan PRD; butir 4 dan 5 diputuskan lewat jawaban 3 dan 33.

---

## 1. Urutan sesi

| No. | Sesi | ID PRD utama | Wireframe | Yang bisa FaL cek |
| --- | --- | --- | --- | --- |
| 1 | Rute, bahasa, dan tema | NAV-10, NAV-11, THM-01, THM-02, THM-04, THM-06, rute 404, NFR Bahasa, NFR Keamanan, CI (T5) | — | Pengalih `/` dan `/create/` dengan hash utuh; tema mengikuti sistem tanpa berkedip; 404 Falette di link Preview |
| 2 | Navbar | NAV-01 sampai NAV-06, NAV-09, THM-03, THM-05 | `navbar.png` | Menu desktop dan ponsel, dropdown bahasa, toggle tema |
| 3 | Desain, hash, dan preview dasar | SHR-01, SHR-03, Lampiran B, DEV-03 (logika), DEV-05, COL-01 (data), MODE-01, ENG-07 | `create-layout.png` (area preview) | Create membaca dan menulis hash; ukuran mengikuti device sendiri |
| 4 | Tata letak Create, Acak, dan Unduh | Bagian 8.1, PAT-04, EXP-01, EXP-04, EXP-05, EXP-07 (indikator proses), DEV-02 (nama preset), NFR Aksesibilitas | `create-layout.png`, `create-mobile.png` | Akordeon desktop, bilah ringkasan dan lembar dari bawah di ponsel, Acak, Unduh PNG |
| 5 | Panel Pola | PAT-01, PAT-02, PAT-03, ENG-07 | `panel-pola.png` (MVP) | Thumbnail empat pola dan slider parameter |
| 6 | Panel Warna | COL-01, COL-02, COL-03, COL-05, ENG-11 | `panel-warna.png` | Palet terkurasi, Acak palet, slot, color picker, Latar |
| 7 | Panel Perangkat | DEV-01, DEV-02, DEV-03, DEV-04 | `panel-perangkat.png`, `create-mobile.png` | Label Terdeteksi di device sendiri, ukuran Custom |
| 8 | Panel Mode dan Bandingkan | MODE-01 sampai MODE-04 | `panel-mode.png` (MVP), `create-layout.png`, `create-mobile.png` | Terang, Gelap, Berdampingan, dan slider Bandingkan |
| 9 | Overlay lock screen dan jam | PRV-01 sampai PRV-04, PRV-06, Lampiran A (5 templat) | `create-layout.png`, `create-mobile.png` | Jam berjalan di preview, mirip lock screen sendiri |
| 10 | Panel Ekspor dan Salin link | EXP-01 sampai EXP-07, SHR-02 | `panel-ekspor.png` | PNG dan SVG, kode SVG, Salin link, kotak PNG terlalu besar |
| 11 | Home: hero, Features, FAQ, dan footer | HOME-01, HOME-02, HOME-03, HOME-09 sampai HOME-13, HOME-15, PRV-05 | `home.png` | Layar pertama di ponsel, FAQ, footer |
| 12 | Home: mockup bergerak dan section Preview | HOME-04 sampai HOME-08, NFR Performa | `home.png`, `engine-flow.png` | Pergantian otomatis, jeda saat disentuh, tombol Create membawa desain |
| 13 | Pemeriksaan sebelum rilis publik | NFR Aksesibilitas, Performa, Responsif, Kompatibilitas, SEO, Privasi | `roadmap.png` | Uji di Safari iOS, Chrome Android, dan empat browser desktop |

Semua ID di tabel berprioritas P0. P1 dan P2 tidak dikerjakan ([bagian 7](#7-di-luar-fase-1b)).

---

## 2. Perubahan dari urutan usulan FaL

Urutan besarnya tetap. Ada empat sesi yang kupecah dan dua kebutuhan yang kumajukan, supaya setiap PR tetap kecil dan tidak ada tombol atau bagian yang kosong terlalu lama.

1. **Usulan 1 dipecah menjadi Sesi 1 dan 2.** Rute, bahasa, dan tema bisa diuji tanpa navbar: tema lewat setelan sistem, bahasa lewat pengalih. Toggle tema (THM-03, THM-05) dan dropdown bahasa (NAV-09) baru dibuat bersama navbar.
2. **Usulan 2 dipecah menjadi Sesi 3 dan 4.** State desain dan hash bisa diuji lewat URL saja sebelum ada panel. Tata letak akordeon dan lembar dari bawah cukup besar untuk PR sendiri.
3. **Data palet (COL-01) dan logika deteksi device (DEV-03) maju ke Sesi 3.** Nilai awal Create di Lampiran B butuh palet Senja dan ukuran hasil deteksi. Panel Warna dan Perangkat tetap di Sesi 6 dan 7.
4. **Acak dan Unduh dasar masuk Sesi 4.** Keduanya ada di baris aksi yang selalu terlihat, dan modul ekspor dari Fase 1a sudah siap. Unduh di Sesi 4 hanya PNG dengan varian sesuai tampilan preview; pilihan format, kode SVG, dan kotak galat menyusul di Sesi 10.
5. **Usulan 6 dipecah menjadi Sesi 8 dan 9.** Overlay butuh 5 templat, font OFL, dan jam yang berganti tepat di pergantian menit. Slider Bandingkan dibuat di Sesi 8 dan dipakai ulang di Home.
6. **Usulan 8 dipecah menjadi Sesi 11 dan 12.** Bagian statis Home bisa dicek lebih dulu, lalu mockup bergerak dan section Preview menyusul.

Total 13 sesi. Urutan Pola, Warna, lalu Perangkat kupertahankan.

---

## 3. Aturan untuk semua sesi

- **Satu draft PR per sesi**, dari main terbaru, dengan folder `docs/laporan/fase-1b/NN-nama/`, mis. `01-rute-bahasa-tema/`. Pertama, `rencana.md` (rencana singkat dan tabel teks ID/EN) di-commit ke branch PR dan menunggu persetujuan FaL. Setelah itu kode, lalu `laporan.md` beserta tangkapan layar (jawaban 1 dan 2).
- **Kriteria selesai AGENTS.md:** `npm run check`, `npm run lint`, `npm test`, dan `npm run build` lulus, dan CI di PR hijau (T5). Snapshot ENG-08 tidak berubah dan versi engine tetap 1. Setiap laporan menyebut hasil job Firefox dan WebKit, termasuk bila gagal.
- **Tanpa atribut `style`** di HTML prerender (T2). Nilai yang dihitung, seperti posisi slider atau rasio bingkai, dipasang lewat JavaScript setelah mount; selebihnya memakai class. Tes CSP di bawah ikut menangkap pelanggarannya.
- **Uji JavaScript awal** dibuat di Sesi 1 dan dijalankan di setiap PR: tes Playwright menjumlahkan ukuran gzip semua skrip yang dimuat saat `/en/` dan `/en/create/` dibuka, dengan batas 100 KB dan 200 KB (NFR Performa).
- **Uji CSP** dibuat di Sesi 1: setiap tes Playwright gagal bila konsol browser mencatat pelanggaran Content-Security-Policy.
- **Uji layar:** tiap sesi UI diuji di lebar 360, 390, 800, 1280, dan 2560 px, tanpa scroll horizontal (NFR Responsif), dalam tema terang dan gelap serta bahasa en dan id.
- **Aksesibilitas otomatis** dengan `@axe-core/playwright` sebagai devDependency (jawaban 8).
- **Tangkapan layar** di laporan: desktop 1280 × 800 dan ponsel 390 × 844, terang dan gelap.
- **Cek di ponsel:** setiap PR mendapat link Preview dari Vercel di komentar PR. Link itu bisa dibuka di ponsel FaL.
- **Browser:** di container hanya Chromium yang bisa dipakai, karena CDN Playwright untuk Firefox dan WebKit diblokir. Firefox dan WebKit berjalan di CI GitHub Actions sebagai job informasi (T5). Safari dan Chrome di ponsel asli diuji oleh FaL (Sesi 13).
- **Teks UI** selalu lewat `en.json` dan `id.json`. Nama menu dan section, judul kartu Features, serta tombol Create dan Preview tetap English di kedua file.

---

## 4. Rincian per sesi

### Sesi 1: Rute, bahasa, dan tema

**ID:** NAV-10, NAV-11, THM-01, THM-02, THM-04, THM-06, rute `/404` (tabel rute Bagian 6), NFR Bahasa (mekanisme file terjemahan), NFR Keamanan (hash skrip inline di CSP), NFR SEO (title dan meta description per halaman), Q7 (URL produksi), CI (T5).

**Wireframe:** tidak ada gambar khusus; halaman Home dan Create masih kerangka.

**File:**

| File | Isi |
| --- | --- |
| `src/app.css` | Token warna, jarak, radius, dan tipografi; `[data-theme="dark"]` menimpa token warna (THM-01) |
| `src/app.html` | Penanda `lang` dan tempat skrip tema di `<head>` |
| `src/lib/inline/theme.js` | Skrip tema: baca `localStorage` dengan try/catch, lalu `prefers-color-scheme`, lalu pasang `data-theme` sebelum render pertama (THM-02, THM-04) |
| `src/lib/inline/lang-redirect.js` | Skrip pengalih: bahasa tersimpan, lalu bahasa browser, lalu English, dengan `location.replace` dan hash utuh (NAV-10, NAV-11) |
| `src/hooks.server.ts` | Hanya saat prerender: mengisi `lang` di `<html>` dan menyisipkan skrip tema (pertanyaan 4) |
| `vite.config.ts` | Hash SHA-256 kedua skrip ditambahkan ke `script-src` |
| `src/lib/i18n/en.json`, `id.json`, `index.ts` | Kamus per bahasa dan fungsi `t()` dengan `{placeholder}`; hanya bahasa aktif yang dimuat (NFR Bahasa) |
| `src/routes/[lang=lang]/+layout.ts`, `+layout.svelte` | Memuat kamus bahasa aktif; `hreflang` untuk en, id, dan `x-default`; title dan description |
| `src/routes/+page.svelte`, `src/routes/create/+page.svelte` | Halaman pengalih dengan tautan English dan Indonesia di `noscript` |
| `src/lib/site.ts` | `SITE_URL = 'https://falette.vercel.app'`, satu-satunya tempat URL produksi, dipakai `hreflang` lalu sitemap dan Open Graph (jawaban 5) |
| `src/routes/404.html/` | Halaman 404 prerender dalam bahasa tersimpan, cadangan English, dengan `trailingSlash = 'never'` sendiri supaya build menulis `404.html` (T1) |
| `vercel.json` | Header `frame-ancestors 'none'` (pertanyaan 9) |
| `.github/workflows/ci.yml` | Untuk setiap PR: job wajib `npm run check`, `npm run lint`, tes unit, `npm run build`, dan e2e Chromium; job informasi e2e Firefox dan WebKit (`PW_BROWSERS=all`) yang boleh gagal sampai Sesi 13 (T5) |
| `tests/i18n.test.ts`, `tests/tokens.test.ts` | Kunci dan placeholder en dan id sama; kontras token ≥ 4,5:1 di kedua tema |
| `tests/site.e2e.ts`, `tests/budget.e2e.ts`, `tests/helpers/` | Tes browser, anggaran JS, dan pemeriksa CSP |
| `AGENTS.md` | Baris peta folder untuk tempat baru, termasuk `.github/` (jawaban 3, T5) |

**Uji otomatis:**

- Unit: kedua kamus punya kunci dan placeholder yang sama; `t()` mengisi placeholder; pasangan warna teks dan latar di token lolos 4,5:1 (teks) dan 3:1 (komponen) di kedua tema.
- Playwright: `/` dan `/create/#v=1&p=waves` dengan `locale` browser `id-ID` diarahkan ke `/id/…` dengan hash yang sama; `de-DE` ke `/en/`; pilihan tersimpan menang atas bahasa browser; tanpa JavaScript, tautan `noscript` terlihat; `<html lang>` benar di setiap rute; `hreflang` lengkap; tema mengikuti `colorScheme` yang diemulasi dan ikut berubah saat setelan sistem berubah; `data-theme` sudah terpasang sebelum `DOMContentLoaded`; tema tersimpan dipakai; path tak dikenal di server preview menampilkan 404; build menulis `404.html`, bukan `404.html/index.html`; `hreflang` memakai `SITE_URL`; tidak ada pelanggaran CSP; anggaran JS.
- Di link Preview Vercel (T1): path asal-asalan menampilkan 404 Falette, bukan 404 bawaan Vercel, dan `curl -I` menunjukkan header `frame-ancestors`. Keduanya dicatat di laporan beserta keluaran `curl`.
- CI: workflow berjalan di PR Sesi 1 sendiri. Agar job wajib benar-benar menjadi syarat merge, FaL perlu memasang aturan branch (ruleset) di pengaturan repositori GitHub, karena aku tidak bisa mengubah pengaturan itu. Langkahnya kutulis di laporan.

**Yang bisa FaL cek:** buka link Preview Vercel di ponsel: `/` pindah ke `/id/` bila bahasa ponsel Indonesia; `/create/#coba` pindah ke `/id/create/#coba`; ganti mode gelap di setelan ponsel, halaman ikut berubah tanpa berkedip saat dimuat ulang; buka path asal-asalan untuk melihat 404.

### Sesi 2: Navbar

**ID:** NAV-01 sampai NAV-06, NAV-09, THM-03, THM-05.

**Wireframe:** `navbar.png`, bagian navbar di `home.png`.

**File:** `src/lib/components/Navbar.svelte`, `LanguageMenu.svelte`, `ThemeToggle.svelte`, `Logo.svelte`, `Icon.svelte` (pertanyaan 10), `src/lib/components/theme.svelte.ts` (state tema dan penyimpanan dengan try/catch), `src/lib/assets/favicon.svg` diganti logo (pertanyaan 11), kamus, dan `[lang=lang]/+layout.svelte`.

**Uji otomatis (Playwright):**

- Desktop: urutan Logo, Create, Preview, Features, FAQ, dropdown bahasa, toggle; Create menuju `/id/create/` dan tiga lainnya ke `/id/#preview` dan seterusnya, juga dari Create (NAV-02); navbar tetap di atas saat di-scroll dengan latar solid atau blur (NAV-04).
- Ponsel 390 px: Logo, toggle, dan tombol menu; panel berisi empat menu dan dropdown bahasa; Esc menutup panel dan fokus kembali ke tombol menu (NAV-05, NAV-06).
- Dropdown bahasa: panah, Enter, dan Esc; nama bahasa dalam bahasanya sendiri; berganti bahasa di `/id/create/#…` pindah ke `/en/create/#…` dengan hash sama, pilihan tersimpan, dan `lang` berubah (NAV-09, NAV-10).
- Toggle: label tetap "Mode gelap" dengan `aria-pressed`, ikon berganti, pilihan bertahan setelah dimuat ulang (THM-03, THM-05).
- Fokus terlihat di semua kontrol; axe.

**Yang bisa FaL cek:** buka menu di ponsel; pakai Tab dan Enter di desktop; ganti bahasa saat di Create dan pastikan hash di URL tetap; tekan toggle lalu muat ulang.

### Sesi 3: Desain, hash, dan preview dasar

**ID:** SHR-01, SHR-03 (pemberitahuan versi), Lampiran B (nilai awal dan pemberitahuan link), DEV-03 (logika deteksi, tanpa label), DEV-05, COL-01 (data 12 palet dan namanya), MODE-01, ENG-07 (maksimal satu render per frame), ENG-03 (daftar pola).

**Wireframe:** area preview di `create-layout.png`.

**File:**

| File | Isi |
| --- | --- |
| `src/lib/patterns/index.ts` | Daftar pola ringan (ID, nama, kategori) dan pemuat modulnya; di MVP keempat modul ikut dimuat (ENG-03) |
| `src/lib/palettes/curated.ts` | 12 palet terkurasi dengan ID permanen, HEX, dan latar bila ada (pertanyaan 12); nama di kamus |
| `src/lib/presets/detect.ts` | `screen` × `devicePixelRatio` ke preset terdekat (pertanyaan 14) |
| `src/lib/components/create/design.svelte.ts` | State desain: dibaca dari hash dengan `readLink`, kunci yang hilang diisi nilai awal Lampiran B, ditulis kembali ke hash tanpa menambah riwayat, dan dimuat ulang saat hash berubah |
| `src/lib/components/create/Preview.svelte` | Render kedua varian dari `render()`, maksimal satu render per frame |
| `src/lib/components/create/LinkNotice.svelte` | Kotak pemberitahuan pola tak dikenal dan versi berbeda, dengan tombol Tutup |
| `src/routes/[lang=lang]/create/+page.svelte` | Halaman Create dengan state dan preview |
| `tests/detect.test.ts`, `tests/palettes.test.ts`, `tests/create-state.e2e.ts` | Tes |

**Catatan teknis:**

- SvelteKit 3.0.1 menandai `replaceState` dari `$app/navigation` sebagai usang dan menyarankan `goto(url, { shallow: true, replace: true })`. Cara ini tetap memakai `history.replaceState` di baliknya, jadi tidak menambah riwayat (SHR-01).
- HTML prerender Create berisi kerangka dengan area preview berukuran tetap. Desainnya baru muncul setelah JavaScript berjalan, karena bergantung pada hash dan layar pengunjung.
- Preview ditampilkan sebagai `<img>` dengan data URI dari string SVG yang sama dengan ekspor. Bila pengukuran ENG-07 menunjukkan SVG inline lebih cepat, aku melaporkannya dulu sebelum mengganti caranya.
- Sampai Sesi 8, tampilan `pair` selalu Berdampingan, juga di ponsel. Susunannya kiri-kanan atau atas-bawah, dipilih yang membuat kedua gambar lebih besar di area preview (jawaban 17).

**Uji otomatis:**

- Unit: setiap preset dikenali dari ukuran layarnya sendiri; contoh device nyata (iPhone dengan DPR 3, laptop dengan scaling OS) jatuh ke preset yang diharapkan; 12 palet berisi 1–5 HEX sah dengan nama di kedua kamus.
- Playwright: Create tanpa hash menulis `v`, `p=arcs`, seed, palet Senja, `bg=auto`, `m=pair`, `d` hasil deteksi, dan `x`; `history.length` tidak bertambah saat desain berubah; memuat ulang menghasilkan SVG yang sama; menempel hash lain di tab yang sama memuat desain baru; `p=tidak-ada` dan `v=2` menampilkan kotak pemberitahuan yang bisa ditutup; `screen` dan `deviceScaleFactor` yang diemulasi menentukan `d`.
- Hash yang ditulis Create sendiri tidak memicu muat ulang desain: jumlah render tidak bertambah, dan fokus serta posisi scroll tidak berubah saat hash ditulis (T3).
- Berdampingan memakai kiri-kanan untuk `ios-63`, atas-bawah untuk `desk-uw`, dan susunan yang memberi gambar lebih besar untuk Custom mendekati persegi, mis. `w=1200&h=1000` (jawaban 17).

**Yang bisa FaL cek:** buka Create di ponsel dan lihat `d=` di URL sesuai ponsel itu; ubah `s=` di URL secara manual; tempel link dengan `p=asal` untuk melihat pemberitahuan.

### Sesi 4: Tata letak Create, Acak, dan Unduh

**ID:** Bagian 8.1, PAT-04, EXP-01, EXP-04 (varian sesuai tampilan), EXP-05, EXP-07 (indikator proses), DEV-02 (nama preset di kamus dengan ID preset sebagai kunci), NFR Aksesibilitas (akordeon dan lembar dari bawah).

**Wireframe:** `create-layout.png`, `create-mobile.png`.

**File:** `ControlPanel.svelte` (akordeon desktop lima baris dengan `aria-expanded`), `SummaryBar.svelte` (lima kartu ponsel), `BottomSheet.svelte`, `ActionBar.svelte` (Acak dan Unduh), `Thumbnail.svelte` (render kecil dari engine, dipakai ulang di Sesi 5), di `src/lib/components/create/`; nama 28 preset di kamus.

Isi kelima bagian masih kosong sampai sesinya masing-masing, tetapi judul baris dan kartu sudah menampilkan pilihan aktif: nama preset, nama pola, nama palet atau Kustom, tampilan, dan "PNG, Terang".

**Uji otomatis (Playwright):**

- Desktop ≥ 1024 px: urutan Perangkat, Pola, Warna, Mode, Ekspor; Pola terbuka saat halaman dibuka; membuka satu baris menutup yang lain; Acak dan Unduh selalu terlihat saat panel digulir.
- Ponsel dan tablet (390 dan 800 px): lima kartu dengan visual kecil; mengetuk kartu membuka lembar, fokus pindah ke dalamnya, preview tetap terlihat; Selesai, Esc, dan geser ke bawah menutup lembar; fokus kembali ke kartu asal (NFR Aksesibilitas, pertanyaan 16).
- Acak hanya mengganti `s` di hash; tombol R melakukan hal yang sama, kecuali saat fokus di isian teks (PAT-04).
- Unduh menghasilkan PNG berdimensi preset dengan nama `falette-{pola}-{mode}-{lebar}x{tinggi}-{seed}.png` (EXP-01, EXP-05).
- Selama Unduh berjalan, tombolnya nonaktif dan menampilkan indikator proses. Bila PNG terlalu besar (mis. `w=7680&h=4320` dengan batas Safari iOS yang ditiru) atau gagal, satu baris teks dari tabel teks ekspor PRD muncul tanpa tombol tawaran; kotak lengkap menyusul di Sesi 10 (T4).

**Yang bisa FaL cek:** di ponsel, ketuk kartu dan geser lembar ke bawah; tekan Acak beberapa kali; Unduh PNG lalu cek ukurannya di Files. Laporan Sesi 4 memuat langkah uji ekspor di iPhone: ukuran hasil deteksi, `d=desk-5k` (14,7 MP), `w=7680&h=4320` (33,2 MP, di atas batas Safari iOS), dan `p=gradient` untuk melihat banding (Q11, T4).

### Sesi 5: Panel Pola

**ID:** PAT-01, PAT-02, PAT-03, ENG-07.

**Wireframe:** `panel-pola.png` (bagian MVP).

**File:** `PatternPanel.svelte`, `ParamControl.svelte` (slider untuk parameter angka, pilihan bersegmen untuk parameter teks seperti `type` di Gradient), label parameter keempat pola di kamus.

**Uji otomatis (Playwright):**

- Empat thumbnail berasal dari engine (pertanyaan 18); memilih pola mengganti `p` dan `x` (pertanyaan 19).
- Slider menyimpan nilai lewat `normalizeParams`, jadi hash berisi `curve:0.6`, bukan `0.6000000000000001`; nilai tampil dengan koma desimal di tampilan Indonesia ("0,6").
- Slider bisa digeser dengan panah keyboard dan punya label.
- Saat slider digeser cepat, jumlah render tidak melebihi jumlah frame (ENG-07), diukur dengan penanda `performance`.

**Yang bisa FaL cek:** geser slider di ponsel dan rasakan apakah preview langsung mengikuti; bandingkan thumbnail dengan hasil di preview.

### Sesi 6: Panel Warna

**ID:** COL-01, COL-02, COL-03, COL-05, ENG-11 (slot tak terpakai tampil redup), Bagian 8.1 (baris Acak dan Unduh disembunyikan saat keyboard terbuka).

**Wireframe:** `panel-warna.png`.

**File:** `ColorPanel.svelte`, `PaletteList.svelte`, `ColorSlots.svelte`, `ColorPicker.svelte` (pertanyaan 20), `src/lib/palettes/harmony.ts` (Acak palet di OKLCH, menerima sumber acak sebagai parameter supaya bisa diuji), kamus.

Nama palet di ringkasan dicocokkan dari `pal` saja, dengan warna dan urutan sama persis; `bg` tidak memengaruhi nama (jawaban 12). Bila sesi ini terlalu besar, color picker dipisah menjadi PR sendiri sebelum atau sesudah bagian lain panel Warna, dan rencana sesi menyebutnya (jawaban 20).

**Uji otomatis:**

- Unit: harmoni analog, komplementer, dan triadik menghasilkan rona dengan jarak yang benar; jumlah slot dipertahankan (COL-02); semua HEX sah setelah penyesuaian gamut.
- Playwright: memilih palet mengubah `pal` dan `bg` serta nama di ringkasan; mengubah satu slot membuat ringkasan menjadi Kustom, sedangkan mengganti Latar saja tidak mengubah nama; slot bisa ditambah sampai 5 dan dihapus sampai 1; belahan terang dan gelap tiap slot sama dengan hasil engine; slot tak terpakai redup; Latar Manual menampilkan kotak warna dan peringatan saat terlalu mirip; R tidak memicu Acak di isian HEX; di ponsel, fokus di isian HEX menyembunyikan baris Acak dan Unduh.

**Yang bisa FaL cek:** pakai color picker dengan jari di ponsel; nilai apakah ke-12 palet enak dilihat di keempat pola, terang dan gelap.

### Sesi 7: Panel Perangkat

**ID:** DEV-01, DEV-02 (contoh model, OS, templat overlay, tautan sumber), DEV-03 (label Terdeteksi dengan keterangan "perkiraan" di tooltip), DEV-04.

**Wireframe:** `panel-perangkat.png`, lembar Perangkat di `create-mobile.png`.

**File:** `src/lib/presets/presets.json` (bidang baru dari Lampiran A), `tests/presets.test.ts`, `DevicePanel.svelte`, `CustomSize.svelte`, kamus.

Di wireframe ponsel, baris kategori hanya menampilkan Ponsel, Tablet, dan Laptop. Supaya Desktop dan Custom tidak tersembunyi, baris kategori dipecah menjadi dua baris di layar sempit.

**Uji otomatis:**

- Unit: setiap preset menunjuk templat sesuai Lampiran A; tautan sumber berupa https; contoh model ada kecuali di baris "Kelas umum".
- Playwright: panel terbuka di kategori hasil deteksi dengan label Terdeteksi dan tooltip; memilih preset mengganti `d`; Custom terisi ukuran saat ini, dibatasi 320–7680, dengan tombol tukar orientasi; ringkasan menampilkan lebar × tinggi; `w` dan `h` menggantikan `d` di hash (pertanyaan 25).

**Yang bisa FaL cek:** apakah label Terdeteksi muncul di preset yang benar untuk ponsel dan laptop FaL. Ini pemeriksaan terpenting sesi ini, karena hasil deteksi di device asli tidak bisa ditiru sepenuhnya di container.

### Sesi 8: Panel Mode dan Bandingkan

**ID:** MODE-01 sampai MODE-04, dan komponen slider pembanding yang dipakai ulang oleh HOME-06.

**Wireframe:** `panel-mode.png` (bagian MVP), `create-layout.png`, `create-mobile.png`.

**File:** `ModePanel.svelte`, `CompareSlider.svelte` (peran ARIA `slider`, panah kiri dan kanan, Home, End; posisi garis dipasang lewat JavaScript, bukan atribut `style`, T2), `Preview.svelte` (empat tampilan, susunan Berdampingan menurut jawaban 17), kamus.

**Uji otomatis (Playwright):**

- Pilihan tampilan mengganti `m`; desktop `pair` tampil Berdampingan; di bawah 1024 px `pair` tampil Bandingkan dan menjadi tampilan awal (MODE-03, pertanyaan 15).
- Slider Bandingkan bisa digeser dengan keyboard, `aria-valuenow` berubah, label Terang di kiri bawah dan Gelap di kanan bawah.
- "Pasangan warna" di panel sama dengan warna dari engine.
- Mengganti tema website tidak mengubah varian wallpaper (MODE-04).

**Yang bisa FaL cek:** geser slider Bandingkan di ponsel; nyalakan tema gelap website lalu pilih tampilan Terang.

### Sesi 9: Overlay lock screen dan jam

**ID:** PRV-01 sampai PRV-04, PRV-06, NAV-10 (nama hari dan bulan), Lampiran A (5 templat overlay).

**Wireframe:** posisi "Jam" di `create-layout.png` dan `create-mobile.png`.

**File:** `src/lib/presets/overlays.ts` (5 templat dalam persen, pertanyaan 26–28), `src/lib/presets/overlay.ts` (memilih templat untuk preset atau ukuran Custom), `LockScreen.svelte`, `src/lib/components/clock.svelte.ts` (berganti tepat di pergantian menit), file font (pertanyaan 6), kamus.

**Uji otomatis:**

- Unit: templat untuk ke-28 preset sesuai Lampiran A; ukuran Custom potret, mendekati persegi, dan lanskap mendapat templat yang benar; format jam en dan id dengan tanggal tetap, jam besar tanpa AM/PM, dan id-ID dengan titik ("9.41") (jawaban 29).
- Playwright: overlay ada di preview tetapi tidak ada di SVG dan PNG unduhan (PRV-01, prinsip 3); jam berganti tepat di pergantian menit dengan `page.clock`; font jam berasal dari file OFL; tangkapan layar overlay di 6 preset perwakilan, terang dan gelap, untuk laporan, termasuk jam id-ID seperti "9.41" (jawaban 29).

**Yang bisa FaL cek:** bandingkan preview dengan lock screen ponsel dan laptop FaL sendiri; tunggu pergantian menit.

### Sesi 10: Panel Ekspor dan Salin link

**ID:** EXP-01 sampai EXP-07 (UI lengkap), SHR-02, teks kotak PNG terlalu besar dan gagal ekspor di Bagian 8.7.

**Wireframe:** `panel-ekspor.png`.

**File:** `ExportPanel.svelte`, `SvgCode.svelte`, `ShareLink.svelte`, `ExportProblem.svelte` (satu bentuk kotak untuk EXP-06 dan EXP-07), `src/lib/export/png-size.ts` (ukuran setengah luas untuk EXP-07) dan tesnya, kamus.

**Uji otomatis:**

- Unit: setiap kali gagal, luas yang ditawarkan setengah dari sebelumnya (sisi × 0,71); bila sisi terpendek akan di bawah 320 px, hanya SVG yang ditawarkan.
- Playwright: format dan varian menentukan file yang diunduh (nama EXP-05, dimensi EXP-01, SVG mandiri EXP-02) dengan varian awal sesuai pertanyaan 30; kode SVG Rapi dan Ringkas; Salin kode dan Salin link berganti menjadi Disalin selama 2 detik (`page.clock`); link yang disalin berbentuk `/create/#…` tanpa awalan bahasa; bila clipboard ditolak, kotak teks baca-saja dengan label "Salin link ini secara manual:" muncul dan langsung terpilih; batas Safari iOS yang ditiru memunculkan kotak PNG terlalu besar; kegagalan yang ditiru memunculkan kotak gagal ekspor; indikator proses tampil dan halaman tetap merespons.

**Yang bisa FaL cek:** di Safari iOS, Unduh PNG lalu cari di Files; Salin link, buka di device lain, dan pastikan desainnya identik (alur 4 di Bagian 12).

### Sesi 11: Home: hero, Features, FAQ, dan footer

**ID:** HOME-01, HOME-02, HOME-03, HOME-09 sampai HOME-13, HOME-15, PRV-05 (bingkai device generik), NFR Performa (frame pertama mockup hero disisipkan di HTML dalam versi Terang dan Gelap).

**Wireframe:** `home.png`.

**File:** `src/routes/[lang=lang]/+page.svelte`, `Hero.svelte`, `DeviceFrame.svelte`, `Features.svelte`, `Faq.svelte`, `Footer.svelte`, ikon kartu Features, kamus termasuk FAQ English.

Di sesi ini mockup hero masih diam di frame pertama. Pergantian otomatis menyusul di Sesi 12.

Kartu Features berisi judul English dan satu kalimat pendek yang diterjemahkan (jawaban 33). Footer memakai teks dari jawaban 34 dengan tahun dari waktu build, tanpa tautan repositori.

**Uji otomatis (Playwright):**

- Urutan Hero, Preview (`#preview`), Features (`#features`), FAQ (`#faq`), lalu Footer.
- Di 390 × 844 dan 360 × 640, navbar dan hero mengisi tepat 100svh, dengan judul, mockup, dan kedua tombol terlihat tanpa scroll (HOME-03).
- Tombol Create menuju `/id/create/`, Preview ke `#preview`; judul section tidak tertutup navbar (HOME-15).
- Features 3 kolom di 1280 px, 2 di 800 px, dan 1 di 390 px; FAQ bisa dibuka dengan keyboard; footer berisi teks jawaban 34 dengan tahun build dan lolos kontras 4,5:1.
- HTML mentah tanpa JavaScript sudah berisi SVG mockup versi Terang dan Gelap, dan CSS menampilkan yang sesuai tema.

**Yang bisa FaL cek:** layar pertama Home di ponsel; baca teks FAQ dalam kedua bahasa.

### Sesi 12: Home: mockup bergerak dan section Preview

**ID:** HOME-04 sampai HOME-08, NFR Performa (frame pertama Preview disisipkan di HTML; Home hanya memuat set pola pamer).

**Wireframe:** `home.png`, `engine-flow.png` (Hero dan Preview sebagai sumber konfigurasi).

**File:** `HeroMockup.svelte`, `HomePreview.svelte` (memakai `CompareSlider` dari Sesi 8), `src/lib/patterns/showcase.ts` (set pola pamer, di MVP keempat pola), dan perubahan kecil di `src/lib/share/link.ts` beserta tesnya ([bagian 5](#5-pertentangan-dan-catatan), butir 2).

**Uji otomatis (Playwright):**

- Mockup hero berganti tiap 2 detik dan section Preview tiap ±3 detik, diukur dengan `page.clock`; ukuran kotak mockup tidak berubah.
- Pergantian berhenti saat disentuh, diarahkan kursor, atau mendapat fokus, lalu berlanjut saat kursor atau fokus pergi atau diketuk lagi; berhenti juga saat tab tidak aktif dan saat `prefers-reduced-motion` aktif.
- Tombol Create di bawah Preview membawa `p`, `s`, `pal`, `bg`, dan `x`, tanpa `d` dan `m` (HOME-07).
- Hanya modul set pola pamer yang dimuat; JS awal Home ≤ 100 KB gzip.

**Yang bisa FaL cek:** arahkan kursor ke mockup dan section Preview; di ponsel, ketuk untuk menjeda dan melanjutkan; tekan Create dari Preview dan pastikan desainnya sama, dengan ukuran ponsel FaL sendiri (alur 5 di Bagian 12).

### Sesi 13: Pemeriksaan sebelum rilis publik

**ID:** NFR Aksesibilitas (WCAG 2.2 AA), NFR Performa (Lighthouse ≥ 90, LCP < 2,5 detik), NFR Responsif, NFR Kompatibilitas, NFR SEO dan berbagi (gambar Open Graph, sitemap), NFR Privasi, THM-06, G1 dan G2, gerbang Rilis publik di Bagian 13.

**Wireframe:** `roadmap.png`.

**File:** `static/sitemap.xml` dengan URL dari `SITE_URL`, gambar Open Graph yang dibuat sekali dengan Playwright yang sudah terpasang tanpa dependensi baru (jawaban 37), perbaikan dari temuan, dan daftar periksa di `docs/laporan/fase-1b/13-rilis/`.

**Uji:**

- Otomatis: axe di semua halaman, kedua tema, dan kedua bahasa; tanpa scroll horizontal di 360–2560 px; anggaran JS; tidak ada cookie yang ditulis dan tidak ada permintaan ke domain lain.
- FaL: Lighthouse lewat PageSpeed Insights pada link Preview Vercel; daftar periksa P0 di Safari iOS, Chrome Android, serta Chrome, Edge, Firefox, dan Safari desktop, sesuai device yang FaL sebutkan sebelum sesi ini (pertanyaan 38); job CI Firefox dan WebKit harus lulus mulai sesi ini (T5); SVG dibuka di Figma, Illustrator, dan Inkscape (G2); waktu dari membuka Create sampai unduhan pertama (G1).

---

## 5. Pertentangan dan catatan

1. **SHR-01 menyebut `replaceState`.** Di SvelteKit 3.0.1 yang terpasang, `replaceState` dari `$app/navigation` sudah usang; penggantinya `goto(url, { shallow: true, replace: true })`. Maksud PRD tetap terpenuhi karena riwayat browser tidak bertambah. Saran di laporan link untuk memakai `replaceState` dari `$app/navigation` diganti dengan cara ini.
2. **HOME-07 dan `writeLink`.** HOME-07 meminta link dari Home tanpa `d` dan tanpa `m`. `writeLink` sudah bisa melewatkan `d` (`device: null`), tetapi selalu menulis `m`. Sesi 12 perlu mengubah `src/lib/share/link.ts` sedikit, mis. `mode: null` berarti `m` tidak ditulis, beserta tesnya. Engine dan snapshot tidak tersentuh.
3. **Satu kebutuhan per sesi.** AGENTS.md meminta satu kebutuhan PRD atau satu pola per sesi, sedangkan beberapa sesi di sini mencakup beberapa ID. Ini sesuai permintaan FaL untuk membagi per bagian; setiap PR tetap kecil.
4. **Peta folder AGENTS.md** belum memuat `src/hooks.server.ts`, `src/lib/inline/`, `src/lib/palettes/`, `src/lib/components/create/`, `src/routes/404.html/`, dan `vercel.json` (pertanyaan 3). **Diputuskan:** ditambahkan di sesi yang pertama memakainya, bersama `src/lib/site.ts` dan `.github/` (jawaban 3 dan 5, T5).
5. **HOME-09 dan wireframe.** HOME-09 meminta satu kalimat per kartu Features, sedangkan wireframe memakai frasa pendek seperti "Semua di browser" (pertanyaan 33). **Diputuskan:** satu kalimat pendek per kartu, karena PRD yang berlaku (jawaban 33).
6. **Label Salin di EXP-03.** EXP-03 menyebut "tombol Salin", wireframe Ekspor menulis "Salin kode". Aku memakai "Salin kode" dari wireframe karena lebih jelas di samping tombol Salin link. **Selesai:** EXP-03 di PRD sekarang menulis tombol "Salin kode" (Copy code).
7. **Warna di wireframe hanya ilustrasi.** Di `panel-mode.png` dan `panel-warna.png`, versi Terang tampak pastel dan versi Gelap pekat. Engine (MODE-02) memakai warna palet apa adanya di varian Terang dan menurunkan varian Gelap, jadi panel akan menampilkan warna dari engine yang berbeda dari gambar.
8. **Domain (Q7) masih terbuka,** padahal `hreflang` (NAV-11, P0) dan sitemap butuh URL lengkap (pertanyaan 5). Aku tidak bisa membaca pengaturan domain proyek Vercel dari sini karena aksesnya ditolak. **Selesai:** Q7 diputuskan di PRD, `falette.vercel.app` (jawaban 5).

---

## 6. Pertanyaan untuk FaL

Pilihan a adalah rekomendasiku. Pertanyaan dikelompokkan menurut sesi pertama yang membutuhkannya, jadi kelompok awal paling mendesak. Jawaban FaL ada di [Keputusan FaL](#keputusan-fal).

### Sebelum Sesi 1

| No. | Hal | Pilihan |
| --- | --- | --- |
| 1 | **Teks UI yang belum ada di PRD.** PRD dan wireframe hanya memuat teks Indonesia, kecuali beberapa baris English (teks kotak ekspor, pemberitahuan link, label Disalin). Yang belum ada: semua versi English, label aksesibilitas (mis. tombol menu dan tutup), title dan meta description, teks 404, teks indikator proses Unduh, dan nama English palet serta preset. | (a) Aku mengusulkan teks Indonesia dan English dalam tabel di rencana tiap sesi, FaL menyetujui sebelum kode ditulis. (b) FaL menyiapkan semua teks lebih dulu. |
| 2 | **Alur tiap sesi.** | (a) Rencana singkat dan tabel teks di draft PR, tunggu persetujuan, lalu kode dan satu laporan di `docs/laporan/fase-1b/NN-nama/`. (b) Seperti Fase 1a: file rencana dan file laporan terpisah di setiap sesi. |
| 3 | **Peta folder AGENTS.md** untuk tempat baru di [bagian 5](#5-pertentangan-dan-catatan), butir 4. | (a) Ditambahkan di sesi yang pertama memakainya, dan disebut di rencana sesi itu. (b) AGENTS.md tidak diubah; tempat baru hanya dicatat di laporan. |
| 4 | **Atribut `lang` di HTML prerender.** `app.html` saat ini menulis `lang="en"` untuk semua halaman. | (a) `src/hooks.server.ts` dengan `transformPageChunk`, yang hanya berjalan saat build dan tidak menjadi server. (b) Dipasang JavaScript setelah halaman dimuat, sehingga HTML awal `/id/` tetap `lang="en"`. (c) Plugin Vite yang mengubah file hasil build. |
| 5 | **URL produksi** untuk `hreflang` dan sitemap, yang harus berupa URL lengkap. | (a) Subdomain Vercel proyek ini; mohon tulis alamat persisnya. (b) Domain sendiri sekarang. |
| 6 | **Font OFL** untuk jam (PRV-06) dan tipografi UI (Bagian 9). AGENTS.md melarang menambah font tanpa izin. Ukuran pasti kuukur dan kulaporkan sebelum dipasang. | (a) Inter lewat paket `@fontsource-variable/inter`: versinya terkunci, lisensi ikut, dan browser hanya mengunduh subset huruf yang dipakai. (b) File woff2 Inter beserta lisensi OFL disalin ke repo. (c) Font sistem untuk UI, Inter hanya untuk jam. |
| 7 | **Nilai token warna.** PRD hanya meminta abu-abu netral dengan satu aksen; wireframe memakai aksen biru. | (a) Aku menentukan nilainya (abu-abu netral, aksen biru seperti wireframe), lolos uji kontras otomatis, dan menampilkan contohnya di laporan Sesi 1. (b) FaL memberi nilai HEX. |
| 8 | **Alat uji aksesibilitas dan performa.** | (a) `@axe-core/playwright` sebagai devDependency untuk pemeriksaan WCAG otomatis sejak Sesi 1; Lighthouse dijalankan FaL lewat PageSpeed Insights, tanpa dependensi. (b) Tanpa axe; aksesibilitas hanya diperiksa manual. |
| 9 | **Header di `vercel.json`.** NFR Keamanan hanya mencontohkan `frame-ancestors`. | (a) Di Sesi 1, hanya `frame-ancestors 'none'`. (b) Menunggu Sesi 13. |

### Sebelum Sesi 2

| No. | Hal | Pilihan |
| --- | --- | --- |
| 10 | **Ikon** (matahari, bulan, globe, panah, menu, tutup, centang, unduh, tukar, plus, peringatan, perangkat). Tidak ada library ikon. | (a) Kugambar sendiri sebagai SVG inline sederhana di satu komponen, masing-masing di bawah 1 KB. (b) FaL menyediakan file ikon. |
| 11 | **Logo dan favicon** (NAV-01). Wireframe hanya menampilkan lingkaran, dan favicon masih logo Svelte. | (a) Aku membuat tanda sederhana, lingkaran dengan busur seperti pola Arcs, ditambah wordmark "Falette", lalu FaL menyetujui lewat tangkapan layar. (b) FaL menyediakan file SVG. |

### Sebelum Sesi 3

| No. | Hal | Pilihan |
| --- | --- | --- |
| 12 | **Isi 12 palet terkurasi (COL-01).** PRD hanya memberi nama. Belum ada HEX, mana yang monokrom atau duotone, mana yang menyimpan latar Manual, dan nama English-nya. Senja di wireframe berisi biru, oranye, hijau, dan navy, sedangkan contoh Lampiran B memakai `e07a5f.3d405b.81b29a` dengan latar `f4efe6`. Apakah salah satunya Senja yang sebenarnya? | (a) Aku mengusulkan 12 palet beserta gambar contoh tiap palet di keempat pola, terang dan gelap, di rencana Sesi 3. (b) FaL memberi HEX semua palet. |
| 13 | **Seed acak** untuk nilai awal dan tombol Acak. Seed MVP berupa angka (Bagian 5). | (a) Bilangan bulat 1–99999, tidak sama dengan seed sebelumnya. (b) 1–9999. (c) Seluruh rentang 32-bit. |
| 14 | **Preset "terdekat" di DEV-03.** | (a) Ukuran layar dikali DPR; ponsel dan tablet dibaca potret; cari rasio terdekat dulu (sesuai mitigasi di Bagian 15), lalu jumlah piksel terdekat; bila link membawa ukuran, tidak ada deteksi dan tidak ada label Terdeteksi. (b) Jumlah piksel terdekat saja. |
| 15 | **Batas "mobile" untuk Bandingkan (MODE-03).** Bagian 8.1 menyebut tablet 768–1023 px memakai susunan ponsel. | (a) Di bawah 1024 px, sama dengan batas tata letak. (b) Di bawah 768 px. |
| 16 | **Lembar dari bawah.** NFR meminta fokus pindah ke lembar dan kembali ke kartu asal, sedangkan preview tetap terlihat. | (a) Fokus terkunci di lembar; preview terlihat tanpa latar gelap tetapi tidak bisa disentuh selama lembar terbuka. (b) Preview tetap bisa disentuh, mis. slider Bandingkan, dan fokus tidak dikunci. |
| 17 | **Berdampingan untuk wallpaper lanskap.** Dua wallpaper desktop berdampingan di area preview desktop akan sangat kecil. | (a) Lanskap: Terang di atas, Gelap di bawah; potret: kiri dan kanan seperti wireframe. (b) Selalu kiri dan kanan. |

### Sebelum Sesi 5

| No. | Hal | Pilihan |
| --- | --- | --- |
| 18 | **Isi thumbnail pola (PAT-03).** | (a) Palet, latar, dan seed yang sedang dipakai, parameter awal tiap pola, varian mengikuti tema website, kotak 2:1 seperti wireframe. (b) Sama seperti (a), tetapi varian selalu Terang. (c) Desain contoh tetap yang tidak ikut berubah. |
| 19 | **Parameter saat pola diganti.** | (a) Kembali ke nilai awal katalog, sama seperti saat link dibaca. (b) Nilai terakhir tiap pola diingat selama kunjungan. |

### Sebelum Sesi 6

| No. | Hal | Pilihan |
| --- | --- | --- |
| 20 | **Color picker (COL-03).** Wireframe menampilkan area warna dan strip vertikal. Apakah strip itu penggeser rona atau deretan warna palet terkurasi? | (a) Picker sendiri: area saturasi dan kecerahan, strip rona vertikal, dan isian HEX, semuanya bisa dipakai dengan keyboard. (b) `<input type="color">` bawaan browser ditambah isian HEX; lebih ringan, tetapi tampilannya berbeda di tiap OS. |
| 21 | **Warna slot baru** saat tombol + ditekan. | (a) Rona slot terakhir diputar 30° di OKLCH, dengan terang dan kepekatan yang sama. (b) Salinan slot terakhir. (c) Warna acak sesuai harmoni yang sedang dipilih. |
| 22 | **Latar saat Acak palet.** | (a) Latar tidak berubah: Otomatis tetap Otomatis, dan Manual tetap warna yang sama, dengan peringatan bila jadi terlalu mirip. (b) Latar kembali ke Otomatis. |

### Sebelum Sesi 7

| No. | Hal | Pilihan |
| --- | --- | --- |
| 23 | **Bidang OS untuk baris "Kelas umum"** di DEV-02. Laptop dan desktop umum tidak punya OS tertentu. | (a) Kosong (`null`), sedangkan templat overlay disimpan di bidang tersendiri. (b) Diisi `windows`. |
| 24 | **Contoh model di UI.** Wireframe hanya menampilkan nama dan resolusi. | (a) Tidak ditampilkan di MVP; hanya disimpan di JSON. (b) Teks kecil di bawah nama preset. (c) Tooltip. |
| 25 | **Isian ukuran Custom.** | (a) Bebas diketik; dibulatkan dan dipotong ke 320–7680 saat isian ditinggalkan atau Enter ditekan, dan preview berubah saat itu. (b) Preview berubah setiap ketikan bila nilainya sah. |

### Sebelum Sesi 9

| No. | Hal | Pilihan |
| --- | --- | --- |
| 26 | **Pola jam "desktop umum"** (`lap-*`, `desk-*`). PRV-02 menyebut "sesuai pola OS". | (a) Jam besar dan tanggal di kiri bawah, seperti lock screen Windows. (b) Jam di tengah atas seperti Mac. |
| 27 | **Isi status bar ponsel dan tablet.** | (a) Bentuk generik sinyal, Wi-Fi, dan baterai di kanan, tanpa nama operator; jam kecil di kiri hanya di templat Android. (b) Tanpa ikon, hanya ruang kosong. |
| 28 | **Templat untuk Android dan Custom.** Templat Android dipakai ponsel `and-*` dan tablet `tab-wqxga`. PRV-02 juga tidak memberi batas rasio "memanjang" dan "mendekati persegi". | (a) Templat Android punya varian ponsel dan tablet. Custom: tinggi ≥ 1,8 × lebar memakai Android ponsel; potret lain sampai persegi memakai Android tablet; lanskap memakai desktop umum. (b) Custom ponsel memakai templat iPhone. |
| 29 | **Format jam English (PRV-04).** | (a) Region dari browser bila bahasanya English, mis. en-GB menjadi 24 jam; selain itu en-US dengan 12 jam. Indonesia selalu id-ID, 24 jam. (b) English selalu en-US. |

### Sebelum Sesi 10

| No. | Hal | Pilihan |
| --- | --- | --- |
| 30 | **Varian ekspor setelah dipilih manual.** Bagian 8.7 hanya mengatur nilai awalnya. | (a) Varian mengikuti tampilan preview sampai pengguna memilih sendiri di panel Ekspor; setelah itu tetap. (b) Selalu mengikuti tampilan preview. |
| 31 | **Isi panel kode SVG (EXP-03).** | (a) Cuplikan dua baris seperti wireframe; Salin kode tetap menyalin kode lengkap. (b) Kode lengkap di kotak baca-saja yang bisa digulir. |

### Sebelum Sesi 11 dan 12

| No. | Hal | Pilihan |
| --- | --- | --- |
| 32 | **Teks hero.** HOME-01 memakai kata "mis." untuk "Wallpaper minimalis dari algoritma." dan "Gratis, tanpa akun." | (a) Dipakai apa adanya sebagai teks Indonesia, dan versi English-nya kuusulkan di tabel teks. (b) FaL menulis teks baru. |
| 33 | **Teks kartu Features.** | (a) Frasa pendek seperti di wireframe ("Semua di browser", "Ukuran & parameter", dan seterusnya). (b) Satu kalimat penuh sesuai HOME-09, kuusulkan di tabel teks. |
| 34 | **Isi footer (HOME-13).** | Mohon tulis nama untuk kredit pembuat, dan apakah tautan repositori `github.com/FaLjourney/falette` boleh dipasang (apakah repo ini publik saat rilis). |
| 35 | **Mockup hero (HOME-04).** | (a) Ukuran dari ke-28 preset dengan bingkai generik ponsel, tablet, laptop, dan desktop; tiap pergantian memakai pola, palet terkurasi, dan seed acak dengan parameter awal; frame pertama tetap: Arcs, Senja, seed 42, `ios-63`. (b) Hanya preset ponsel dan tablet. |
| 36 | **Section Preview (HOME-06).** | (a) Preset `desk-qhd` (2560 × 1440, 16:9) dengan bingkai layar tipis tanpa kaki; isi berganti dengan aturan yang sama seperti hero. (b) Tanpa bingkai, hanya sudut membulat. |

### Sebelum Sesi 13

| No. | Hal | Pilihan |
| --- | --- | --- |
| 37 | **Gambar Open Graph.** | (a) Wallpaper dari engine berukuran 1200 × 630 dengan logo, dibuat sekali lewat skrip lalu disimpan di `static/`. (b) FaL menyediakan gambarnya. |
| 38 | **Device untuk uji rilis.** | Mohon tulis device dan browser yang FaL punya (iPhone, Android, Mac, Windows), supaya daftar periksa Sesi 13 disesuaikan. |

---

## 7. Di luar Fase 1b

Kebutuhan P1 dan P2 berikut tidak dikerjakan, sesuai aturan AGENTS.md: NAV-07, NAV-08, NAV-12, THM-07, THM-08, HOME-14, PAT-05, PAT-06, PAT-08, COL-04, DEV-06, DEV-07, DEV-08, MODE-05, PRV-07 sampai PRV-10, EXP-08 sampai EXP-12, SHR-04, SHR-05, ENG-09, dan ENG-10.

Untuk ENG-10: daftar pola ringan tetap dibuat di Sesi 3 karena ENG-03 dan AGENTS.md memintanya, tetapi di MVP keempat modul pola ikut dimuat. Pemisahan modul (code splitting) menyusul di Fase 2.

---

## 8. Setelah disetujui

1. PR #13 berisi rencana ini, catatan persetujuan dan keputusan FaL, serta pembaruan `docs/PRD.md` (Q7, EXP-03, dan kalimat di atas tabel Pertanyaan terbuka). FaL yang menggabungkannya.
2. Setelah PR #13 digabung, Sesi 1 dimulai dari main terbaru dengan `docs/laporan/fase-1b/01-rute-bahasa-tema/rencana.md` berisi rencana singkat dan tabel teks ID/EN, lalu menunggu persetujuan sebelum kode ditulis.
