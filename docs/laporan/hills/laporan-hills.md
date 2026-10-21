# Laporan: pola `hills` (PAT-01)

Draft PR: https://github.com/faljourney/falette/pull/7 (branch `claude/intelligent-newton-pt3d7g`, 8 commit dari main `853a835`). Semua rekomendasi di rencana disetujui:

1. `softness` = kebulatan bentuk.
2. Batas 30% berlaku di semua kanvas.
3. Batas variasi seed khusus hills.
4. Skrip pratinjau diperluas.

Setelah meninjau pratinjau pertama, FaL meminta `FRONT_MAX` diturunkan dari 0,75 ke 0,6. Semua angka di laporan ini sudah mengikuti nilai 0,6; perbandingan sebelum dan sesudahnya ada di bagian [Revisi](#revisi-setelah-pratinjau-front_max-075--06).

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| 1 `42c78f4` | `docs/falette-100-pattern.md` | Aturan umum baru di bawah Geometri: "**Potret**: di kanvas potret, bentuk utama pola Lanskap menempati minimal 30% tinggi kanvas di semua seed dan parameter (DEV-05)." | DEV-05 |
| 2 `e8588ac` | `src/lib/patterns/hills.ts` (baru) | Modul pola: skema persis katalog, `colorCount = layers`, `layout()` murni (titik puncak dan lembah dari ukuran, parameter, dan 24 tarikan PRNG), serta `curve()` (kurva Bézier yang dipotong di tepi kanvas). 13 konstanta. | PAT-01, PAT-02, PAT-04, PAT-09, ENG-01–ENG-06, ENG-11, MODE-01, DEV-05 |
| 2 | `tests/patterns/hills.test.ts` (baru) | 34 tes, rinciannya di bawah. | PAT-10, ENG-08 |
| 3 `e3a1bd2` | `tests/fixtures/snapshot-patterns.ts`, `tests/engine/__snapshots__/hills/` | `hills` masuk snapshot: 3 seed bersama × 6 preset × Terang dan Gelap (36 file), ditambah 10 kasus khusus di `ios-63` dan `mba-13` Terang (20 file). | ENG-08 |
| 4 `e145607` | `scripts/preview-pattern.js` | Selain seed 42 di 6 preset, skrip kini juga menulis seed 1–8 di and-fhd20 dan mba-13, serta setiap parameter di nilai min, awal, dan maks di and-fhd20. Semua dalam Terang dan Gelap, plus satu lembar PNG per set, dirender dengan Chromium dari Playwright. | PAT-10, ENG-07 |
| 5 `2812528` | `docs/laporan/hills/` | Laporan ini dan tiga pratinjau PNG. | |
| 6 `c52372d` | `src/lib/patterns/hills.ts`, `tests/patterns/hills.test.ts`, 56 snapshot hills | Revisi: `FRONT_MAX` 0,75 → 0,6, dua tes yang terikat pada rentang lama, dan snapshot hills. | PAT-10, ENG-08 |
| 7 `c8669dc` | `docs/laporan/hills/` | Laporan dan ketiga pratinjau diperbarui untuk revisi. | |
| 8 | `docs/laporan/hills/laporan-hills.md` | Lima pernyataan kurang tepat diperbaiki setelah verifikasi independen (bagian terakhir). | |

Tidak disentuh: engine, palet, arcs, PRD, AGENTS.md, dan bagian lain katalog. Tanda ✅ belum diberikan. Versi engine tetap 1, dan snapshot mock serta arcs tidak berubah.

## Bentuk dan parameter

- **Lapisan:** `layers` lapis punggung bukit dicat dari belakang ke depan, warna ke-1 di belakang. Isi SVG: satu `rect` latar ditambah satu `path` per lapisan.
- **Punggung bukit:** deretan puncak dan lembah yang disambung kurva Bézier dengan lengan kendali mendatar. Kurva tidak pernah melewati titik-titiknya, dan dipotong tepat di tepi kiri dan kanan.
- **Puncak utama:** tiap lapisan punya satu puncak tertinggi di dalam kanvas, dan semua lapisan di depannya lebih rendah dari puncak itu. Jadi setiap lapisan pasti terlihat.
- **Lebar bukit:** mengikuti tinggi kanvas. Layar yang lebih lebar menampilkan lebih banyak bukit, bukan bukit yang direntangkan (DEV-05). Bukit di lapisan depan sampai 2× lebih lebar.

| Parameter | Arti |
| --- | --- |
| `layers` 3–10 (5) | Jumlah lapisan. Lapisan belakang dan depan tetap; nilai ini hanya menyisipkan lapisan di antaranya. |
| `height` 0–1 (0,5) | Puncak lapisan belakang naik dari 38% tinggi kanvas sampai min(70% tinggi, 50% sisi terpanjang): 50% di potret dan persegi, 66,7% di lanskap 4:3, dan 70% di layar ≥ 1,4:1. Lembah ikut lebih dalam. Tidak ada yang bergeser ke samping. |
| `softness` 0–1 (0,6) | Kebulatan bukit: 0 berarti sisi lurus dengan puncak lancip, sekitar 0,7 bulat seperti gelombang kosinus, dan 1 berarti puncak lebar membulat. Hanya lengkungan di antara titik yang berubah. |

**Seed:** PRNG utama ditarik tepat 24 kali, dengan urutan tetap:

| Tarikan | Isi |
| --- | --- |
| 1 | Lebar bukit |
| 2 | Kedalaman lembah |
| 3 | Tinggi lapisan depan: 15–60% dari puncak belakang |
| 4 | Taper |
| 5–24 | Untuk 10 slot lapisan: posisi puncak utama dan satu seed anak (`mulberry32`) untuk ritme punggung lapisan itu |

Jumlah titik punggung mengikuti lebar kanvas, tapi semuanya diambil dari aliran lapisannya sendiri, jadi jumlah tarikan PRNG utama tidak berubah.

## Aturan potret (DEV-05)

Punggung lapisan belakang tidak pernah turun di bawah 30% tinggi kanvas di kolom mana pun. Jadi seluruh 30% bagian bawah kanvas selalu tertutup bukit. Di potret, semua titik juga paling tinggi 50% tinggi kanvas, sehingga setengah atas tetap kosong untuk jam.

Pengukuran di kode akhir (sesudah revisi) mencakup 3.488.100 render:

- **Ukuran:** 17 preset potret Lampiran A dan 5 ukuran Custom potret (320×7680, 1644×3840, 320×400, 1000×1001, 7679×7680).
- **Seed:** 302 seed (1–300, `senja-teduh-42`, dan `480`).
- **Parameter:** 525 set, yaitu `layers` 3–10 × setiap langkah `height` × `softness` 0 / 0,6 / 1, ditambah setiap langkah `softness`.
- **Hasil:** punggung belakang terendah **31,35%**, dan titik tertinggi tepat **50,00%**. Angkanya sama dengan sebelum revisi, karena lapisan belakang tidak bergantung pada `FRONT_MAX`.

Semua titik kendali ikut diperiksa, karena kurva Bézier selalu berada di dalam titik kendalinya.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | ✅ 0 error, 0 peringatan |
| `npm run lint` | ✅ bersih |
| `npm test` (unit) | ✅ 280 lulus: 34 tes hills, 56 snapshot hills, dan 190 tes lama yang tidak berubah |
| `npm test` (Playwright, `tests/home.e2e.ts`) | ✅ 1 lulus. Di container, Chromium bawaan disambungkan lewat path browser sementara di luar repo |
| `npm run build` | ✅ berhasil |

Isi tes hills:

- **Modul dan warna:** skema katalog; urutan warna ENG-11 untuk palet 1, 3, dan 5 warna di kedua varian.
- **MODE-01:** Terang = Gelap setelah warna disamarkan, dan geometri tetap saat palet atau latar diganti.
- **ENG-02:** tepat 24 tarikan PRNG di semua parameter dan ukuran Custom ekstrem.
- **Isi SVG:** hanya `rect` dan `path` dengan atribut presentasi; maksimal 2 desimal; tiap lapisan tertutup di tepi bawah, dan tidak ada titik di luar kanvas.
- **Proporsi:** ukuran 2× menghasilkan geometri tepat 2×; layar 2× lebih lebar menambah bukit tanpa mengubah bukit yang sudah ada; batas 30% dan batas atas di potret, Custom potret, lanskap, dan persegi.
- **Parameter:** `height` 0 = 38% dan `height` 1 = batas atas; `height` menaikkan setiap titik tanpa menggeser ke samping; `layers` mempertahankan lapisan belakang dan depan; `softness` hanya menekuk kurva di antara titik.
- **Visibilitas:** setiap lapisan terlihat di puncak utamanya, minimal 1,8% tinggi bukit, yaitu (1 − `FRONT_MAX`)(1 − `TAPER`)/9.
- **Seed dan waktu render:** variasi seed di 6 preset; setiap sumbu seed bergerak ke dua arah; batas waktu ENG-07.

**Uji mutasi.** Sepuluh perubahan kode yang sengaja salah, diulang pada kode sesudah revisi, dan semuanya tertangkap tes:

- lembah belakang yang mengabaikan batas 30%;
- `DEEP_MAX` di atas 1;
- batas potret 52%;
- lengan kendali 2× lebih panjang;
- lapisan depan memakai slot lain;
- taper 1;
- tanpa pemotongan di tepi kiri;
- `FRONT_MAX` dipersempit ke 0,5 (tertangkap tes sumbu seed);
- `FRONT_MAX` dinaikkan ke 0,7, atau dikembalikan ke nilai lama 0,75 (keduanya tertangkap tes visibilitas).

Sebelum revisi, mutasi kedelapan adalah `FRONT_MAX` 0,6. Nilai itu kini menjadi nilai resmi, jadi mutasinya diganti 0,5.

## Variasi seed (PAT-10)

Metrik grid sama dengan arcs: seed 1–30, 435 pasangan. Batas khusus hills yang disetujui adalah median ≥ 0,45, pasangan termirip ≥ 0,1, dan maksimal 2% (8 pasangan) di bawah 0,2.

| Preset, parameter awal | Median | Termirip | Di bawah 0,2 | Di bawah 0,3 |
| --- | --- | --- | --- | --- |
| and-fhd20 | 0,495 | 0,153 | 5 | 27 |
| ios-63 | 0,496 | 0,153 | 5 | 25 |
| ipad-pro-13 | 0,494 | 0,181 | 2 | 13 |
| mba-13 | 0,521 | 0,271 | 0 | 5 |
| desk-uw | 0,512 | 0,267 | 0 | 4 |
| desk-5k | 0,517 | 0,254 | 0 | 4 |

Semua preset lulus. Margin tersempit ada di and-fhd20 dan ios-63: 5 dari maksimal 8 pasangan di bawah 0,2, dan pasangan termirip 0,153 terhadap batas 0,1. Median terendah ada di ipad-pro-13: 0,494 terhadap batas 0,45. Sebagai pembanding, seed yang sama dengan `height` dinaikkan satu langkah berjarak median 0,04–0,08 per preset (per seed 0,02–0,11).

**Titik lemah, tidak diuji dengan batas ini:**

| Kasus | Median | Termirip | Di bawah 0,2 |
| --- | --- | --- | --- |
| `layers` 3, and-fhd20 dan ios-63 | 0,352–0,354 | 0,066–0,070 | 51 (11,7%) |
| `layers` 3, ipad-pro-13 | 0,361 | 0,083 | 28 (6,4%) |
| `layers` 3, mba-13, desk-uw, desk-5k | 0,364–0,375 | 0,131–0,146 | 10–12 |
| `layers` 10, semua preset | 0,626–0,646 | ≥ 0,274 | 0 |

Pasangan termirip kini adalah seed dengan tinggi lapisan depan yang hampir sama, baik tinggi maupun rendah. Contohnya seed 15 dan 19 (lapisan depan 0,58 dan 0,55 dari puncak belakang), serta seed 17 dan 21 (0,17 dan 0,23).

## Waktu render dan ukuran file (ENG-07: ≤ 50 ms laptop, ≤ 100 ms ponsel)

| desk-5k (5120×2880) | Node, median 50 render | Node, terlama dari seed 1–200 | Chromium, CPU 4× lebih lambat | Chromium, CPU 6× lebih lambat | SVG seed 42 | SVG terbesar dari seed 1–200 |
| --- | --- | --- | --- | --- | --- | --- |
| Nilai awal (5; 0,5; 0,6) | 0,03–0,06 ms | 0,6 ms | median 0,1–0,2 ms, terlama 4,0 ms | median 0,1 ms, terlama 2,4 ms | 2,2 KB | 2,6 KB |
| Nilai maksimum (10; 1; 1) | 0,05–0,08 ms | 0,5 ms | median 0,1 ms, terlama 1,7 ms | median 0,1 ms, terlama 2,4 ms | 4,0 KB | 5,0 KB |

- **Kesimpulan:** jauh di bawah batas ENG-07, termasuk render terlama.
- **Timer Chromium:** resolusinya 0,1 ms, jadi median di bawah itu tercatat 0,1 ms.
- **Kasus terberat:** ukuran Custom 7680×320 (24:1) dengan 10 lapisan, karena kanvas selebar itu berisi banyak bukit. Di seed 42: median 0,6 ms dan 37 KB. File terbesar dari seed 1–200 adalah seed 158: 51 KB, median 1,0 ms.
- **Pengulangan:** semua angka di tabel ini diukur ulang sesudah revisi. Selisihnya dari pengukuran pertama hanya variasi mesin.
- **Ukuran kode:** engine + hills setelah minify 6,5 KB, atau 3,3 KB gzip (engine + arcs: 3,1 KB gzip). JavaScript awal Home dan Create belum berubah, karena belum ada rute yang memuat pola.
- **Sumber angka:** container dan Chromium headless, bukan perangkat asli.

## Pratinjau

Semua pratinjau dibuat dengan `npm run preview:pattern -- hills`, memakai palet dan latar contoh Lampiran B. Ketiganya dibuat ulang sesudah revisi. `pratinjau-seed-42.png` ikut berubah, karena lapisan depan seed 42 juga bergeser.

- [pratinjau-seed-42.png](pratinjau-seed-42.png): seed 42 di 6 preset perwakilan, Terang dan Gelap.
- [variasi-seed.png](variasi-seed.png): seed 1–8 di and-fhd20 dan mba-13, Terang dan Gelap.
- [parameter.png](parameter.png): and-fhd20 seed 42 dengan `layers` 3 / 5 / 10, `height` 0 / 0,5 / 1, dan `softness` 0 / 0,6 / 1, Terang dan Gelap.

File SVG-nya tidak di-commit; skrip menulisnya ke `previews/hills/`, yang di-gitignore.

## Yang belum diuji

- Perangkat asli (laptop dan ponsel kelas menengah).
- Membuka SVG hasil ekspor di Figma, Illustrator, dan Inkscape.
- Tampilan di bawah overlay jam lock screen, karena overlay belum dibuat.
- Persetujuan visual PAT-10 darimu. Tanda ✅ di katalog belum diberikan.

## Catatan

- **`softness` 0** memberi sisi lurus dan puncak lancip, sehingga bukit lebih mirip pegunungan. Ini sesuai arti yang disetujui; mohon dinilai di `parameter.png`. Efeknya paling jelas di seed dengan bukit lebar.
- **Skrip pratinjau** kini membutuhkan Chromium dari Playwright. Di komputermu cukup jalankan `npx playwright install chromium` sekali; langkah ini juga sudah dibutuhkan oleh `npm test`.
- **Commit 2** sempat diperbaiki sebelum di-push pertama kali: dua komentar konstanta (`FLOOR`, `TAPER`) diperjelas, tanpa perubahan kode. Revisi `FRONT_MAX` dibuat sebagai commit baru, tanpa menulis ulang riwayat yang sudah di-push.
- **Lampiran A** masih menyebut `and-fhd20` termasuk yang paling tinggi, padahal `and-pixel` dan `and-15k` sedikit lebih tinggi. Tes hills memakai semua 17 preset potret, jadi tidak terpengaruh. PRD tidak kuubah.

## Revisi setelah pratinjau: `FRONT_MAX` 0,75 → 0,6

**Alasan dari FaL.** Di seed 1–30 dengan parameter awal, 11 seed punya bukit depan yang menutupi lebih dari separuh area bukit, sehingga lapisan lain menjadi tipis (seed 5, 7, dan 8).

**Cara mengukur.** Luas lapisan depan dibagi luas seluruh bukit, dihitung di 400 kolom per kanvas. Lapisan depan dicat terakhir, jadi seluruh luas di bawah punggungnya terlihat. Hasil ini mereproduksi angka FaL tepat: 11 seed yang sama, yaitu 5, 7, 8, 9, 10, 15, 16, 19, 22, 26, dan 30, di keenam preset.

| Preset | Seed > 50%, sebelum | Seed > 50%, sesudah | Terbesar, sebelum → sesudah | Median (rata-rata seed ke-15 dan ke-16 dari 30), sebelum → sesudah |
| --- | --- | --- | --- | --- |
| and-fhd20 | 11 | 4 (7, 8, 15, 19) | 66,8% → 53,6% | 35,1% → 29,8% |
| ios-63 | 11 | 3 (8, 15, 19) | 66,7% → 53,5% | 35,0% → 29,7% |
| ipad-pro-13 | 11 | 1 (15) | 64,3% → 51,7% | 33,5% → 28,7% |
| mba-13 | 11 | 1 (15) | 67,0% → 54,0% | 34,5% → 29,4% |
| desk-uw | 11 | 1 (15) | 63,5% → 51,0% | 32,8% → 28,0% |
| desk-5k | 11 | 2 (15, 16) | 66,7% → 53,5% | 34,2% → 29,2% |

Masih ada 1–4 seed yang sedikit di atas 50%, paling banyak 54%. Seed 15 adalah satu-satunya yang melewati 50% di semua preset. Menghapusnya sama sekali butuh `FRONT_MAX` yang lebih rendah lagi; itu tidak kulakukan karena tidak diminta.

**Yang berubah di kode.** Hanya `FRONT_MAX` dan komentarnya: "low enough that the front layer seldom covers over half of the hills". Konstanta lain tetap.

**Tes yang diubah.** Kedua perubahan ini karena kebutuhannya berubah, bukan supaya tes lulus:

| Tes | Sebelum | Sesudah | Alasan |
| --- | --- | --- | --- |
| "moves every seed axis both ways": tinggi lapisan depan tertinggi di seed 1–30 | ≥ 0,65 | ≥ 0,52 | Rentang baru maksimal 0,6, jadi 0,65 mustahil dicapai. Ambang baru berada di 82% rentang, hampir sama dengan ambang lama (0,65 = 83% dari rentang 0,15–0,75). Terukur 0,583; sebelumnya 0,728. |
| "shows every layer": langkah tertipis antarpuncak utama | (1 − 0,75)(1 − 0,6)/9 = 1,1% dari puncak belakang | (1 − 0,6)(1 − 0,6)/9 = 1,8% | Batas ini diturunkan dari `FRONT_MAX`, jadi tes kini mengikuti nilai yang berlaku. Tes menjadi lebih ketat, bukan lebih longgar. Batas lama juga tetap lulus. |

Batas variasi seed (median ≥ 0,45, termirip ≥ 0,1, maksimal 2% di bawah 0,2) tidak diubah.

**Snapshot.** Ke-56 snapshot hills berubah. Di semua file, `rect` latar dan punggung lapisan belakang identik dengan sebelumnya; yang bergeser hanya lapisan di depannya. Snapshot mock dan arcs tidak berubah. Dengan kedua perubahan tes di atas dan sebelum snapshot diperbarui, `CI=true npx vitest run` gagal tepat di 56 kasus snapshot hills, dan semua tes lain lulus.

**Variasi seed, sebelum → sesudah.** Seed 1–30, 435 pasangan:

| Preset | Median | Termirip | Di bawah 0,2 | Di bawah 0,3 |
| --- | --- | --- | --- | --- |
| and-fhd20 | 0,521 → 0,495 | 0,142 → 0,153 | 5 → 5 | 30 → 27 |
| ios-63 | 0,523 → 0,496 | 0,144 → 0,153 | 6 → 5 | 32 → 25 |
| ipad-pro-13 | 0,515 → 0,494 | 0,160 → 0,181 | 2 → 2 | 16 → 13 |
| mba-13 | 0,538 → 0,521 | 0,236 → 0,271 | 0 → 0 | 4 → 5 |
| desk-uw | 0,531 → 0,512 | 0,239 → 0,267 | 0 → 0 | 5 → 4 |
| desk-5k | 0,532 → 0,517 | 0,239 → 0,254 | 0 → 0 | 6 → 4 |
| `layers` 3, and-fhd20 | 0,394 → 0,352 | 0,061 → 0,070 | 43 → 51 | 127 → 152 |
| `layers` 3, ios-63 | 0,395 → 0,354 | 0,059 → 0,066 | 43 → 51 | 126 → 151 |
| `layers` 3, ipad-pro-13 | 0,392 → 0,361 | 0,099 → 0,083 | 24 → 28 | 108 → 136 |
| `layers` 3, mba-13 | 0,402 → 0,375 | 0,156 → 0,139 | 11 → 12 | 74 → 93 |
| `layers` 3, desk-uw | 0,395 → 0,364 | 0,152 → 0,146 | 9 → 10 | 66 → 93 |
| `layers` 3, desk-5k | 0,400 → 0,373 | 0,142 → 0,131 | 9 → 12 | 80 → 94 |

**Dampaknya:**

- Dengan parameter awal, median turun 0,015–0,027, karena rentang tinggi lapisan depan (sumbu seed terkuat) menyempit 25%. Sebaliknya, pasangan termirip menjauh di semua preset, dan jumlah pasangan di bawah 0,3 turun di 5 dari 6 preset.
- Dengan `layers` 3, variasinya melemah: median turun 0,027–0,042, dan di ponsel 51 pasangan (11,7%) berada di bawah 0,2. Seperti sebelumnya, ini tidak diuji dengan batas, tapi kucatat sebagai titik lemah.

## Verifikasi independen revisi

Sebelum laporan ini difinalkan, revisi diperiksa ulang oleh empat pemeriksa independen yang hanya membaca repo. Masing-masing memakai skrip yang ditulis sendiri:

- **Metrik variasi seed:** semua angka di tabel variasi seed, sebelum dan sesudah, cocok sampai 3 desimal.
- **Luas lapisan depan:** daftar seed dan nilai terbesar cocok. Hasil dengan 400 dan 2000 kolom sama.
- **Diff `c52372d`:** di `src/` hanya `FRONT_MAX` dan komentarnya yang berubah, dan hanya 56 snapshot hills yang berubah. Tidak ada referensi lain ke rentang lama yang tertinggal.
- **Klaim di laporan:** commit, angka dari kode dan tes, ukuran file, dan slug tautan semuanya cocok.

Setiap temuan lalu diuji ulang oleh pemeriksa kedua yang mencoba membantahnya. Ada lima pernyataan kurang tepat yang terkonfirmasi, dan semuanya sudah diperbaiki di laporan ini:

| Pernyataan lama | Masalah | Perbaikan |
| --- | --- | --- |
| Median tersempit 0,495 di and-fhd20 | Median terendah ada di ipad-pro-13 (0,494) | Kalimat margin dipisah: jumlah pasangan dan termirip di and-fhd20/ios-63, median di ipad-pro-13 |
| Median variasi turun 0,02–0,03 | desk-5k hanya turun 0,015 | 0,015–0,027 (dan `layers` 3: 0,027–0,042) |
| Kolom "Median" luas lapisan depan | Isinya nilai ke-16 dari 30, bukan median | Diganti median sebenarnya; selisihnya 0,3–1,0 poin |
| Kasus terberat 7680×320: 37 KB | Itu ukuran seed 42; file terbesar dari seed 1–200 adalah 51 KB | Keduanya disebut |
| Mutasi "`FRONT_MAX` dikembalikan ke 0,7" | Nilai lama 0,75, bukan 0,7 | 0,7 dan 0,75 diuji, dan keduanya tertangkap |

Tidak ada kesalahan di kode, tes, atau snapshot.
