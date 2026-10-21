# Laporan: pola `hills` (PAT-01)

Draft PR: https://github.com/faljourney/falette/pull/7 (branch `claude/intelligent-newton-pt3d7g`, 5 commit dari main `853a835`). Semua rekomendasi di rencana disetujui:

1. `softness` = kebulatan bentuk.
2. Batas 30% berlaku di semua kanvas.
3. Batas variasi seed khusus hills.
4. Skrip pratinjau diperluas.

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| 1 `42c78f4` | `docs/falette-100-pattern.md` | Aturan umum baru di bawah Geometri: "**Potret**: di kanvas potret, bentuk utama pola Lanskap menempati minimal 30% tinggi kanvas di semua seed dan parameter (DEV-05)." | DEV-05 |
| 2 `e8588ac` | `src/lib/patterns/hills.ts` (baru) | Modul pola: skema persis katalog, `colorCount = layers`, `layout()` murni (titik puncak dan lembah dari ukuran, parameter, dan 24 tarikan PRNG), serta `curve()` (kurva Bézier yang dipotong di tepi kanvas). 13 konstanta. | PAT-01, PAT-02, PAT-04, PAT-09, ENG-01–ENG-06, ENG-11, MODE-01, DEV-05 |
| 2 | `tests/patterns/hills.test.ts` (baru) | 34 tes, rinciannya di bawah. | PAT-10, ENG-08 |
| 3 `e3a1bd2` | `tests/fixtures/snapshot-patterns.ts`, `tests/engine/__snapshots__/hills/` | `hills` masuk snapshot: 3 seed bersama × 6 preset × Terang dan Gelap (36 file), ditambah 10 kasus khusus di `ios-63` dan `mba-13` Terang (20 file). | ENG-08 |
| 4 `e145607` | `scripts/preview-pattern.js` | Selain seed 42 di 6 preset, skrip kini juga menulis seed 1–8 di and-fhd20 dan mba-13, serta setiap parameter di nilai min, awal, dan maks di and-fhd20. Semua dalam Terang dan Gelap, plus satu lembar PNG per set, dirender dengan Chromium dari Playwright. | PAT-10, ENG-07 |
| 5 | `docs/laporan/hills/` | Laporan ini dan tiga pratinjau PNG. | |

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
| 3 | Tinggi lapisan depan |
| 4 | Taper |
| 5–24 | Untuk 10 slot lapisan: posisi puncak utama dan satu seed anak (`mulberry32`) untuk ritme punggung lapisan itu |

Jumlah titik punggung mengikuti lebar kanvas, tapi semuanya diambil dari aliran lapisannya sendiri, jadi jumlah tarikan PRNG utama tidak berubah.

## Aturan potret (DEV-05)

Punggung lapisan belakang tidak pernah turun di bawah 30% tinggi kanvas di kolom mana pun. Jadi seluruh 30% bagian bawah kanvas selalu tertutup bukit. Di potret, semua titik juga paling tinggi 50% tinggi kanvas, sehingga setengah atas tetap kosong untuk jam.

Pengukuran di kode akhir mencakup 3.488.100 render:

- **Ukuran:** 17 preset potret Lampiran A dan 5 ukuran Custom potret (320×7680, 1644×3840, 320×400, 1000×1001, 7679×7680).
- **Seed:** 302 seed (1–300, `senja-teduh-42`, dan `480`).
- **Parameter:** 525 set, yaitu `layers` 3–10 × setiap langkah `height` × `softness` 0 / 0,6 / 1, ditambah setiap langkah `softness`.
- **Hasil:** punggung belakang terendah **31,35%**, dan titik tertinggi tepat **50,00%**.

Semua titik kendali ikut diperiksa, karena kurva Bézier selalu berada di dalam titik kendalinya.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | ✅ 0 error, 0 peringatan |
| `npm run lint` | ✅ bersih |
| `npm test` (unit) | ✅ 280 lulus: 34 tes hills, 56 snapshot hills baru, 190 tes lama tidak berubah |
| `npm test` (Playwright, `tests/home.e2e.ts`) | ✅ 1 lulus. Di container, Chromium bawaan disambungkan lewat path browser sementara di luar repo |
| `npm run build` | ✅ berhasil |

Isi tes hills:

- **Modul dan warna:** skema katalog; urutan warna ENG-11 untuk palet 1, 3, dan 5 warna di kedua varian.
- **MODE-01:** Terang = Gelap setelah warna disamarkan, dan geometri tetap saat palet atau latar diganti.
- **ENG-02:** tepat 24 tarikan PRNG di semua parameter dan ukuran Custom ekstrem.
- **Isi SVG:** hanya `rect` dan `path` dengan atribut presentasi; maksimal 2 desimal; tiap lapisan tertutup di tepi bawah, dan tidak ada titik di luar kanvas.
- **Proporsi:** ukuran 2× menghasilkan geometri tepat 2×; layar 2× lebih lebar menambah bukit tanpa mengubah bukit yang sudah ada; batas 30% dan batas atas di potret, Custom potret, lanskap, dan persegi.
- **Parameter:** `height` 0 = 38% dan `height` 1 = batas atas; `height` menaikkan setiap titik tanpa menggeser ke samping; `layers` mempertahankan lapisan belakang dan depan; `softness` hanya menekuk kurva di antara titik.
- **Visibilitas:** setiap lapisan terlihat di puncak utamanya, minimal 1,1% tinggi bukit.
- **Seed dan waktu render:** variasi seed di 6 preset; setiap sumbu seed bergerak ke dua arah; batas waktu ENG-07.

