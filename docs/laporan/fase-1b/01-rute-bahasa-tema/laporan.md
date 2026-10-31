# Sesi 1: Rute, bahasa, dan tema — laporan

Sesi 1 dari [rencana Fase 1b](../rencana.md), sesuai [rencana sesi](rencana.md) yang disetujui FaL dengan perubahan P1–P6. Branch `claude/charming-albattani-ms0114`, dari main `b3b2744`, di PR #14.

**Status:** kode dan tes selesai, dan ketiga job CI hijau, termasuk Firefox dan WebKit, setelah tes EXP-07 dari Fase 1a diperbaiki dengan izin FaL ([bagian CI](#ci)).

**T1 selesai.** Di link Preview, header `frame-ancestors` terkirim dari `vercel.json`, dan path asal-asalan menampilkan 404 Falette dengan status 404. Aturan 404 pertama di `adapter.ts`, di fase filesystem, gagal di cek ulang FaL. Aturan di fase error yang menggantikannya lulus ([bagian T1](#link-preview-vercel-t1)).

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| `c2d83f3` | `rencana.md` | Catatan persetujuan dan perubahan P1–P6 | |
| `3ae9423` | `package.json`, `package-lock.json` | `@fontsource-variable/inter` 5.3.0 (OFL-1.1) di `dependencies`; `@axe-core/playwright` 4.14.0 di `devDependencies` | PRV-06, NFR Aksesibilitas |
| `22c7766` | `src/` dan `vite.config.ts` | Rute per bahasa, pengalih `/` dan `/create/`, token dan tema, kamus en dan id, halaman 404 | NAV-10, NAV-11, THM-01, THM-02, THM-04, THM-06 |
| `4484946` | `tests/` | 37 tes unit dan 52 tes Playwright baru | |
| `dbb3ac8` | `vercel.json` | Header `Content-Security-Policy: frame-ancestors 'none'` | NFR Keamanan |
| `590c2d6` | `.github/workflows/ci.yml` | CI untuk setiap PR | T5 |
| `9055632` | `AGENTS.md` | Baris peta folder untuk tempat baru | Jawaban 3, T5 |
| `56f7167` | `*.png` | Tangkapan layar | |
| `ec7dfdd` | `tests/export/png.e2e.ts` | Tes "lets the page paint before the heavy work starts" membandingkan urutan kejadian, bukan stempel waktu (izin FaL) | EXP-07 |
| `d0cc497` | `adapter.ts`, `vite.config.ts`, `tests/adapter.test.ts` | Pembungkus adapter-static: aturan 404 di fase filesystem `.vercel/output/config.json`, dengan 4 tes unit (keputusan 2). Gagal di Preview. | Tabel rute, T1 |
| `df7e641` | `AGENTS.md` | Baris peta folder untuk `adapter.ts` | Jawaban 3 |
| `516fef7` | `adapter.ts`, `tests/adapter.test.ts` | Aturan 404 dipindah ke fase error, dan tes unit disesuaikan | Tabel rute, T1 |
| Commit laporan | `laporan.md` | Laporan ini | |

Yang tidak disentuh: engine, pola, kode ekspor, link berbagi, preset, snapshot ENG-08, PRD, dan katalog. Versi engine tetap 1.

---

## Cara kerja

**Skrip inline.** Ada tiga skrip kecil di `src/lib/inline/`. `src/hooks.server.ts` menyisipkannya saat prerender, tepat setelah meta CSP dan sebelum link CSS (P2). `vite.config.ts` menghitung hash SHA-256 dari file yang sama dan memasukkannya ke `script-src`.

| Halaman | Skrip | Ukuran |
| --- | --- | --- |
| Semua | `theme.js` | 697 B |
| `/`, `/create/` | `lang-redirect.js`, lalu `theme.js` | 788 B + 697 B |
| `404.html` | `lang-404.js`, lalu `theme.js` | 861 B + 697 B |

**Bahasa.**

- Ketujuh halaman di-prerender: `/`, `/create/`, `/en/`, `/id/`, `/en/create/`, `/id/create/`, dan `/404.html`.
- `hooks.server.ts` mengisi `<html lang>` per halaman.
- Kamus dimuat lewat `import()` per bahasa, jadi browser hanya mengunduh bahasa aktif.
- `hreflang` mengikuti halamannya (P4), dan URL-nya dibentuk dari `SITE_URL` di `src/lib/site.ts`.
- Halaman pengalih tidak memuat JavaScript aplikasi (`csr = false`). Pengalihnya mempertahankan query dan hash (P3).
- Bahasa tersimpan dibaca dari `falette:lang`. Sesi ini hanya membacanya; yang menulis nanti dropdown bahasa di Sesi 2.

**Tema.**

- Token ada di `src/app.css`, dan `:root[data-theme='dark']` menimpa token warna.
- `theme.js` memasang `data-theme` dari `falette:theme`, atau dari setelan sistem. Pilihan tersimpan dibaca ulang setiap kali setelan sistem berubah (P6).
- Tanpa JavaScript, tema tetap terang.

**404.**

- `src/routes/404.html/` memakai `trailingSlash = 'never'` dan `csr = false`, jadi build menulis `404.html`.
- HTML-nya memuat teks kedua bahasa, dan CSS hanya menampilkan bahasa yang ada di `<html lang>`. `lang-404.js` mengganti `lang` dan judul sesuai bahasa tersimpan, dengan cadangan English.
- `paths: { relative: false }` membuat CSS dan tautan berbentuk `/_app/…` dan `/en/…`, sehingga tetap benar di path bertingkat (P1).

**Font.** Inter Variable sumbu `wght`. Untuk en dan id hanya subset latin yang diunduh: `inter-latin-wght-normal.woff2`, 48.256 B.

---

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | 0 error, 0 peringatan (425 file) |
| `npm run lint` | Bersih |
| `npm test` | 660 tes unit (41 baru) dan 101 tes Playwright di Chromium (52 baru) lulus. Snapshot ENG-08 tidak berubah. |
| `npm run build` | Berhasil, 7 halaman |

Tes baru:

| File | Jumlah | Isi |
| --- | --- | --- |
| `tests/i18n.test.ts` | 5 | Kunci dan placeholder en dan id sama, tidak ada teks kosong, `t()` mengisi placeholder |
| `tests/tokens.test.ts` | 21 | Tema gelap menimpa semua token warna; 10 pasangan kontras di kedua tema |
| `tests/inline-scripts.test.ts` | 11 | Ketiga skrip dijalankan di `node:vm`, termasuk penyimpanan yang melempar error, pilihan tema yang disimpan setelah halaman dimuat (P6), dan setiap bahasa di `src/params/lang.ts` |
| `tests/site.e2e.ts` | 36 | Pengalih, query dan hash (P3), `lang` dan `hreflang` (P4), urutan skrip (P2), tanpa atribut `style` (T2), tema tanpa kedip, navigasi antarbahasa, dan 404 di path bertingkat (P1) |
| `tests/budget.e2e.ts` | 2 | JS awal Home dan Create |
| `tests/a11y.e2e.ts` | 14 | axe WCAG 2.2 AA di semua halaman, terang dan gelap |
| `tests/adapter.test.ts` | 4 | Aturan 404 di fase error config Vercel ([bagian T1](#percobaan-2-fase-error-commit-516fef7)) |

Semua tes e2e halaman situs gagal bila browser mencatat pelanggaran CSP (`tests/helpers/site.ts`).

**Pengukuran**

| Hal | Hasil |
| --- | --- |
| JS awal `/en/` | 37.717 B gzip (batas 100 KB) |
| JS awal `/en/create/` | 37.720 B gzip (batas 200 KB) |
| Font yang diunduh di en dan id | 48.256 B (woff2) |

**Uji mutasi P1:** dengan `paths.relative: true`, kedua tes 404 di path bertingkat gagal karena kedua bahasa tampil (2, bukan 1). Setelah dikembalikan ke `false`, keduanya lulus.

---

## CI

| Run | Commit | `verify` (check, lint, unit, build) | `e2e-chromium` | `e2e-firefox-webkit` (informasi) |
| --- | --- | --- | --- | --- |
| 1 | `9055632` | Lulus | Lulus | Dibatalkan, digantikan run 2 |
| 2 | `56f7167` | Lulus | Lulus | Gagal: 201 dari 202 tes lulus (Firefox) |
| 3 | `185b234` | Lulus | Tes lulus, job dibatalkan oleh run 4 | Dibatalkan, digantikan run 4 |
| 4 | `a7e30e0` | Lulus | Lulus | Gagal: 200 dari 202 tes lulus (Firefox dan WebKit) |
| 5 | `ec7dfdd` | Lulus | Lulus | Dibatalkan, digantikan run 6 |
| 6 | `6316124` | Lulus | Lulus | **Lulus: 202 dari 202 tes (7,0 menit)** |

Workflow membatalkan run lama di branch yang sama, jadi setiap push memulai run baru. Job WebKit paling lama di `tests/export/timing.e2e.ts` (5–6 menit).

**Kegagalan Firefox dan WebKit (run 2 dan 4).** Semua 52 tes baru Sesi 1 lulus di kedua browser. Yang gagal hanya tes Fase 1a, `tests/export/png.e2e.ts:156` ("EXP-07: lets the page paint before the heavy work starts"). Tes itu mengharapkan stempel waktu `painted` lebih kecil dari `started`, tetapi keduanya bernilai sama: 155 dan 155 di Firefox, 82 dan 82 di WebKit. Penyebabnya, kedua browser membulatkan `performance.now()` ke sekitar 1 ms, sehingga dua kejadian dalam milidetik yang sama tampak bersamaan.

**Perbaikan (commit `ec7dfdd`, dengan izin FaL).** Tes sekarang mencatat kejadian ke satu array, lalu mengharapkan urutan `['painted', 'started', 'loaded']`:

- `painted`: callback `requestAnimationFrame`
- `started`: panggilan pertama `URL.createObjectURL`
- `loaded`: penanda `falette:png:loaded`

Maksud tesnya tetap: indikator sempat digambar sebelum kerja berat dimulai. Perbandingan kedua, `started` sebelum `loaded`, ikut diubah ke urutan, karena memakai stempel waktu yang sama dan bisa gagal dengan cara yang sama.

- **Uji mutasi:** dengan `await afterPaint()` di `svgToPng` dilewati, tes gagal dan urutannya menjadi `['started', 'painted', 'loaded']`. Setelah dikembalikan, `png.ts` tidak berubah.
- **Chromium (lokal):** tes lulus 5 kali berturut-turut (`--repeat-each=5`), dan seluruh `tests/export/png.e2e.ts` (43 tes) lulus.
- **Firefox dan WebKit (CI):** run 6 menjalankan kode tes yang sama dengan run 5 yang dibatalkan, dan semua 202 tes lulus. Job `e2e-firefox-webkit` hijau untuk pertama kalinya.

**Supaya job wajib benar-benar menahan merge,** FaL perlu memasang ruleset di GitHub:

1. Buka Settings → Rules → Rulesets → New ruleset → New branch ruleset.
2. Beri nama, mis. `main`, lalu set Enforcement status ke Active.
3. Di Target branches, tambahkan Include default branch.
4. Centang Require status checks to pass, lalu tambahkan `verify` dan `e2e-chromium`.
5. Simpan dengan Create. Jangan tambahkan `e2e-firefox-webkit`, karena job itu hanya informasi sampai Sesi 13.

---

## Link Preview Vercel (T1)

Link Preview dilindungi Vercel Authentication: permintaan tanpa login dialihkan (302) ke `vercel.com/login`. Kebijakan jaringan environment ini juga memblokir `*.vercel.app` (proxy menjawab 403). Karena itu FaL yang mengecek dari sisinya.

### Hasil cek FaL (sebelum pembungkus)

**Header: lulus.** `curl.exe -sI` ke `/en/` di link Preview. Ini baris yang relevan, sesuai laporan FaL:

```
HTTP/1.1 200 OK
Content-Security-Policy: frame-ancestors 'none'
X-Robots-Tag: noindex
```

- `vercel.json` dipakai Vercel, jadi header tetap di sana dan tidak bertentangan dengan NFR Keamanan.
- Header itu tidak ditambahkan ke pembungkus adapter.
- `X-Robots-Tag: noindex` dikirim Vercel untuk Preview, bukan oleh situs.

**404: gagal.** `/id/tidak-ada/` di link Preview menampilkan 404 bawaan Vercel ("This page doesn't exist", "404 NOT_FOUND"). Ini sesuai dugaan dari simulasi sebelumnya: `.vercel/output/config.json` yang ditulis adapter-static tidak punya aturan yang menyajikan `404.html`.

### Percobaan 1: aturan di fase filesystem (commit `d0cc497`), gagal

`adapter.ts` membungkus adapter-static (keputusan 2). Setelah adapter-static menulis config di Vercel, pembungkus menambah aturan ini di urutan terakhir, setelah `{ "handle": "filesystem" }`:

```json
{ "src": "/.*", "dest": "/404.html", "status": 404 }
```

Simulasi `VERCEL=1 npm run build` memperlihatkan aturan itu di `config.json`. Tetapi cek ulang FaL di Preview (deployment dengan `d0cc497`) masih mendapat 404 bawaan Vercel. Ini keluaran `curl.exe -sI` ke `/id/tidak-ada/`:

```
HTTP/1.1 404 Not Found
Content-Length: 79
Content-Security-Policy: frame-ancestors 'none'
Content-Type: text/plain; charset=utf-8
X-Vercel-Error: NOT_FOUND
```

`text/plain` dan `X-Vercel-Error: NOT_FOUND` menandakan 404 bawaan Vercel, bukan isi `404.html`. Header `frame-ancestors` tetap terkirim, juga pada respons 404 ini. `/en/` tetap 200 dengan header yang sama.

**Penyebab yang paling mungkin** (diagnosis FaL, kucek di kode Vercel): aturan ber-`dest` di fase filesystem tidak dicek ulang ke filesystem tanpa `check: true`. Di `@vercel/routing-utils` 6.6.1, setiap rewrite dari `vercel.json` diberi `check: true` (`dist/superstatic.js:158`), dan validatornya mewajibkan `check: true` untuk aturan ber-`dest` setelah `handle: miss` (`dist/index.js:166`).

### Percobaan 2: fase error (commit `516fef7`)

Aturan itu diganti dengan dua aturan di urutan paling akhir, setelah semua aturan adapter-static:

```json
{ "handle": "error" },
{ "src": "/.*", "dest": "/404.html", "status": 404 }
```

- Ini pola builder resmi Vercel untuk Build Output API. Bila ada halaman 404 statis, `@vercel/next` 28.0.1 menutup daftar aturannya dengan `{ handle: "error" }`, lalu `{ status: 404, src: <entry>/.*, dest: /<entry>/404 }` (`dist/index.js:18551`). Ini kucek lewat `npm pack`, tanpa memasang paketnya.
- Fase error dicek setelah sebuah permintaan berakhir dengan error seperti 404, jadi `/id/tidak-ada/` mendapat isi `404.html` dengan status 404.
- Aturan lain dari adapter-static tetap utuh. Ada satu akibat sampingan pada aset `/_app/immutable` yang hilang. Statusnya tetap 404 dengan `cache-control: no-store`, tetapi isinya kemungkinan ikut menjadi `404.html`, karena aturan adapter-static untuk aset itu juga berakhir dengan 404. Browser tetap gagal memuat aset itu, seperti sebelumnya.
- Vercel hanya mengizinkan satu `handle` dari tiap jenis (validator di `@vercel/routing-utils`). Karena itu, bila config sudah punya fase error, build dihentikan dengan error.
- Pembungkus hanya berjalan bila `VERCEL` ada, sama dengan deteksi adapter-static. Build biasa tidak berubah, dan header `frame-ancestors` tetap di `vercel.json`.

**Tes unit** (`tests/adapter.test.ts`, 4 tes):

- Kedua aturan ditambahkan paling akhir, dan aturan serta kunci lain tetap sama.
- Fase error berada setelah fase filesystem dan semua aturan adapter-static.
- Aturan tidak ditambahkan dua kali.
- Config yang sudah punya fase error lain ditolak.

**Bukti `VERCEL=1 npm run build`:** `config.json` berisi 17 aturan. Itu 15 aturan adapter-static yang tidak berubah, lalu `handle: error` (indeks 15) dan aturan 404. `handle: filesystem` ada di indeks 13. Tiga aturan terakhirnya:

```json
[
  {
    "src": "/_app/immutable/.+",
    "status": 404,
    "headers": { "cache-control": "no-store" },
    "continue": false
  },
  { "handle": "error" },
  { "src": "/.*", "dest": "/404.html", "status": 404 }
]
```

Build tanpa `VERCEL` hanya menulis `build/`, tanpa `.vercel/output`.

### Langkah cek ulang untuk FaL setelah deploy

Pakai deployment Preview dari commit terakhir PR ini, yang memuat `516fef7`, dengan cara masuk yang sama seperti saat mengecek `/en/`.

1. Buka `/id/tidak-ada/` di browser. Yang harus tampil adalah 404 Falette, bukan 404 bawaan Vercel: "Page not found" dengan tautan Home dan Create ke `/en/…`. Bahasa Inggris tampil karena belum ada bahasa tersimpan.
2. Opsional, untuk melihat versi Indonesia: jalankan `localStorage.setItem('falette:lang', 'id')` di konsol DevTools, lalu muat ulang. Harus tampil "Halaman tidak ditemukan" dengan tautan ke `/id/…`.
3. Jalankan `curl.exe -sI <link Preview>/id/tidak-ada/`. Hasilnya harus berisi `HTTP/1.1 404 Not Found`, `Content-Type: text/html`, dan `Content-Security-Policy: frame-ancestors 'none'`, tanpa `X-Vercel-Error`.
4. Jalankan `curl.exe -sI <link Preview>/en/`. Hasilnya harus tetap `HTTP/1.1 200 OK` dengan header yang sama.

### Hasil cek ulang FaL (dengan `516fef7`): lulus

FaL mengecek ulang di deployment Preview yang memuat `516fef7`: `/id/tidak-ada/` menampilkan 404 Falette dengan status 404. Jadi aturan di fase error bekerja di Vercel, dan pola lain tidak perlu dicoba.

---

## Tangkapan layar

Kerangka halaman dengan token dan font Inter. Home desktop terang dan gelap, 1280 × 800:

![Home desktop, terang](home-desktop-light.png)
![Home desktop, gelap](home-desktop-dark.png)

Home ponsel (Indonesia), terang dan gelap, 390 × 844:

![Home ponsel, terang](home-ponsel-light.png)
![Home ponsel, gelap](home-ponsel-dark.png)

`404.html` disajikan di `/id/tidak-ada/` dengan bahasa tersimpan `id`: CSS termuat dan hanya teks Indonesia yang tampil (P1):

![404 di path bertingkat, Indonesia, gelap](404-bertingkat-id-ponsel-dark.png)

---

## Penyimpangan dan catatan

1. **Tipe `Handle`** di SvelteKit 3 ada di `@sveltejs/kit/hooks`, bukan `@sveltejs/kit`.
2. **Tautan memakai `resolve()` dari `$app/paths`,** karena aturan ESLint `svelte/no-navigation-without-resolve`. Bentuk path seperti `` `${lang}/create/` `` dipakai supaya garis miring di akhir tetap ada.
3. **axe tidak bisa berjalan bila JavaScript dimatikan.** Karena itu halaman pengalih diuji dalam bentuk yang dilihat pengunjung tanpa JavaScript: skrip pengalih dibuang dan isi `<noscript>` ditampilkan, lewat `page.route`.
4. **`package-lock.json` dibuat ulang dengan npm 11.21.0,** karena npm 10.9.4 di container membuang bidang `libc` dari paket bawaan rolldown dan lightningcss. Selain dua paket baru (ditambah `axe-core`), npm hanya membuang satu entri `yaml` 2.9.1 yang berstatus `extraneous` dan tidak dipakai.
5. **`npm audit`** mencatat 6 temuan (4 low, 2 moderate) di alat pengembangan: deepmerge lewat `@sveltejs/vite-plugin-svelte`, dan vitest. Semuanya sudah ada sebelum sesi ini, dan kedua paket baru tidak menambah temuan.
6. **Skrip inline ikut membawa komentarnya** (tabel di atas). Hash dihitung dari teks yang sama, jadi komentar tidak merusak CSP.
7. **`hooks.server.ts` punya jalur cadangan:** halaman tanpa meta CSP mendapat skrip di awal `<head>`. Semua halaman prerender punya meta CSP, dan tes urutan skrip memastikannya.
8. **`t()` sudah mendukung `{placeholder}`** sesuai rencana, walaupun teks Sesi 1 belum memakainya. Teks ekspor di Sesi 10 akan memakainya, dan perilakunya sudah diuji.
9. **`<html lang>` mengikuti navigasi di browser** lewat `$effect` di layout bahasa. Di Sesi 1 belum ada tautan antarbahasa, jadi tes menyisipkan tautan sementara ke halaman. Dropdown di Sesi 2 akan memakai jalur yang sama.
10. **`adapter.ts` berada di root,** di samping `vite.config.ts` yang mengimpornya, dan sudah dicatat di peta folder AGENTS.md. Pembungkus itu mengulang cara adapter-static mendeteksi Vercel (`process.env.VERCEL`), karena hanya dalam kondisi itu adapter-static menulis `config.json`.

---

## Belum diuji

- Header `frame-ancestors` pada respons 404 Falette yang baru. Laporan cek ulang kedua hanya menyebut tampilan dan status 404. Header itu sudah terbukti pada respons 404 sebelumnya dan pada `/en/`, dan aturan header di `vercel.json` berlaku untuk semua path.
- Safari dan Firefox di device asli. Di CI, Firefox dan WebKit lewat Playwright lulus (run 6).
- Device asli: pengalih bahasa di ponsel, tema yang ikut berubah saat setelan sistem berubah, dan tidak adanya kedip saat dimuat ulang.
- Path tak dikenal di server lokal. `vite preview` dijalankan SvelteKit, jadi 404 hanya diuji dengan menyajikan `404.html` lewat `page.route`.
- Lighthouse, yang menunggu Sesi 13.
