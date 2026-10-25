# Laporan: ekspor PNG, SVG, dan kode SVG (EXP-01 sampai EXP-07)

Branch `claude/keen-cray-kn0wah`, dari main `7cb13e9`. FaL menyetujui [rencana](1-rencana-ekspor.md) dengan semua rekomendasi: 1a, 2a, 3a, 4a, 5a, 6a, 7a, 8a, dan 9 ya. Tiga tambahan dari FaL saat menyetujui:

1. Peta folder di AGENTS.md diperbarui dengan `src/lib/export/` dan `tests/harness/`.
2. Teks EXP-01 di PRD menjadi "(SVG → canvas → `toBlob`, atau `convertToBlob` di worker)".
3. Laporan ini memuat panduan langkah demi langkah untuk menguji di perangkat FaL sendiri ([Panduan](#panduan-menguji-di-perangkatmu)).

UI panel Ekspor belum dibuat; itu bagian Fase 1b. Sesi ini membuat modul, tes, dan halaman uji.

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| `53f3368` | `docs/laporan/ekspor/1-rencana-ekspor.md` | Rencana yang disetujui | |
| `a0cb89a` | `src/lib/export/filename.ts`, `tests/export/filename.test.ts` | `exportFileName()` dan `fileSafeSeed()`. 12 tes. | EXP-05 |
| `c3f2ad7` | `src/lib/export/svg-file.ts`, `src/lib/export/svg-code.ts`, 2 file tes, `tests/fixtures/presets.ts` | Blob SVG (sama persis dengan `render()`), `formatSvg()` Rapi/Ringkas, dan fixture `landscapePresets` serta `allPresets` (28 preset) selama `presets.json` belum ada. 9 tes. | EXP-02, EXP-03 |
| `e253746` | `src/lib/export/png-size.ts`, `canvas.ts`, `png.ts`, `png.worker.ts`, `download.ts`, `tests/export/png-size.test.ts` | Ukuran lebih kecil, probe batas canvas, ekspor PNG lewat worker dengan cadangan di thread utama, dan unduhan. 8 tes. | EXP-01, EXP-04, EXP-06, EXP-07 |
| `906c480` | `tests/harness/`, `tests/export/*.e2e.ts`, `tests/export/harness.ts`, `playwright.config.ts`, `package.json`, `.gitignore` | Halaman uji, 48 tes Playwright, skrip `npm run harness`, dan project Firefox/WebKit dengan `PW_BROWSERS=all`. Hasil build halaman uji di `/.harness` diabaikan Git. | EXP-01–EXP-07 |
| `cdeae26` | `tests/harness/` | Hasil mode perangkat ditaruh di kotak teks supaya bisa disalin di ponsel | EXP-07 |
| `86cdc29` | `AGENTS.md`, `docs/PRD.md` | Tambahan 1 dan 2 dari FaL, tanpa perubahan lain | EXP-01 |
| Commit laporan | `docs/laporan/ekspor/` | Laporan ini dan [halaman-uji-chromium.png](halaman-uji-chromium.png) | |

Yang tidak disentuh: engine, pola, snapshot, katalog, dan halaman situs. Versi engine tetap 1. Tidak ada dependensi baru.

---

## Cara kerja

### Modul

| File | Isi |
| --- | --- |
| `filename.ts` | `exportFileName({ pattern, variant, width, height, seed, format })` menghasilkan `falette-{pola}-{mode}-{lebar}x{tinggi}-{seed}.{ext}`. Ukuran yang ditulis adalah ukuran file itu sendiri (4a). |
| `svg-code.ts` | `formatSvg(svg, 'pretty' \| 'compact')`. Ringkas adalah string `render()` itu sendiri. Rapi adalah satu elemen per baris dengan indentasi 2 spasi (5a). |
| `svg-file.ts` | `svgFile(svg)`: file SVG unduhan, selalu Ringkas (5a). |
| `png-size.ts` | `SAFE_PNG_AREA` (16.777.216 px), `smallerPngSize(size, maxArea?)` (3a), dan `rasterSource(svg, size)` untuk PNG yang diperkecil. |
| `png.ts` | `checkPngSize(size)` dan `svgToPng(svg, size)`, yang gagal dengan `PngExportError`. Juga 3 `performance.mark` untuk pengukuran waktu (`PNG_MARKS`). |
| `png.worker.ts` | Worker yang menggambar ImageBitmap ke `OffscreenCanvas` lalu `convertToBlob` (2a, 9). |
| `canvas.ts` | `cornerOpaque()`, dipakai bersama oleh worker dan thread utama. |
| `download.ts` | `downloadFile(blob, name)` lewat link sementara. URL dicabut setelah 60 detik, karena Safari bisa membatalkan unduhan bila URL dicabut terlalu cepat. |

Pemakaian di Fase 1b nanti:

```ts
const name = exportFileName({ pattern, variant, ...size, seed, format });
if (format === 'svg') {
	downloadFile(svgFile(svg), name);
} else {
	const check = checkPngSize(size); // { ok: false, smaller } → kotak "PNG terlalu besar"
	downloadFile(await svgToPng(svg, size), name); // PngExportError → pesan gagal EXP-07
}
```

### Alur PNG (EXP-01, EXP-07)

1. Menunggu satu kali cat (paint), supaya indikator proses sempat tergambar. Ada batas waktu 100 ms, karena `requestAnimationFrame` tidak berjalan di tab tersembunyi.
2. String SVG yang sama dengan preview dimuat ke `Image` lewat URL `blob:`.
3. Jalur worker: `createImageBitmap(img)` di thread utama, lalu bitmap dipindah ke worker. Di worker, bitmap digambar ke `OffscreenCanvas`, piksel pojok diperiksa, lalu dijadikan PNG dengan `convertToBlob`.
4. Jalur cadangan dipakai bila Worker atau OffscreenCanvas tidak ada, `createImageBitmap` menolak SVG, ukuran bitmap tidak cocok, atau worker gagal dimuat. Di jalur ini, `drawImage` ke canvas biasa, cek piksel, lalu `toBlob`.
5. Kegagalan sungguhan, misalnya canvas kosong, `toBlob` null, atau error di worker, menghasilkan `PngExportError`. Kegagalan seperti ini tidak dicoba ulang di jalur lain, supaya memori tidak terpakai dua kali.

### Batas ukuran (EXP-06)

- Luas ≤ 16.777.216 px dianggap aman tanpa probe. Semua 28 preset termasuk di sini.
- Di atasnya, `checkPngSize` membuat canvas seukuran itu di thread utama, mengisi piksel pojok, lalu membacanya kembali. Hasilnya disimpan per ukuran.
- Bila tidak muat, `smaller` adalah ukuran terbesar dengan rasio sama yang muat 16.777.216 px. Contoh: 7680×7680 menjadi 4096×4096, dan 7680×4320 menjadi 5461×3072.
- PNG yang diperkecil memakai SVG yang sama. Hanya `width` dan `height` di akar yang diganti, ditambah `preserveAspectRatio="none"`, jadi desainnya identik dan tetap tajam.

### Nama file (EXP-05)

Aturan seed sesuai 6a. Contoh dari tes:

| Seed | Bagian nama file |
| --- | --- |
| `42` | `42` |
| `senja-teduh-42` | `senja-teduh-42` |
| `a/b:c` | `a-b-c` |
| `../../x` | `x` |
| `n` + U+0303 + `andu` + U+0301 | `ñandú` (NFC) |
| `🌅🌅` | hash basis 36 |

---

## Pengukuran

Semua angka dari Chromium headless di container, dengan render perangkat lunak dan tanpa GPU. Perangkat nyata akan berbeda.

### Waktu ekspor (EXP-07)

Tes `tests/export/timing.e2e.ts` dijalankan dengan `--workers=1`. Angkanya median dari 5 kali, jeda frame dan long task diambil yang terbesar. Total sudah termasuk menunggu satu kali cat (sekitar 17 ms). Jeda 17 ms berarti tidak ada frame yang hilang di 60 Hz.

| Pola | Ukuran | Worker: total ms | Worker: jeda frame ms | Thread utama: total ms | Thread utama: jeda frame ms | Thread utama: long task ms | PNG KB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| arcs | and-fhd20 | 46 | 17 | 44 | 17 | 0 | 135 |
| arcs | ios-63 | 62 | 17 | 45 | 17 | 0 | 156 |
| arcs | ipad-pro-13 | 72 | 17 | 55 | 17 | 0 | 259 |
| arcs | mba-13 | 54 | 17 | 42 | 17 | 0 | 156 |
| arcs | desk-uw | 53 | 17 | 42 | 17 | 0 | 188 |
| arcs | desk-5k | 140 | 17 | 88 | 17 | 0 | 431 |
| hills | and-fhd20 | 47 | 17 | 43 | 17 | 0 | 99 |
| hills | ios-63 | 47 | 17 | 42 | 17 | 0 | 115 |
| hills | ipad-pro-13 | 67 | 17 | 54 | 17 | 0 | 193 |
| hills | mba-13 | 55 | 17 | 43 | 17 | 0 | 181 |
| hills | desk-uw | 60 | 17 | 45 | 17 | 0 | 222 |
| hills | desk-5k | 141 | 17 | 113 | 17 | 0 | 476 |
| waves | and-fhd20 | 44 | 17 | 46 | 17 | 0 | 91 |
| waves | ios-63 | 50 | 17 | 44 | 17 | 0 | 108 |
| waves | ipad-pro-13 | 66 | 17 | 41 | 17 | 0 | 180 |
| waves | mba-13 | 54 | 17 | 41 | 17 | 0 | 145 |
| waves | desk-uw | 57 | 17 | 40 | 17 | 0 | 154 |
| waves | desk-5k | 134 | 17 | 108 | 33 | 52 | 385 |
| waves | desk-5k, parameter maksimum | 145 | 17 | 107 | 33 | 58 | 505 |
| waves | Custom 7680 × 7680 | 478 | 17 | 359 | 183 | 199 | 1.353 |
| gradient | and-fhd20 | 108 | 17 | 109 | 17 | 0 | 2.299 |
| gradient | ios-63 | 132 | 17 | 128 | 17 | 0 | 2.845 |
| gradient | ipad-pro-13 | 213 | 17 | 214 | 17 | 0 | 5.229 |
| gradient | mba-13 | 155 | 17 | 170 | 17 | 0 | 3.887 |
| gradient | desk-uw | 180 | 17 | 187 | 17 | 0 | 4.394 |
| gradient | desk-5k | 498 | 17 | 545 | 67 | 91 | 12.951 |

- **Jalur worker:** jeda frame 17 ms dan long task 0 di semua 26 kasus.
- **Jalur cadangan:** frame mulai hilang di desk-5k (sampai 67 ms) dan di 7680² (183 ms).
- **Total waktu worker** sama atau sedikit lebih lama untuk pola datar, paling banyak +52 ms (arcs desk-5k), karena ada pemindahan ke worker. Harga ini kecil dibanding UI yang tetap jalan.
- **Probe 7680²** memblokir thread utama sekitar 125 ms (diukur 123 dan 131 ms). Ini terjadi sekali per ukuran di atas 16,7 MP, yaitu saat ukuran Custom sebesar itu dipilih. Ekspor tepat sesudah probe bisa melambat (encode 1.005 ms, bukan 314 ms), tetapi jeda frame tetap 17 ms.
- **Mode perangkat di halaman uji:** kasus 7680² menunjukkan jeda 100–217 ms di setiap jalan (4 kali), tanpa long task di thread utama. Di tes waktu yang terpisah, jedanya 17 ms. Dugaanku ini dari alokasi memori 236 MB di browser, bukan dari kode kita.
- **Angka uji coba di rencana** (misalnya arcs desk-5k di thread utama 217 ms) tidak muncul lagi di pengukuran ini. Angka Chromium headless di container memang bervariasi antarjalan.

### Banding gradien

Diukur oleh `tests/export/banding.e2e.ts` pada PNG yang sudah jadi:

- Gradien linear sudut 90, Latar di kiri dan warna 5 di kanan.
- Diukur 5 baris dan 64 kolom contoh.
- Palet "Chroma rendah" = `5d6b78`, `465360`, `2f3a45`, Latar Otomatis.

| Kolom | Arti |
| --- | --- |
| Kolom berdither | Bagian dari 64 kolom yang berisi lebih dari satu warna. Di sudut 90, gradien tanpa dithering punya satu warna per kolom, jadi **0% berarti browser tidak memberi dithering.** |
| Deretan terpanjang | Piksel identik berturut-turut terpanjang di zona gradien. |
| Perkiraan tanpa dither | Deretan terpanjang yang akan digambar browser tanpa dithering: baris tengah dihaluskan 65 px lalu dibulatkan ke 8 bit. Bila "Deretan terpanjang" mendekati angka ini dan kolom berdither 0%, pitanya selebar angka ini. |
| Lompatan | Selisih terbesar antarpiksel bertetangga, dalam tingkat 8 bit |

Hasil di Chromium:

| Preset | `spread` | Palet | Varian | Kolom berdither | Deretan terpanjang px | Perkiraan tanpa dither px | Lompatan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| desk-5k | 0,5 | Lampiran B | Terang | 98% | 12 | 19 | 2 |
| desk-5k | 0,5 | Lampiran B | Gelap | 97% | 12 | 27 | 2 |
| desk-5k | 0,5 | Chroma rendah | Terang | 66% | 54 | 72 | 2 |
| desk-5k | 0,5 | Chroma rendah | Gelap | 84% | 40 | 59 | 1 |
| desk-5k | 1 | Lampiran B | Terang | 94% | 20 | 25 | 2 |
| desk-5k | 1 | Lampiran B | Gelap | 95% | 20 | 26 | 2 |
| desk-5k | 1 | Chroma rendah | Terang | 70% | 82 | 112 | 2 |
| desk-5k | 1 | Chroma rendah | Gelap | 77% | 64 | 86 | 1 |
| ios-63 | 0,5 | Lampiran B | Terang | 100% | 4 | 6 | 2 |
| ios-63 | 0,5 | Lampiran B | Gelap | 92% | 4 | 6 | 2 |
| ios-63 | 0,5 | Chroma rendah | Terang | 72% | 14 | 32 | 2 |
| ios-63 | 0,5 | Chroma rendah | Gelap | 80% | 12 | 19 | 2 |
| ios-63 | 1 | Lampiran B | Terang | 98% | 6 | 9 | 2 |
| ios-63 | 1 | Lampiran B | Gelap | 97% | 6 | 10 | 2 |
| ios-63 | 1 | Chroma rendah | Terang | 66% | 22 | 29 | 2 |
| ios-63 | 1 | Chroma rendah | Gelap | 78% | 16 | 30 | 2 |

- **Chromium memberi dithering di jalur EXP-01**, sama seperti temuan laporan gradient. Kolom yang tidak berdither kemungkinan ada di bagian yang nilainya kebetulan pas di satu tingkat 8 bit.
- **Kasus terberat untuk browser tanpa dithering** adalah palet berchroma rendah di desk-5k dengan `spread` 1: pitanya bisa selebar sekitar 86–112 px.
- **Pita di laporan gradient** tertulis 45–49 px. Angka itu dari teori pada parameter awal (sudut 135). Angka di sini (25–26 px untuk Lampiran B) diukur dari PNG pada sudut 90 dan menghitung perubahan di kanal mana pun, jadi keduanya tidak bisa dibandingkan langsung.
- **Dithering membuat PNG besar:** gradient desk-5k 12.951 KB (sudut 135) sampai 15.925 KB (sudut 90, `spread` 1).
- **Keputusan 7a tetap berlaku:** dithering belum ditambahkan. Pilihannya diputuskan lagi setelah angka Safari dan Firefox masuk.

---

## Tes

### Tes unit (29 baru)

| File | Tes | Isi |
| --- | --- | --- |
| `filename.test.ts` | 12 | Contoh wireframe; 4 pola × 2 varian × png/svg; ukuran file yang diperkecil; ukuran tidak valid ditolak; seed angka, kata, huruf besar, karakter tidak aman, titik dan garis miring di depan, aksara lain, NFC, batas 64 tanpa memotong surrogate, cadangan hash, dan hasil selalu di dalam himpunan aman |
| `svg-code.test.ts` | 7 | Di 266 snapshot: Ringkas sama dengan `render()`; Rapi kembali tepat ke `render()`; Rapi idempoten; satu tag per baris dengan indentasi sesuai kedalaman; contoh gradien bersarang; atribut ter-escape utuh; teks antartag ditolak |
| `png-size.test.ts` | 8 | Batas 16.777.216; 28 preset tidak diperkecil; 7680², 7680×4320, dan 4320×7680; grid 81 ukuran: luas ≤ batas dan tiap sisi < 1 px dari skala tepat; `maxArea` lain; `rasterSource` tidak mengubah SVG di ukurannya sendiri, hanya mengganti akar, dan menolak string bukan SVG engine |
| `svg-file.test.ts` | 2 | Isi Blob sama dengan `render()` dan bertipe `image/svg+xml`; 4 pola × 32 ukuran × 2 varian: akar `width`/`height`/`viewBox` tepat, tanpa gambar, teks, font, skrip, `style`, `use`, `href`, `url(` ke luar, dan maksimal 2 desimal |

### Tes Playwright (48 baru), lewat halaman uji

| File | Tes | Isi |
| --- | --- | --- |
| `png.e2e.ts` | 43 | **EXP-01:** 28 preset dan 4 Custom (320², 7680×320, 320×7680, 7680²). Lebar dan tinggi dibaca dari header PNG, thumbnail 32×32 buram seluruhnya dan lebih dari satu warna, pola bergiliran. **EXP-04:** Terang dan Gelap untuk 4 pola, ukuran sama, isi berbeda. **EXP-05:** nama dari event unduhan sungguhan untuk PNG, SVG dengan seed `a/b:c`, dan PNG 4096² yang diperkecil, termasuk isi file. **EXP-06:** probe sungguhan (desk-5k dan 7680² muat, 32000² ditolak dengan tawaran 4096²) dan batas iOS yang disimulasikan, dengan ekspor 4096² dan 5461×3072 buram. **EXP-07:** jalur worker di Chromium; cat sebelum kerja berat; cadangan tanpa Worker; cadangan bila `createImageBitmap` menolak SVG; `PngExportError` untuk `toBlob` null, canvas kosong, dan 32000² |
| `timing.e2e.ts` | 4 | Satu per pola; menulis `timing-<pola>.json` dan melampirkannya di laporan HTML |
| `banding.e2e.ts` | 1 | Menulis `banding.json` dan melampirkannya |

Tes "cat sebelum kerja berat" sudah kuperiksa dengan mutasi: tanpa `afterPaint()` tesnya gagal, dan setelah kode dikembalikan tesnya lulus lagi.

---

## Uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | 0 error, 0 peringatan (390 file) |
| `npm run lint` | Bersih |
| `npm test` | 564 tes unit (29 baru) dan 49 tes Playwright (48 baru) lulus |
| `npm run build` | Berhasil. JS awal Home dan Create masing-masing 32,0 KB gzip, tidak berubah, karena belum ada halaman yang mengimpor modul ekspor |
| Uji bundel worker di situs | Dengan impor sementara di Create, SvelteKit menulis `_app/immutable/workers/png.worker-….js` (0,56 kB), satu origin dengan situs sehingga lolos CSP `'self'`. Impor itu sudah dikembalikan. |
| `npm run harness` dan mode perangkat di Chromium | Semua 7 kasus berjalan tanpa error ([halaman-uji-chromium.png](halaman-uji-chromium.png)) |

Di container, Playwright 1.64 meminta Chromium revisi 1248, sedangkan yang terpasang revisi 1243. Tes dijalankan dengan `PLAYWRIGHT_BROWSERS_PATH` yang menunjuk ke folder sementara di luar repo, berisi tautan ke Chromium yang terpasang. Firefox dan WebKit tidak bisa dipasang karena CDN Playwright diblokir. Repo tidak diubah untuk ini.

---

## Penyimpangan dari rencana

1. **Probe berjalan di thread utama**, bukan di worker seperti sempat kutulis di chat. Rencana di file tidak menyebut tempatnya. Kodenya lebih sederhana, satu jalur saja, dan hanya berjalan untuk ukuran di atas 16,7 MP. Biayanya sekitar 125 ms sekali per ukuran (bagian Pengukuran).
2. **`PngExportError` tanpa kolom alasan.** Rancangan API di rencana menyebut `'too-large'` atau `'failed'`. Keadaan "terlalu besar" sudah datang dari `checkPngSize` sebelum ekspor, dan pesan gagal EXP-07 menawarkan saran yang sama, jadi satu jenis error cukup.
3. **File tambahan `canvas.ts`** berisi `cornerOpaque()` dan `PNG_TYPE`, dipakai worker dan thread utama. Worker tidak bisa diimpor dari thread utama tanpa ikut menjalankan pendengarnya.
4. **Ukuran banding berbeda dari rencana.** Deretan terpanjang saja menyesatkan, karena bagian gradien yang hampir datar juga menghasilkan deretan panjang meski browser memberi dithering. Jadi kutambahkan "kolom berdither" dan "perkiraan tanpa dither".
5. **Mode perangkat menunggu 1 detik antarkasus.** Tanpa jeda ini, sisa kerja kasus sebelumnya membuat jeda frame 150 ms di jalur worker yang aslinya 17 ms.
6. **Tes 32000²** dipakai untuk "melewati batas semua browser", menggantikan 20000² di rencana. 20000² (400 MP) bisa muat di Firefox, yang batasnya mungkin di atas 400 MP.

## Titik lemah

1. **Jalur cadangan masih bisa membekukan UI** sampai sekitar 200 ms di 7680² dan sekitar 90 ms di gradient desk-5k (Chromium). Jalur ini hanya dipakai bila jalur worker tidak tersedia, tetapi Firefox dan Safari belum diketahui jalurnya.
2. **Probe 7680² memblokir sekitar 125 ms.** Di Fase 1b, panggil `checkPngSize` setelah pengguna selesai mengetik ukuran Custom, bukan di setiap ketukan.
3. **PNG gradient besar** (sampai 15.925 KB di desk-5k) karena dithering Chromium.
4. **Ukuran untuk "Unduh lebih kecil" setelah gagal belum diatur.** Bila ekspor gagal di ukuran ≤ 16,7 MP (misalnya memori ponsel habis), `smallerPngSize(size)` mengembalikan ukuran yang sama. `maxArea` bisa diturunkan, tetapi aturannya perlu diputuskan untuk Fase 1b.
5. **Teks pesan gagal EXP-07 dan teks English** untuk kotak "PNG terlalu besar" belum ada di PRD.
6. **Probe hanya menguji luas canvas di thread utama.** Batas memori total, misalnya di iPhone, baru ketahuan saat ekspor, lewat jalur gagal.

---

## Panduan menguji di perangkatmu

Ada dua cara, dan keduanya diperlukan:

| Cara | Dipakai untuk |
| --- | --- |
| **A. Halaman uji** | Safari di iPhone/iPad, Chrome di Android, dan Safari serta Firefox asli di komputer |
| **B. Playwright** | Seluruh tes otomatis di Firefox dan WebKit (versi Safari dari Playwright) |

### Persiapan (sekali saja)

1. Pastikan Node.js 22 terpasang. Buka Terminal (macOS) atau PowerShell (Windows), lalu ketik `node --version`. Hasilnya harus diawali `v22`. Bila belum ada, unduh versi LTS dari nodejs.org.
2. Masuk ke folder proyek, misalnya `cd falette`.
3. Ambil branch ini:
   ```
   git fetch origin
   git checkout claude/keen-cray-kn0wah
   git pull
   ```
4. Pasang dependensi: `npm ci`. Tunggu sampai selesai, sekitar satu menit.

### A. Halaman uji di komputer, dibuka dari ponsel

1. Sambungkan komputer dan ponsel ke **Wi-Fi yang sama**. Matikan VPN di keduanya. Wi-Fi tamu (guest) sering memblokir sambungan antarperangkat, jadi pakai Wi-Fi rumah biasa.
2. Di Terminal, di folder proyek, jalankan `npm run harness`.
3. Tunggu sampai muncul dua baris seperti ini:
   ```
   ➜  Local:   http://localhost:4174/
   ➜  Network: http://192.168.1.23:4174/
   ```
   Alamat di baris **Network** adalah alamat untuk ponsel. Angkanya akan berbeda di komputermu. Bila ada beberapa baris Network, pilih yang diawali `192.168.` atau `10.`.
4. Bila muncul pertanyaan firewall:
   - macOS: "Do you want the application node to accept incoming network connections?" → pilih **Allow**.
   - Windows: pilih **Allow access** untuk jaringan **Private**.
5. Di ponsel, buka Safari (iPhone/iPad) atau Chrome (Android), lalu ketik alamat Network ditambah `?run=device`, misalnya `http://192.168.1.23:4174/?run=device`. Pastikan diawali `http://`, bukan `https://`.
6. Halaman langsung berjalan, dan baris status menunjukkan "Running 1 of 7…". **Biarkan layar menyala dan jangan pindah aplikasi** sampai muncul "Done…". Biasanya 10–60 detik.
7. Setelah "Done":
   - Ambil tangkapan layar tabel. Bila tabel lebih lebar dari layar, geser ke samping dan ambil tangkapan kedua.
   - Ketuk kotak teks di bawah tabel, tekan lama, pilih **Pilih Semua** (Select All), lalu **Salin**. Tempel teksnya ke chat atau catatan.
8. Lihat PNG gradient dengan mata sendiri. Ketuk link **PNG** di baris `gradient ios-63 dark` dan `gradient desk-5k dark, low chroma`, lalu buka filenya. Di iPhone, file masuk ke app Files, folder Downloads. Perbesar gambar dan perhatikan apakah ada garis-garis atau pita warna.
9. Ulangi langkah 5–8 di komputer sendiri, dengan alamat `http://localhost:4174/?run=device`, di **Safari** (macOS) dan **Firefox**.
10. Selesai menguji, kembali ke Terminal dan tekan **Ctrl+C** untuk menghentikan server.

Bila halaman tidak terbuka di ponsel, cek tiga hal: Wi-Fi sama, firewall mengizinkan node, dan alamatnya memakai `http://`.

### B. Tes Firefox dan WebKit dengan Playwright

1. Pasang browser Playwright (sekali saja, unduhannya beberapa ratus MB):
   ```
   npx playwright install chromium firefox webkit
   ```
   Di Linux, pakai `npx playwright install --with-deps chromium firefox webkit`.
2. Jalankan semua tes browser di ketiga browser, satu per satu supaya angka waktunya bersih:
   - macOS atau Linux:
     ```
     PW_BROWSERS=all npx playwright test --workers=1 --reporter=html
     ```
   - Windows PowerShell:
     ```
     $env:PW_BROWSERS="all"; npx playwright test --workers=1 --reporter=html
     ```
   Tes pertama-tama membangun situs dan halaman uji, lalu menjalankan sekitar 150 tes. Perkiraanku 5–15 menit.
3. Di akhir, Terminal menampilkan ringkasan, misalnya `147 passed`, atau daftar tes yang gagal. Ambil tangkapan layar ringkasan itu.
4. Buka laporan dengan `npx playwright show-report`. Laporan terbuka di browser. Tes yang gagal ada di bagian atas; klik untuk melihat pesannya. Tekan Ctrl+C di Terminal setelah selesai melihat.
5. Kompres folder `test-results` di folder proyek menjadi file ZIP. Folder ini berisi `timing-<pola>.json` dan `banding.json` untuk setiap browser. Folder ini dikosongkan setiap kali tes dijalankan, jadi kompres sebelum menjalankan tes lagi.

Tes yang gagal di Firefox atau WebKit bukan kesalahanmu; justru itu informasi yang kucari. Contoh: bila sebuah browser bisa membuat canvas 32000 × 32000, tes probe akan gagal, dan itu memberi tahu batas browser tersebut.

### Yang perlu dilaporkan balik

| Dari | Kirim |
| --- | --- |
| iPhone atau iPad (Safari) | Nama perangkat dan versi iOS. Tangkapan layar tabel. Teks dari kotak hasil. Apakah baris `waves 7680 × 7680` menulis "too large, offers 4096 × 4096" dan PNG 4096 × 4096-nya berhasil. Apakah ada baris "failed". Apakah halaman terasa macet saat berjalan. Apakah pita terlihat di dua PNG gradient (langkah A8). Di mana file tersimpan, dan apakah ukurannya benar (Files → tekan lama file → Info). |
| Android (Chrome) | Sama seperti iPhone. Baris 7680 × 7680 boleh "fits"; bila "failed", kirim pesannya. |
| Safari dan Firefox di komputer | Nama browser dan versinya, tangkapan layar tabel, teks dari kotak hasil, dan kesan pita di PNG gradient |
| Playwright (cara B) | Tangkapan layar ringkasan di Terminal, ZIP folder `test-results`, dan bila ada tes gagal, nama tesnya beserta pesan errornya dari laporan HTML |

**Cara membaca kolom banding sendiri:**

- **Dithered columns** sekitar 70–100% berarti browser memberi dithering, seperti Chromium.
- **Dithered columns** 0% berarti tanpa dithering. Pita kira-kira selebar angka di **Undithered run px**, dan **Longest run px** akan mendekati angka itu.
- Angka-angka ini, ditambah kesan matamu, menjadi dasar keputusan dithering (D0, D1, atau D2 di rencana).

---

## Belum diuji

- Firefox, WebKit, dan Safari asli: jalur yang dipakai, batas canvas, waktu, dan banding (panduan A dan B)
- Batas canvas dan memori sungguhan di iPhone dan iPad; di sini batasnya hanya disimulasikan
- Waktu ekspor di perangkat nyata dengan GPU
- Penilaian visual pita warna di layar ponsel
- Unduhan yang masuk ke Files di iPhone
- UI panel Ekspor (Fase 1b)