**Uji mutasi.** Delapan perubahan kode yang sengaja salah, dan semuanya tertangkap tes:

- lembah belakang yang mengabaikan batas 30%;
- `DEEP_MAX` di atas 1;
- batas potret 52%;
- lengan kendali 2× lebih panjang;
- lapisan depan memakai slot lain;
- taper 1;
- tanpa pemotongan di tepi kiri;
- rentang lapisan depan dipersempit.

## Variasi seed (PAT-10)

Metrik grid sama dengan arcs: seed 1–30, 435 pasangan. Batas khusus hills yang disetujui adalah median ≥ 0,45, pasangan termirip ≥ 0,1, dan maksimal 2% (8 pasangan) di bawah 0,2.

| Preset, parameter awal | Median | Termirip | Di bawah 0,2 | Di bawah 0,3 |
| --- | --- | --- | --- | --- |
| and-fhd20 | 0,521 | 0,142 | 5 | 30 |
| ios-63 | 0,523 | 0,144 | 6 | 32 |
| ipad-pro-13 | 0,515 | 0,160 | 2 | 16 |
| mba-13 | 0,538 | 0,236 | 0 | 4 |
| desk-uw | 0,531 | 0,239 | 0 | 5 |
| desk-5k | 0,532 | 0,239 | 0 | 6 |

Margin tersempit ada di ios-63: 6 dari maksimal 8 pasangan di bawah 0,2. Sebagai pembanding, seed yang sama dengan `height` dinaikkan satu langkah berjarak 0,04–0,08.

**Titik lemah, tidak diuji dengan batas ini:**

| Kasus | Median | Termirip | Di bawah 0,2 |
| --- | --- | --- | --- |
| `layers` 3 di ponsel | 0,39 | 0,06 | 43 (9,9%) |
| `layers` 3 di lanskap | 0,40 | 0,14–0,16 | 9–11 |
| `layers` 10, semua preset | 0,62–0,65 | ≥ 0,23 | 0 |

Pasangan termirip muncul saat lapisan depan tinggi: satu bukit besar di depan mendominasi gambar.

## Waktu render dan ukuran file (ENG-07: ≤ 50 ms laptop, ≤ 100 ms ponsel)

| desk-5k (5120×2880) | Node, median 50 render | Node, terlama dari seed 1–200 | Chromium, CPU 4× lebih lambat | Chromium, CPU 6× lebih lambat | SVG seed 42 | SVG terbesar dari seed 1–200 |
| --- | --- | --- | --- | --- | --- | --- |
| Nilai awal (5; 0,5; 0,6) | 0,03–0,06 ms | 2,8 ms | median 0,1 ms, terlama 2,5 ms | median 0,1 ms, terlama 6 ms | 2,2 KB | 2,6 KB |
| Nilai maksimum (10; 1; 1) | 0,05–0,11 ms | 0,7 ms | median 0,1 ms, terlama 2,6 ms | median 0,1 ms, terlama 6 ms | 4,0 KB | 5,0 KB |

- **Kesimpulan:** jauh di bawah batas ENG-07, termasuk render terlama.
- **Timer Chromium:** resolusinya 0,1 ms, jadi median di bawah itu tercatat 0,1 ms.
- **Kasus terberat:** ukuran Custom 7680×320 (24:1) dengan 10 lapisan butuh 1,1 ms dan 37 KB, karena kanvas selebar itu berisi banyak bukit.
- **Ukuran kode:** engine + hills setelah minify 6,5 KB, atau 3,3 KB gzip (engine + arcs: 3,1 KB gzip). JavaScript awal Home dan Create belum berubah, karena belum ada rute yang memuat pola.
- **Sumber angka:** container dan Chromium headless, bukan perangkat asli.

## Pratinjau

Semua pratinjau dibuat dengan `npm run preview:pattern -- hills`, memakai palet dan latar contoh Lampiran B.

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
- **Commit 2** sempat diperbaiki sebelum di-push: dua komentar konstanta (`FLOOR`, `TAPER`) diperjelas, tanpa perubahan kode.
- **Lampiran A** masih menyebut `and-fhd20` termasuk yang paling tinggi, padahal `and-pixel` dan `and-15k` sedikit lebih tinggi. Tes hills memakai semua 17 preset potret, jadi tidak terpengaruh. PRD tidak kuubah.
