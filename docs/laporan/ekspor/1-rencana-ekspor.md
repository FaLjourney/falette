# Rencana: ekspor PNG, SVG, dan kode SVG (EXP-01 sampai EXP-07)

Langkah 4 Fase 1a di AGENTS.md. Link berbagi (SHR-01 sampai SHR-03) dikerjakan di sesi berikutnya. Rencana ini menunggu persetujuan FaL; bagian [Keputusan](#8-keputusan-yang-kubutuhkan) berisi pilihan beserta rekomendasiku. Belum ada kode yang ditulis.

**Pengecekan awal:** main sudah memuat PR #9 (`7cb13e9`), dan keempat pola MVP (arcs, hills, waves, gradient) sudah bertanda ✅ di katalog. Branch `claude/keen-cray-kn0wah` sama dengan main.

---

## 1. Pembagian kerja

Halaman Create belum ada (Fase 1b), jadi sesi ini hanya membuat modul dan tesnya. UI panel Ekspor menyusul.

| Sekarang (Fase 1a) | Menunggu Fase 1b |
| --- | --- |
| `src/lib/export/`, modul tanpa UI: `filename.ts` (EXP-05), `svg-code.ts` (EXP-03, Rapi/Ringkas), `svg-file.ts` (EXP-02, Blob SVG), `png.ts` (EXP-01, EXP-04, EXP-06, EXP-07), `png.worker.ts` (EXP-07), `download.ts` (memicu unduhan dari Blob) | Isi panel Ekspor sesuai [panel-ekspor.png](../../wireframes/panel-ekspor.png): Format, Varian, nama file, kotak Kode SVG, Salin kode, pilihan Rapi/Ringkas, dan kelompok Bagikan |
| Tes unit (Vitest) dan tes browser (Playwright) lewat halaman uji `tests/harness/` yang tidak ikut ke situs | Kotak "PNG terlalu besar" dengan Unduh lebih kecil dan Unduh SVG, indikator proses di tombol Unduh, dan pesan gagal |
| Fixture semua 28 preset di `tests/fixtures/presets.ts`, selama `presets.json` belum ada | Helper clipboard beserta cadangannya, dipakai bersama SHR-02 |
| Laporan di `docs/laporan/ekspor/` | Teks i18n di `en.json` dan `id.json`, serta pemuatan modul ekspor saat dipakai supaya JS awal Create tidak bertambah |

Rancangan API:

| Fungsi | Isi |
| --- | --- |
| `exportFileName({ pattern, variant, width, height, seed, format })` | Nama file EXP-05 |
| `formatSvg(svg, 'pretty' \| 'compact')` | Kode SVG Rapi atau Ringkas |
| `checkPngSize(size)` | `{ ok: true }` atau `{ ok: false, smaller }` |
| `svgToPng(svg, size)` | `Promise<Blob>`, atau gagal dengan `PngExportError` beralasan `'too-large'` atau `'failed'` |
| `downloadFile(blob, name)` | Unduhan lewat `a.download` |

Modul menerima string SVG yang sama dengan preview, jadi tidak ada render ulang ("Semua file dibuat di browser dari string SVG yang sama dengan preview", bagian 8.7 PRD).

---

## 2. EXP-01 dan EXP-06: PNG berdimensi persis dan batas canvas

### Alur

1. String SVG dijadikan Blob, lalu URL `blob:`. CSP sudah mengizinkan `img-src blob:`.
2. URL dimuat ke `Image`. Aku menunggu event `load`, bukan `decode()`, karena tidak mau bergantung pada perilaku `decode()` untuk SVG di Safari.
3. Gambar digambar ke canvas berukuran persis `width × height` dengan skala 1:1. Akar SVG sudah memuat `width` dan `height` yang sama.
4. Piksel pojok kanan bawah harus buram. Semua pola mengecat seluruh kanvas, jadi piksel transparan berarti canvas gagal tanpa pesan error.
5. Canvas dijadikan PNG lewat `toBlob`.
6. Canvas dilepas dengan `width = height = 0`, karena Safari lambat membebaskan memori canvas. URL unduhan dicabut dengan jeda, karena Safari bisa membatalkan unduhan bila URL dicabut terlalu cepat.

### Batas per browser

Angka berikut perkiraan dari data publik dan tidak diandalkan, karena batas diuji langsung (probe).

| Browser | Batas luas canvas |
| --- | --- |
| Chrome dan Edge (desktop, Android) | Sekitar 268 MP (16.384²) |
| Firefox | Minimal sekitar 125 MP |
| Safari macOS | Sekitar 268 MP |
| Safari iOS dan iPadOS | **16.777.216 px (4096²)**, ditambah batas memori canvas total per halaman |

Ukuran terbesar yang bisa diminta adalah 7680 × 7680 = 59 MP (DEV-04). Semua 28 preset ≤ 14,75 MP (desk-5k), di bawah batas iOS. Batas hanya bisa terlampaui di ukuran Custom besar.

### Cara deteksi

- Luas ≤ 16.777.216 dianggap aman, karena itu batas terkecil di antara browser yang didukung.
- Luas di atasnya memicu probe sekali per ukuran, lalu hasilnya disimpan di memori. Probe membuat canvas w×h, mengisi 1 piksel di pojok kanan bawah, lalu membacanya kembali. Bila gagal, ukuran itu melebihi batas. Pustaka canvas-size memakai teknik yang sama; di sini tanpa dependensi baru.
- Saat ekspor tetap ada verifikasi (cek piksel, `toBlob` bernilai null), karena memori bisa habis meski luasnya di bawah batas. Kegagalan ini masuk jalur gagal EXP-07.

### Ukuran lebih kecil atau SVG

- Ukuran terbesar dengan rasio sama yang muat 16.777.216 px. Contoh: 7680×7680 menjadi 4096×4096, dan 7680×4320 menjadi 5461×3072.
- PNG kecil memakai string SVG yang sama. Hanya `width` dan `height` di akar yang diganti, `viewBox` tetap, ditambah `preserveAspectRatio="none"` supaya selisih rasio di bawah 1 px tidak meninggalkan tepi transparan.
- Browser merender vektornya langsung di ukuran baru, jadi hasilnya tetap tajam, bukan bitmap yang diperkecil. Desainnya identik.
- Pilihan SVG memakai jalur EXP-02 biasa.

---

## 3. EXP-07: ekspor tanpa membekukan UI

### Pengukuran awal

Uji coba di Chromium headless dalam container, render perangkat lunak, median 3 kali setelah pemanasan. Skripnya di luar repo. Jeda frame 17 ms berarti tidak ada frame yang hilang.

| Kasus | Thread utama: jeda frame terlama | Worker: jeda frame terlama | Worker: total waktu | Ukuran PNG |
| --- | --- | --- | --- | --- |
| arcs desk-5k | 217 ms | 17 ms | 139 ms | 431 KB |
| waves desk-5k (12 lapis, amplitude 1, frequency 6) | 50 ms | 17 ms | 157 ms | 505 KB |
| gradient desk-5k | 50 ms | 17 ms | 545 ms | **12,9 MB** |
| waves 7680×7680 | 317 ms | 17 ms | 488 ms | 1,5 MB |
| ios-63, keempat pola | ≤ 33 ms | ≤ 17 ms | 37–150 ms | 115 KB–2,8 MB |

- Di jalur worker, long task-nya 0 di semua kasus.
- Dekode Blob SVG langsung di worker gagal dengan `InvalidStateError: The source image could not be decoded`. Jadi rasterisasi SVG harus dimulai di thread utama.
- Ukuran PNG gradient besar karena dithering Chromium (lihat bagian 6).

### Rancangan

1. Modul menunggu dua frame supaya indikator sempat tergambar.
2. Gambar SVG dimuat, lalu `createImageBitmap(img)` dijalankan di thread utama. Di Chromium langkah ini tidak memblokir.
3. Bitmap dipindah ke worker tanpa disalin (transfer).
4. Di worker, bitmap digambar ke `OffscreenCanvas`, piksel diperiksa, lalu `convertToBlob({ type: 'image/png' })`.
5. Jalur cadangan di thread utama (`drawImage` dan `toBlob`) dipakai bila Worker atau OffscreenCanvas tidak tersedia, atau `createImageBitmap` menolak SVG.
6. Worker berupa file terpisah dari Vite dan dimuat saat ekspor PNG pertama. Worker dari origin sendiri lolos CSP `'self'`.

Di jalur cadangan, indikator berbasis animasi CSS `transform` tetap berputar karena dijalankan compositor, meski thread utama sibuk. Ini dikerjakan bersama UI di Fase 1b.

### Batasan per browser

| Browser | OffscreenCanvas 2D di worker | Dekode SVG di worker | `createImageBitmap` dari gambar SVG di thread utama |
| --- | --- | --- | --- |
| Chrome dan Edge | Ya | Tidak (terbukti) | Ya, tidak memblokir (terukur) |
| Firefox | Ya (105+) | Tidak | Belum diketahui, perlu dites; bila menolak, jalur cadangan dipakai |
| Safari macOS dan iOS | Ya (16.4+) | Tidak | Belum diketahui, perlu dites; batas 16,7 MP juga berlaku di OffscreenCanvas |

### Pertentangan dengan PRD

EXP-01 menulis `toBlob`, sedangkan jalur worker memakai `convertToBlob`. Encoder PNG-nya sama; hanya nama API-nya berbeda di OffscreenCanvas. Perlu konfirmasi FaL (keputusan 9).

---

## 4. EXP-03: format Rapi dan Ringkas

- **Ringkas** adalah string `render()` apa adanya. Engine tidak menulis spasi antartag, jadi hasilnya sama byte-per-byte dengan snapshot ENG-08.
- **Rapi** adalah satu elemen per baris, indentasi 2 spasi per tingkat, semua atribut tetap di satu baris (termasuk `d` yang panjang), tanpa deklarasi XML:

  ```
  <svg xmlns="http://www.w3.org/2000/svg" width="1206" height="2622" viewBox="0 0 1206 2622">
    <defs>
      <linearGradient id="g…" …>
        <stop offset="0%" stop-color="#f4efe6"/>
  ```

- Pemecahan dilakukan per tag dengan pola `<[^>]+>`. Aman karena `escapeAttr` sudah meng-escape `<` dan `>` di nilai atribut, dan engine tidak menulis teks atau komentar. Bila ada teks di antara tag, fungsinya melempar error, bukan menebak.

---

## 5. EXP-05: nama file

Format `falette-{pola}-{mode}-{lebar}x{tinggi}-{seed}.{ext}`:

- `{pola}` adalah ID pola. `{mode}` selalu `light` atau `dark`, sesuai wireframe.
- Ukuran berupa bilangan bulat ukuran file.
- Contoh wireframe `falette-arcs-light-1206x2622-42.png` dijadikan tes.

Seed dari URL bisa berisi apa saja, misalnya `s=../a:b`. Aturan usulan, hanya untuk nama file; seed aslinya tidak berubah:

1. Normalisasi NFC.
2. Setiap deretan karakter di luar huruf, tanda diakritik, angka, `_`, dan `-` (Unicode `\p{L}\p{M}\p{N}`) diganti satu `-`.
3. `-` berulang digabung, dan `-` di kedua ujung dibuang.
4. Panjang dibatasi 64 karakter, tanpa memotong pasangan surrogate.
5. Bila hasilnya kosong, misalnya seed berisi emoji saja, dipakai `hashSeed(seed)` dalam basis 36 supaya tetap deterministik.
6. Huruf besar dan kecil dipertahankan, karena `Abc` dan `abc` menghasilkan gambar berbeda.

| Seed | Bagian nama file |
| --- | --- |
| `42` | `42` |
| `senja-teduh-42` | `senja-teduh-42` |
| `a/b:c` | `a-b-c` |
| `../../x` | `x` |
| `🌅🌅` | hash basis 36 |

---

## 6. Banding gradien

Lanjutan dari [catatan laporan gradient](../gradient/laporan-gradient.md#catatan).

### Yang bisa kutes otomatis di sini

- Hanya Chromium. Firefox dan WebKit tidak bisa dipasang di container karena CDN Playwright diblokir jaringan (sudah kucek).
- Tes mengekspor gradient lewat jalur EXP-01 yang sebenarnya: desk-5k dan ios-63, `spread` 0,5 dan 1, Terang dan Gelap, dengan palet Lampiran B dan satu palet gelap berchroma rendah.
- PNG hasilnya didekode lagi, lalu diukur di dalam zona gradien: deretan piksel identik terpanjang dan lompatan terbesar antarpiksel bertetangga.

### Yang harus FaL coba sendiri

- Firefox dan WebKit lewat Playwright di komputer FaL, dengan tes yang sama.
- Safari macOS, Safari iOS, dan Chrome Android asli, lewat halaman uji (`npm run harness`) yang dibuka dari ponsel di Wi-Fi yang sama. Halaman itu menampilkan tabel angka dan link unduh PNG untuk dilihat langsung di layar.
- Playwright WebKit bukan Safari, dan batas iOS tidak bisa ditiru di container.

### Koreksi untuk catatan laporan gradient

Menambah noise ±0,5 tingkat ke `ImageData` setelah SVG digambar tidak berpengaruh. Nilainya sudah bilangan bulat 8 bit, jadi v + u dengan |u| < 0,5 dibulatkan kembali ke v. Dithering sejati butuh nilai warna sebelum dibulatkan.

### Pilihan dithering (belum ada di PRD)

| Pilihan | Cara | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| D0 | Tanpa dithering. Mitigasi tetap seperti PRD: hindari gradien lebar berselisih kecil; grain menyusul lewat ENG-09 | Tanpa kode baru, PNG tetap kecil | Bila Safari atau Firefox tidak memberi dithering, pita tetap terlihat |
| D2 | Grain ±1 tingkat yang deterministik (pola posisi piksel), ditambahkan di worker hanya ke PNG | Sekitar 30 baris, berlaku untuk semua pola | Menyamarkan pita, bukan menghaluskan; menambah noise di area polos; PNG jauh lebih besar |
| D1 | Dithering sejati khusus `gradient`: warna kontinu per piksel dihitung dari `layout()`. Model interpolasinya sudah ada di prototipe laporan gradient (selisih ≤ ΔE 0,0042 dari Chromium) | Kualitas terbaik | Jalur render kedua di luar SVG → canvas, bertentangan dengan EXP-01 dan prinsip 3, dan harus dibuat ulang untuk setiap pola bergradien |

Pilihan apa pun selain D0 adalah perilaku baru dan perlu catatan di PRD. Hasil engine dan snapshot tidak berubah.

---

## 7. Tes dan pengukuran

### Tes unit (Vitest)

| File | Isi |
| --- | --- |
| `tests/export/filename.test.ts` | 4 pola × 2 varian × png dan svg; contoh wireframe; kasus seed di bagian 5; batas panjang; NFC; cadangan hash; ukuran tidak valid ditolak |
| `tests/export/svg-code.test.ts` | Di 266 SVG snapshot: Ringkas sama dengan `render()`; `compact(pretty(x)) === x`; satu elemen per baris; indentasi sesuai kedalaman; teks antartag ditolak |
| `tests/export/png-size.test.ts` | Ukuran kecil: luas ≤ batas dan rasio meleset < 1 px di grid 320–7680; contoh 7680² dan 7680×4320; ambang probe; penggantian akar SVG hanya mengubah `width` dan `height` |
| `tests/export/svg-file.test.ts` | EXP-02 di semua snapshot: tanpa `<image>`, `<text>`, font, `href`, atau `url(` selain `#`; `width`, `height`, dan `viewBox` sesuai ukuran; maksimal 2 desimal; tipe Blob `image/svg+xml` |

### Tes Playwright (lewat halaman uji)

| File | Isi |
| --- | --- |
| `tests/export/png.e2e.ts` | **EXP-01:** 28 preset dan 4 ukuran Custom ekstrem; lebar dan tinggi dibaca dari header PNG; PNG buram dan tidak satu warna; keempat pola bergiliran. **EXP-04:** Terang dan Gelap. **EXP-05:** nama dari event unduhan sungguhan. **EXP-06:** probe sungguhan (7680² muat, 20000² ditolak Chromium) dan batas iOS yang disimulasikan, sehingga terekspor 4096². **EXP-07:** jalur worker dipakai, jalur cadangan menghasilkan dimensi sama, dan kegagalan yang disuntikkan menghasilkan error yang tepat |
| `tests/export/timing.e2e.ts` | Waktu per tahap (muat, raster, encode, total), jeda frame terlama dari `requestAnimationFrame` (jalan di semua browser), dan long task (khusus Chromium). 6 preset × 4 pola, waves dengan parameter maksimum, dan 7680², di kedua jalur, median dari 5 kali. Hasilnya dilampirkan sebagai JSON dan masuk tabel laporan |
| `tests/export/banding.e2e.ts` | Pengukuran di bagian 6, dilampirkan per browser |

### Halaman uji dan konfigurasi

- Halaman uji punya CSP yang sama dengan situs dan dilayani di port 4174 sebagai webServer kedua.
- Project Firefox dan WebKit hanya jalan bila `PW_BROWSERS=all`, supaya `npm test` di container tetap lulus.
- Pembagian waktu per tahap dicatat lewat 3 `performance.mark` di modul ekspor.
- Tidak ada dependensi baru.

---

## 8. Keputusan yang kubutuhkan

| No. | Hal | Pilihan | Rekomendasi |
| --- | --- | --- | --- |
| 1 | Struktur | (a) Folder `src/lib/export/` (belum ada di peta folder AGENTS.md), halaman uji `tests/harness/`, webServer kedua, project Firefox dan WebKit opsional, dan skrip `npm run harness`. (b) Tanpa halaman uji: sekarang hanya tes unit, tes browser menunggu halaman Create | a |
| 2 | Jalur PNG | (a) Worker dan OffscreenCanvas, dengan cadangan di thread utama. (b) Thread utama saja: kode lebih sedikit, tetapi UI bisa terblokir sampai sekitar 0,3 detik di Chromium | a |
| 3 | Ukuran lebih kecil | (a) Terbesar yang muat 16.777.216 px. (b) Terbesar sesuai probe browser itu, butuh beberapa alokasi canvas besar. (c) Setengah ukuran | a |
| 4 | Nama file PNG yang diperkecil | (a) Ukuran sebenarnya. (b) Ukuran asli | a |
| 5 | File SVG unduhan | (a) Selalu Ringkas (sama dengan `render()`), dengan indentasi Rapi 2 spasi. (b) Mengikuti pilihan Rapi atau Ringkas | a |
| 6 | Seed di nama file | (a) Aturan di bagian 5. (b) Hanya ASCII `[A-Za-z0-9_-]` | a |
| 7 | Dithering | (a) D0 untuk sekarang; diputuskan lagi setelah angka Safari dan Firefox ada. (b) D2. (c) D1 | a |
| 8 | Ambang waktu | (a) Angka hanya dicatat; tes cukup memastikan jalur worker dipakai di Chromium, supaya tidak rapuh. (b) Ada ambang, misalnya jeda frame ≤ 100 ms di Chromium | a |
| 9 | `toBlob` dan `convertToBlob` | Konfirmasi bahwa `convertToBlob` di worker memenuhi EXP-01 (bagian 3) | Ya |

Satu hal lagi untuk Fase 1b: teks pesan gagal EXP-07 belum ada di PRD maupun wireframe. Wireframe hanya memuat keadaan "PNG terlalu besar". Teksnya perlu dari FaL sebelum panel dibuat.

---

## 9. Setelah disetujui

Dikerjakan di branch `claude/keen-cray-kn0wah`, dengan draft PR dari main. Urutan commit:

| No. | Commit |
| --- | --- |
| 1 | `feat(export): file names (EXP-05)` |
| 2 | `feat(export): SVG file and code formats (EXP-02, EXP-03)` |
| 3 | `feat(export): PNG export with size check and worker (EXP-01, EXP-04, EXP-06, EXP-07)` |
| 4 | Halaman uji dan tes browser |
| 5 | Laporan di `docs/laporan/ekspor/` |

Engine, snapshot, PRD, dan katalog tidak disentuh.

Di container, Playwright 1.64 meminta Chromium revisi 1248, sedangkan yang terpasang revisi 1243. Seperti sesi-sesi sebelumnya, browser bawaan disambungkan lewat path sementara di luar repo.

### Belum bisa diuji di container

- Firefox, WebKit, dan Safari asli
- Batas canvas dan memori di iOS
- Waktu ekspor di perangkat nyata dengan GPU
- Penilaian visual pita warna
- File unduhan yang masuk ke Files di iPhone

Empat hal pertama bisa dicek FaL lewat halaman uji dan Playwright di komputer sendiri.
