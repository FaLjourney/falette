# Laporan: link berbagi (SHR-01 sampai SHR-03, Lampiran B)

Branch `claude/intelligent-bell-hh6w0u`, dari main `918d811` (PR #10, ekspor). FaL menyetujui [rencana](1-rencana-link.md) dengan semua rekomendasi (1a sampai 13a) dan aturan turunan di bagian 4. Satu tambahan dari FaL: laporan ini mengumpulkan semua hal yang belum diatur PRD dari sesi ekspor dan sesi ini dalam satu daftar ([Hal yang belum diatur PRD](#hal-yang-belum-diatur-prd)).

UI Salin link dan pemberitahuan belum dibuat; itu bagian Fase 1b. Sesi ini membuat modul, data preset, dan tes. Dengan ini, Fase 1a selesai.

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| `30c5f06` | `docs/laporan/link/1-rencana-link.md` | Rencana | |
| `4c39c0d` | `src/lib/presets/presets.json`, `tests/fixtures/presets.ts`, `tests/presets.test.ts` | 28 preset dengan `id`, `category`, `width`, dan `height` (13a). Fixture membaca JSON ini, tidak lagi menyalin ukurannya sendiri. 4 tes. | DEV-02 |
| `fb46f0c` | `docs/laporan/link/1-rencana-link.md` | Catatan persetujuan FaL | |
| `fe0bad4` | `src/lib/share/link.ts`, `tests/share/`, `tests/fixtures/design-config.ts` | `writeLink()`, `readLink()`, `shareUrl()`, dan `normalizeParams()`. 51 tes. | SHR-01, SHR-02, SHR-03 |
| `000b058` | `AGENTS.md` | Baris `share/` di peta folder (12a), tanpa perubahan lain | |
| Commit laporan | `docs/laporan/link/2-laporan-link.md` | Laporan ini | |

Yang tidak disentuh: engine, pola, snapshot, PRD, katalog, dan halaman situs. Versi engine tetap 1. Tidak ada dependensi baru.

---

## Cara kerja

### API

| Fungsi | Isi |
| --- | --- |
| `writeLink(design, pattern)` | Isi hash tanpa `#`, dengan urutan tetap `v`, `p`, `s`, `pal`, `bg`, `m`, lalu `d` atau `w` dan `h`, lalu `x`. Semua parameter skema ditulis dan dinormalkan. Desain yang tidak bisa dibawa link (seed kosong, palet di luar 1–5 atau HEX tidak sah, latar tidak sah, preset tak dikenal, ukuran Custom di luar 320–7680 atau pecahan) ditolak dengan `RangeError`. |
| `readLink(hash, patterns)` | `{ design, notices }`. `design` hanya berisi kunci yang ada di link dan terbaca (1a). `notices` berisi `unknown-pattern` (dengan ID aslinya) atau `version` (dengan versi link). Tidak pernah melempar error karena isi hash; error hanya muncul bila modul Arcs tidak ikut diberikan. |
| `shareUrl(origin, hash)` | `${origin}/create/#${hash}`, tanpa awalan bahasa (SHR-02) |
| `normalizeParams(schema, raw)` | Semua kunci skema dengan urutan skema. Angka dipotong ke rentang lalu dibulatkan ke langkah, dan pilihan yang tidak dikenal diganti nilai awal. Dipakai writer, reader, dan nanti slider di Fase 1b. |
| `FALLBACK_PATTERN`, `CUSTOM_MIN`, `CUSTOM_MAX` | `'arcs'`, 320, dan 7680 |

Contoh Lampiran B ditulis ulang persis:

```
v=1&p=arcs&s=42&pal=e07a5f.3d405b.81b29a&bg=f4efe6&m=pair&d=ios-69&x=layers:5,curve:0.6,focus:0.5
```

Pemakaian di Fase 1b nanti:

```ts
// Saat Create dibuka
const { design, notices } = readLink(location.hash, [arcs, hills, waves, gradient]);
// design: hanya kunci dari link; sisanya diisi nilai awal Create, dan device null → deteksi (DEV-03)
// notices: tampilkan pemberitahuan untuk unknown-pattern dan version

// Setiap kali desain berubah (SHR-01): tulis hash ini lewat replaceState dari $app/navigation,
// dengan tanda tangan yang dicek dulu di dokumentasi SvelteKit 3 yang terpasang
const hash = `#${writeLink(current, patternModule)}`;

// Salin link (SHR-02)
const url = shareUrl(location.origin, writeLink(current, patternModule));
```

### Aturan baca

| Kasus | Hasil | Dasar |
| --- | --- | --- |
| Parameter hilang | Nilai awal skema | Lampiran B |
| Di luar rentang | Dipotong ke batas | Lampiran B |
| Kunci tak dikenal, termasuk `fx` dan `o` | Diabaikan | Lampiran B, 9a |
| Nama parameter tak dikenal | Diabaikan, termasuk `constructor` dan `__proto__` | Lampiran B |
| ID pola tak dikenal | `arcs` dengan nilai awalnya, notice `unknown-pattern`, dan `x` diabaikan | Lampiran B, 11a |
| `p` tidak ada | Tanpa pola dan tanpa parameter; `x` diabaikan | 1a |
| Di antara langkah | Langkah terdekat dari `min`, setengah dibulatkan ke atas, tanpa sisa float: 3.5 → 4, 0.62 → 0.6, 0.625 → 0.65 | 2a |
| HEX palet tidak sah | Dibuang; huruf besar menjadi huruf kecil; bila tidak ada yang sah, `pal` hilang | 3a |
| `bg` tidak sah | Hilang | 4a |
| Lebih dari 5 warna | Lima pertama yang sah | 5a |
| Seed kosong | Hilang; seed lain apa adanya, tanpa trim, dan `+` tetap `+` | 6a |
| `d` tak dikenal | Hilang, tanpa notice | 7a |
| `w`/`h` | Dibulatkan ke px lalu dipotong ke 320–7680; menggantikan `d`; bila tidak lengkap atau tidak terbaca, `d` yang dipakai | 8a |
| `v` | Versi lain → notice `version`; hilang atau tidak terbaca → tanpa notice | 10a |
| Kunci ganda | Yang pertama | Bagian 4 |
| Percent-encoding rusak, nilai kosong | Kunci dianggap hilang | Bagian 4 |
| Angka bukan desimal biasa (`abc`, `1e1`, `0x10`, `.5`, `+7`) | Nilai awal | Bagian 4 |

### Data preset

`presets.json` berisi 28 preset dengan urutan Lampiran A. Kategorinya `phone`, `tablet`, `laptop`, dan `desktop`; labelnya nanti ada di file terjemahan. Tes membaca tabel Lampiran A langsung dari `docs/PRD.md` dan membandingkannya dengan JSON, jadi perbedaan antara PRD dan data akan langsung ketahuan.

JSON diimpor dengan `with { type: 'json' }`. Playwright memuat fixture sebagai ESM asli, dan tanpa atribut itu impor JSON ditolak. Vite, Vitest, svelte-check, dan skrip pratinjau menerima bentuk yang sama.

---

## Tes

| File | Tes | Isi |
| --- | --- | --- |
| `tests/presets.test.ts` | 4 | Sama dengan tabel Lampiran A di PRD (urutan, kategori, ukuran); ID unik; ponsel dan tablet potret, laptop dan desktop lanskap; 6 preset perwakilan ada |
| `tests/share/link-write.test.ts` | 11 | Contoh Lampiran B persis; parameter lengkap dengan urutan skema; nilai di antara langkah dan nama asing dinormalkan; pilihan; `w`/`h` menggantikan `d`; tanpa ukuran (HOME-07); `auto` dan HEX huruf kecil; tanpa `o`/`fx`; seed `a+b & c=d#é,x:y.z%/😀` di-encode; 9 desain tidak sah ditolak; `shareUrl` tanpa awalan bahasa |
| `tests/share/link-read.test.ts` | 28 | Setiap aturan Lampiran B, aturan turunan, dan keputusan 1a sampai 11a. Juga: untuk setiap parameter angka di keempat pola, masukan dari min − 2 sampai max + 2 dengan selang langkah/7 selalu menghasilkan nilai langkah yang persis. Keempat pola dirender dari link dengan nilai di antara langkah, termasuk `layers:3.5` yang tadinya membuat `resolveColors` gagal. 14 hash rusak tidak membuat error dan hasilnya selalu bisa dirender. |
| `tests/share/roundtrip.test.ts` | 12 | SHR-02 untuk keempat pola, lewat `new URL(shareUrl(...)).hash`. Detail di bawah. |

Kasus SHR-02 per pola:

| Tes | Kasus | Yang dicek |
| --- | --- | --- |
| Baca dan tulis ulang | Set parameter (nilai awal, semua minimum, semua maksimum, dan kasus tambahan ENG-08) × 4 seed (`1`, `42`, `senja-teduh-42`, `a+b & c=d#é 😀`) × 8 ukuran (6 preset perwakilan, Custom 3000 × 2000, tanpa ukuran). Totalnya 1.760 link. | Desain hasil baca sama persis, tanpa notice, dan link yang ditulis ulang sama persis |
| SVG per parameter | Semua set parameter × 4 seed × Terang dan Gelap di ios-63, total 440 pasang | SVG dari desain hasil baca identik |
| SVG per ukuran | 8 ukuran × Terang dan Gelap dengan nilai awal, total 64 pasang | SVG dari desain hasil baca identik |

### Pemeriksaan mutasi

Sepuluh kesalahan sengaja dimasukkan ke `link.ts` satu per satu, lalu tes dijalankan:

| Mutasi | Tes gagal |
| --- | --- |
| Tanpa pembersihan sisa float | 7 |
| `+` dibaca sebagai spasi | 1 |
| Kunci ganda: yang terakhir menang | 1 |
| `x` tetap dipakai setelah kembali ke Arcs | 1 |
| Seed tidak di-encode | 9 |
| Enam warna | 2 |
| Dibulatkan ke bawah, bukan ke terdekat | 10 |
| Palet kosong tetap dikembalikan | 14 |
| Ukuran Custom tidak dipotong | 1 |
| `in` menggantikan `Object.hasOwn` untuk nama parameter | 0 |

Mutasi terakhir lolos karena tidak berdampak: `normalizeParams` hanya membaca kunci skema, jadi nama seperti `constructor` tetap terbuang. `Object.hasOwn` dipertahankan sebagai pengaman. Setelah setiap mutasi, kode dikembalikan dan dicek sama dengan aslinya.

---

## Uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | 0 error, 0 peringatan (397 file) |
| `npm run lint` | Bersih |
| `npm test` | 619 tes unit (55 baru) dan 49 tes Playwright lulus. Snapshot ENG-08 tidak berubah. |
| `npm run build` | Berhasil. Belum ada halaman yang mengimpor modul link, jadi JS awal Home dan Create tidak berubah. |
| Ukuran modul | `link.ts` setelah di-bundle dan di-minify, termasuk bagian engine yang ikut terbawa: 6.428 B, atau 2.301 B gzip |
| `npm run preview:pattern -- arcs` | Berjalan dengan fixture baru, tanpa perubahan hasil |

Seperti sesi ekspor, Playwright meminta Chromium revisi 1248, sedangkan yang terpasang revisi 1243. Tes dijalankan dengan `PLAYWRIGHT_BROWSERS_PATH` yang menunjuk ke folder sementara di luar repo. Repo tidak diubah untuk ini.

---

## Penyimpangan dari rencana

1. **Nilai kosong berlaku untuk semua kunci.** Rencana hanya menyebut `s=` dan `pal=`. Sekarang `p=`, `bg=`, `m=`, `d=`, `w=`, `h=`, dan `x=` juga dianggap hilang. Akibatnya, `p=` tidak memunculkan notice pola tak dikenal dengan ID kosong.
2. **`writeLink` menolak desain yang tidak sah** dengan `RangeError`, sama seperti `resolveColors` dan `exportFileName`. Rencana hanya menyebut normalisasi parameter. Dengan ini, kesalahan UI di Fase 1b langsung ketahuan dan tidak menghasilkan link yang tidak bisa dibuka.
3. **`readLink` melempar error bila modul Arcs tidak diberikan.** Ini kesalahan pemanggil, bukan isi hash, jadi aturan "tidak pernah melempar error" tetap berlaku untuk hash.
4. **Tes preset membandingkan dengan tabel PRD.** Rencana hanya menyebut jumlah, ID unik, dan orientasi.
5. **File bantu `tests/fixtures/design-config.ts`** mengubah `Design` menjadi `RenderConfig` untuk tes. Desain tanpa ukuran memakai ios-63 sebagai pengganti deteksi device. Fungsi ini sengaja tidak dimasukkan ke `src/`, karena belum ada pemakainya di situs.
6. **Impor JSON memakai `with { type: 'json' }`**, dengan alasan di bagian Data preset.

## Titik lemah

1. **`render()` masih gagal bila dipanggil langsung dengan nilai di antara langkah,** misalnya `layers: 3.5`. Link selalu aman karena melewati `normalizeParams`. Slider di Fase 1b juga harus memakai `normalizeParams`; kalau tidak, preview dan link bisa berbeda karena sisa float.
2. **Semua modul pola harus dimuat sebelum `readLink`.** Untuk 4 pola di MVP ini tidak masalah. Saat ENG-10 (P1) dikerjakan, pembacaan perlu dipecah dua.
3. **ID preset tidak dinyatakan permanen di PRD.** PAT-09 hanya mengatur ID pola. Bila preset diganti nama atau dihapus, link lama akan diam-diam memakai deteksi device (7a). Lihat butir 9 di daftar di bawah.
4. **Versi lain hanya memunculkan notice.** Belum ada cara menyimpan algoritma lama; ini diputuskan saat versi pertama kali naik (10a).
5. **Panjang link tidak dibatasi.** Seed panjang menghasilkan link panjang. Pembacaannya tetap linear, dan tes dengan seed 5.000 karakter lulus.

---

## Hal yang belum diatur PRD

Gabungan dari sesi ekspor dan sesi ini. Butir 1–11 perlu diputuskan sebelum Fase 1b, karena halaman Create membutuhkannya. Butir 12–14 baru dibutuhkan setelah rilis publik atau di Fase 2. Kolom Usulan berisi rekomendasiku; teks UI tetap perlu dari FaL.

### Sebelum Fase 1b

| No. | Hal | Asal | Yang perlu diputuskan | Usulan |
| --- | --- | --- | --- | --- |
| 1 | Teks pesan gagal ekspor (EXP-07) | Rencana ekspor §8, laporan ekspor titik lemah 5 | Judul dan isi pesan saat PNG gagal dibuat, dalam English dan Indonesia. EXP-07 meminta pesan yang jelas beserta saran ukuran lebih kecil atau SVG | Satu kotak dengan bentuk sama seperti "PNG terlalu besar", dengan tombol yang sama |
| 2 | Teks English kotak "PNG terlalu besar" | Laporan ekspor titik lemah 5 | Wireframe hanya memuat versi Indonesia: "PNG 7680 × 7680 px terlalu besar", "Melebihi batas PNG di browser ini", "Unduh lebih kecil", dan "Unduh SVG" | — |
| 3 | Ukuran "Unduh lebih kecil" setelah gagal | Laporan ekspor titik lemah 4 | Bila PNG ≤ 16,7 MP gagal (mis. memori ponsel habis), `smallerPngSize` mengembalikan ukuran yang sama. (a) Setengah luas (sisi × 0,71). (b) Setengah sisi. (c) Hanya tawarkan SVG | a |
| 4 | Dithering gradien | Rencana ekspor §6, keputusan 7a | D0 (tanpa dithering), D1 (dithering sejati khusus gradient), atau D2 (grain di PNG). Menunggu angka Safari dan Firefox dari panduan uji di laporan ekspor | Tetap D0 sampai angka masuk |
| 5 | Teks pemberitahuan link | Sesi ini (Lampiran B, SHR-03) | Teks untuk pola tak dikenal (apakah ID aslinya ditampilkan?) dan versi berbeda, dalam English dan Indonesia. Juga bentuknya: toast yang hilang sendiri atau kotak di atas preview yang ditutup manual | Kotak kecil di atas preview yang bisa ditutup, tanpa menampilkan ID |
| 6 | Teks setelah Salin link dan Salin kode | Sesi ini dan sesi ekspor (SHR-02, EXP-03) | Wireframe hanya memuat tombolnya. Apakah ada konfirmasi seperti "Link disalin", dan di mana? Bila clipboard ditolak, link "tampil terpilih": di kotak teks di bawah tombol, dengan label apa? | Label tombol berganti sebentar menjadi "Disalin"; cadangan berupa kotak teks baca-saja yang langsung terpilih di bawah tombol |
| 7 | Nilai awal Create tanpa link | Sesi ini (keputusan 1a) | Pola, seed, dan palet saat Create dibuka tanpa hash. Latar (Otomatis, COL-05) dan mode (Berdampingan/Bandingkan = `pair`, MODE-03) sudah diatur PRD | Arcs, seed acak tiap kunjungan, palet terkurasi pertama (Senja) |
| 8 | Hash berubah saat halaman terbuka | Sesi ini | Bila pengguna menempel link lain di tab yang sama, hanya hash yang berubah dan halaman tidak dimuat ulang (`hashchange`). (a) Desain dimuat ulang dari hash baru. (b) Diabaikan | a |
| 9 | ID preset permanen | Sesi ini (titik lemah 3) | PAT-09 hanya mengatur ID pola. Apakah ID preset (kunci `d`) juga tidak boleh diganti atau dipakai ulang? | Ya, ditambahkan ke PAT-09 atau Lampiran B |
| 10 | Nama dan bidang lain preset | Sesi ini (keputusan 13a) | Kolom Preset di Lampiran A berformat Indonesia ("iPhone 6,9″", "seri lama", "Kelas umum"). Apakah nama disimpan di `presets.json` atau di file terjemahan? Contoh model, OS, templat overlay, dan tautan sumber ditambahkan bersama panel Perangkat | Nama di file terjemahan dengan kunci ID preset; contoh model dan tautan di JSON karena nama produk tidak diterjemahkan |
| 11 | `m` di link dari Home (HOME-07) | Sesi ini | HOME-07 menyebut pola, seed, palet, latar, dan parameter, tetapi tidak menyebut mode. (a) Home menulis `m=pair`. (b) `m` tidak ditulis, jadi Create memakai nilai awalnya, yang juga `pair`. Bedanya baru terasa di SHR-04 (Fase 2): dengan (b), mode terakhir pengguna tetap dipakai | b |

### Setelah rilis publik atau di Fase 2

| No. | Hal | Asal | Yang perlu diputuskan |
| --- | --- | --- | --- |
| 12 | Link lama setelah versi naik (SHR-03) | Keputusan 10a | Simpan algoritma lama per versi supaya hasilnya tetap sama, atau cukup pemberitahuan |
| 13 | Parameter hilang vs pengaturan terakhir (SHR-04) | Sesi ini | Lampiran B: parameter yang hilang memakai nilai awal katalog. SHR-04: nilai yang tidak ada di URL diambil dari pengaturan terakhir. Untuk parameter pola, mana yang menang? |
| 14 | Penulisan `o` (DEV-06, DEV-07) | Keputusan 9a | Untuk preset tablet, `o` selalu ditulis (termasuk `portrait`), atau hanya bila bukan potret. Lampiran B: "tidak ditulis untuk preset lain" |

---

## Catatan untuk Fase 1b

- **NAV-11:** pengalih di `/` dan `/create/` harus membawa `location.hash`. Dropdown bahasa (NAV-09) juga.
- **SHR-01:** pakai `replaceState` dari `$app/navigation`, bukan `history.replaceState` langsung, setelah dicek di dokumentasi SvelteKit 3 yang terpasang.
- **Slider:** simpan nilai lewat `normalizeParams` (titik lemah 1).
- **HOME-07:** Home memanggil `writeLink` dengan `device: null`, ditambah keputusan butir 11.

---

## Belum diuji

- `replaceState` dan hash di browser asli; di sini hanya parser URL WHATWG di Node
- Pengalih bahasa yang mempertahankan hash (NAV-11, NAV-09)
- Clipboard dan cadangan link terpilih (SHR-02)
- Tampilan pemberitahuan
- Firefox, WebKit, dan Safari asli (tidak ada tes browser baru di sesi ini)
