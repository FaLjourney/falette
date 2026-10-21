# Laporan: pola `waves` (PAT-01)

Draft PR: https://github.com/FaLjourney/falette/pull/8 (branch `claude/waves-pattern-implementation-s2wq0a`, dari main `c03dfd6`). FaL menyetujui semua rekomendasi rencana (1a–8a):

1. Langkah slider `frequency` 1.
2. `amplitude` 0 berarti riak kecil.
3. Warna 1 di belakang.
4. Profil air tetap.
5. Geser fase per lapisan ±0,25 periode.
6. Batas atas sama dengan hills.
7. Perintah `S` untuk potongan tengah.
8. Tes dominasi.

Satu solusi ENG-07 ditambahkan setelah pengukuran: **A, batas 48 gelombang selebar layar** (lihat [Batas 48 gelombang](#batas-48-gelombang-eng-07)).

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| 1 `2cde270` | `src/lib/patterns/waves.ts` (baru) | Modul pola: skema persis katalog, `colorCount = layers`, `layout()` murni (garis tengah, amplitudo, dan fase tiap gelombang dari ukuran, parameter, dan 18 tarikan PRNG), `curve()` (kurva Bézier per seperempat gelombang, dipotong di tepi kanvas), dan path dengan `S` untuk potongan tengah. 15 konstanta. | PAT-01, PAT-02, PAT-04, PAT-09, ENG-01–ENG-07, ENG-11, MODE-01, DEV-05 |
| 1 | `tests/patterns/waves.test.ts` (baru) | 61 tes, rinciannya di bawah. | PAT-10, ENG-07 |
| 2 `20019b6` | `tests/fixtures/snapshot-patterns.ts`, `tests/engine/__snapshots__/waves/` | `waves` masuk snapshot: 3 seed bersama × 6 preset × Terang dan Gelap (36 file), ditambah 10 kasus khusus di `ios-63` dan `mba-13` Terang (20 file). | ENG-08 |
| 3 `4f2c92c` | `tests/patterns/waves.test.ts` | Tes batas 48 gelombang kini mencakup ke-28 preset Lampiran A. Sebelumnya lima preset laptop dan desktop terlewat, temuan saat memeriksa laporan ini. | ENG-07, DEV-05 |
| 4 | `docs/laporan/waves/` | Laporan ini dan tiga pratinjau PNG. | PAT-10, ENG-07 |

Yang tidak disentuh:
- Engine, palet, arcs, hills, PRD, AGENTS.md, dan katalog.
- Skrip pratinjau: tidak perlu diubah, karena sudah mengeluarkan `frequency` 1 / 2 / 6.

Versi engine tetap 1. Snapshot mock, arcs, dan hills tidak berubah. Tanda ✅ di katalog belum diberikan, karena menunggu persetujuan pratinjau.

## Bentuk dan parameter

- **Lapisan:** `layers` lapis gelombang dicat dari belakang ke depan, warna ke-1 di belakang. Isi SVG: satu `rect` latar ditambah satu `path` per lapisan, ditutup di tepi bawah.
- **Bentuk gelombang:** periodik sempurna dengan profil air `cos 2πτ + 0,2·cos 4πτ`. Puncaknya sedikit lancip dan lembahnya lebih landai. Bentuk ini sama di semua seed.
- **Cara digambar:** kurva Bézier kubik di antara titik seperempat gelombang (puncak, lembah, dan titik di tengahnya), dengan kemiringan dari rumus gelombang.
  - Potongan tepi dipotong tepat di x = 0 dan x = lebar.
  - Titik yang jatuh kurang dari 0,001 gelombang dari tepi dipindah ke tepi, supaya tidak ada potongan nyaris nol.
  - Selisih dari gelombang eksak paling banyak 0,66% tinggi gelombang.
- **Antar-lapisan:**
  - Semua lapisan berbagi panjang gelombang.
  - Puncak turun dalam garis lurus dari belakang ke depan, sehingga setiap lapisan terlihat di puncaknya.
  - Lapisan belakang lebih tenang (perspektif).
- **Perintah `S`:** potongan tengah lebarnya sama dan bertemu dengan kemiringan sama. Jadi titik kendali pertamanya adalah cerminan titik kendali sebelumnya, dan `S` boleh tidak menuliskannya. Hasilnya sekitar sepertiga lebih sedikit teks.

| Parameter | Arti |
| --- | --- |
| `layers` 3–12 (6) | Jumlah lapisan. Lapisan belakang dan depan tetap; nilai ini hanya menyisipkan lapisan di antaranya. |
| `amplitude` 0–1 (0,4) | Tinggi gelombang depan dari puncak ke lembah: 3% sisi terpendek di nilai 0 (riak kecil), 9% di nilai awal, dan 18% di nilai 1. Lapisan belakang 40–90% dari itu, dipilih seed. Garis tengah ikut menyesuaikan sedikit supaya lembah belakang tetap di atas 30% dan lembah depan tetap di atas tepi bawah. Tidak ada yang bergeser ke samping. |
| `frequency` 1–6 (2) | Jumlah gelombang selebar sisi terpendek layar, maksimal 48 gelombang selebar layar. Hanya panjang gelombang yang berubah. |

**DEV-05.** Panjang gelombang dan amplitudo sama-sama mengikuti sisi terpendek, jadi satu gelombang berbentuk sama di semua layar. Layar yang lebih lebar menampilkan lebih banyak gelombang, bukan gelombang yang lebih lebar. Fase diukur dari tengah layar, jadi gelombang tambahan muncul di kedua sisi.

Jumlah gelombang selebar layar:

| `frequency` | and-fhd20, ios-63, ipad-pro-13 | mba-13 | desk-uw | desk-5k |
| --- | --- | --- | --- | --- |
| 1 | 1 | 1,54 | 2,39 | 1,78 |
| 2 | 2 | 3,08 | 4,78 | 3,56 |
| 6 | 6 | 9,23 | 14,33 | 10,67 |

**Seed:** PRNG ditarik tepat 18 kali, dengan urutan tetap:

| Tarikan | Isi |
| --- | --- |
| 1 | Fase: posisi puncak terhadap tengah layar |
| 2 | Condong: puncak bergeser dari lapisan belakang ke depan sampai ±1 gelombang |
| 3 | Taper: jarak antarlapisan merapat ke belakang atau ke depan (±0,4) |
| 4 | Depan: garis tengah lapisan depan, dari tepat di atas tepi bawah sampai 40% garis tengah belakang |
| 5 | Tumpukan: tinggi seluruh tumpukan, antara batas bawah dan batas atas |
| 6 | Perspektif: amplitudo lapisan belakang 40–90% amplitudo depan |
| 7–18 | Geser fase ±0,25 gelombang untuk 12 slot. Belakang memakai slot 1 dan depan slot 2 |

Geometri tidak bergantung pada warna atau varian (MODE-01).

## Aturan potret dan batas atas (DEV-05)

- **Batas bawah:** lembah lapisan belakang tidak pernah turun di bawah 30% tinggi kanvas, di kanvas apa pun. Jadi 30% bagian bawah selalu tertutup gelombang.
- **Batas atas:** sama dengan hills. Titik tertinggi maksimal min(70% tinggi, 50% sisi terpanjang): 50% di potret dan persegi, sehingga setengah atas tetap kosong untuk jam, dan 70% di layar ≥ 1,4:1.
- **Mengapa selalu terpenuhi:** puncak lapisan belakang adalah titik tertinggi semua lapisan, dan titik kendali setiap potongan berada di antara tinggi kedua ujungnya.

Pengukuran di kode akhir mencakup:

- **Ukuran:** 17 preset potret Lampiran A; 5 ukuran Custom potret (320×7680, 1644×3840, 320×400, 1000×1001, 7679×7680); serta 2752×2064, mba-13, desk-uw, desk-5k, 3840×1080, 7680×320, dan 1000×1000.
- **Seed:** 303 seed (1–300, `senja-teduh-42`, `603`, dan `965`).
- **Parameter:** 117 set, yaitu `layers` 3–12 × `amplitude` 0 / 0,4 / 1 × `frequency` 1 / 2 / 6, ditambah setiap langkah `amplitude` dan setiap `frequency`.

| Kanvas | Lembah belakang terendah | Titik tertinggi | Batas atas |
| --- | --- | --- | --- |
| Potret, persegi, dan 1000×1001 | 30,009–30,020% | 49,933–49,967% | 50% |
| 2752×2064 (4:3) | 30,027% | 66,576% | 66,67% |
| Lanskap ≥ 1,4:1 | 30,030% | 69,898% | 70% |

Lembah depan selalu minimal 2,002% sisi terpendek di atas tepi bawah. Semua titik kendali ikut diperiksa.

## Batas 48 gelombang (ENG-07)

**Pengukuran pertama, sebelum ada batas.** Dengan perintah `S`, Custom 7680×320 di parameter maksimum (12; 1; 6) berisi 144 gelombang × 12 lapisan, yaitu 6.924 potongan, dan file 204 KB. Di Chromium dengan CPU 6× lebih lambat:
- Median 19–34 ms.
- Satu render per frame: 0–7 dari 300 frame di atas 100 ms, terlama 494 ms.
- 50 render beruntun: terlama 261–678 ms.

Sekitar 82% waktunya habis untuk memformat angka dan menyusun string path. Sesuai instruksi, pekerjaan dihentikan sebelum commit, dan FaL memilih solusi A.

**Solusi A.** Panjang gelombang = max(sisi terpendek / `frequency`, lebar / 48).
- Batas ini hanya aktif pada strip lebih dari 8:1 di `frequency` 6, lebih dari 12:1 di `frequency` 4, dan lebih dari 16:1 di `frequency` 3. Di `frequency` 1–2 tidak pernah aktif, karena DEV-04 maksimal 24:1.
- Tidak ada satu pun dari 28 preset Lampiran A yang terdampak (paling lebar desk-uw, 2,39:1). Tes memeriksa ini di semua `frequency` untuk ke-28 preset, ditambah tablet yang diputar (4:3) dan layar 32:9.
- **Harganya:** di strip seperti itu gelombang lebih panjang dari bentuk aslinya. Di 7680×320 `frequency` 6, isinya 48 gelombang, bukan 144, sehingga 3× lebih panjang. Ini penyimpangan kecil dari DEV-05, khusus di ukuran Custom ekstrem.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | ✅ 0 error, 0 peringatan |
| `npm run lint` | ✅ bersih |
| `npm test` (unit) | ✅ 397 lulus: 61 tes waves, 56 snapshot waves, dan 280 tes lama yang tidak berubah |
| `npm test` (Playwright, `tests/home.e2e.ts`) | ✅ 1 lulus. Di container, Chromium bawaan disambungkan lewat config sementara di luar repo |
| `npm run build` | ✅ berhasil |

Isi tes waves:

- **Modul dan warna:**
  - Skema persis katalog (langkah 1 / 0,05 / 1).
  - Satu warna per lapisan.
  - Urutan warna ENG-11, lapisan belakang lebih dulu, untuk palet 1, 3, dan 5 warna di kedua varian.
- **MODE-01:** Terang = Gelap setelah warna disamarkan, dan geometri tetap saat palet atau latar diganti.
- **ENG-02:** tepat 18 tarikan PRNG di semua parameter dan ukuran Custom ekstrem.
- **Isi SVG:**
  - Hanya `rect` dan `path` dengan atribut presentasi.
  - Maksimal 2 desimal, tanpa angka negatif, dan hanya perintah M, L, C, S, dan Z.
  - Tiap lapisan tertutup di tepi bawah, dan tidak ada titik di luar kanvas.
  - `S` hanya dipakai di potongan tengah, dan titik kendali yang dihilangkan memang cerminan titik sebelumnya.
- **Proporsi:**
  - Ukuran 2× menghasilkan geometri tepat 2×.
  - Panjang gelombang = sisi terpendek / f, dan batas 48 gelombang tidak aktif di ke-28 preset Lampiran A.
  - Layar 2× lebih lebar menambah gelombang di kedua sisi tanpa mengubah yang di tengah.
  - Setiap gelombang berulang tepat satu kali per panjang gelombang.
  - Batas 30% dan batas atas berlaku di 17 preset potret, 5 Custom potret, serta di lanskap dan persegi.
  - Lembah depan minimal 2% sisi terpendek di atas tepi bawah.
- **Parameter:**
  - `layers` mempertahankan gelombang belakang dan depan.
  - `amplitude` membesarkan setiap gelombang dari 3% ke 18% sisi terpendek tanpa menggeser ke samping.
  - `frequency` hanya mengubah panjang gelombang.
  - Titik kendali tetap di antara tinggi ujung potongannya, kurva ≤ 1% dari gelombang eksak, dan tidak ada potongan yang lebih sempit dari 0,001 gelombang.
- **Visibilitas:** di puncaknya, setiap lapisan lebih tinggi dari semua lapisan di depannya minimal (1 − `TAPER`)/11 × ((1 − `FRONT_MAX`)·0,3 − `AMP_MAX`·(1 − `FADE_MIN`)·(1 + `SHARP`)) = **0,63% tinggi kanvas**. Dicek di seed 1–300.
- **Dominasi:** di parameter awal, seed 1–30, dan 6 preset, tidak ada lapisan di atas 50% luas pola.
- **Seed:**
  - Batas variasi hills di 6 preset.
  - Ketujuh sumbu seed bergerak ke dua arah.
  - Garis tengah depan tidak pernah melewati 40% garis tengah belakang.
- **ENG-07:** desk-5k dan strip 7680×320 di parameter maksimum, median < 50 ms.

Tes waves berjalan sekitar 20 detik (hills sekitar 10 detik). Tes terlama 2,4 detik, jauh di bawah batas 5 detik per tes.

**Uji mutasi.** Tiga belas perubahan kode yang sengaja salah, semuanya tertangkap tes:

1. Batas bawah belakang 10% lebih longgar.
2. `CAP` 0,52.
3. `MAX_WAVES` 49.
4. Tanpa pemindahan titik ke tepi.
5. `S` juga di potongan penuh pertama.
6. Lapisan depan memakai slot sendiri.
7. `FRONT_MAX` 0,5.
8. `SHARP` 0,25, melewati batas titik kendali.
9. `TAPER` 0,8.
10. Lengan kendali 10% lebih panjang.
11. Panjang gelombang dari tinggi kanvas.
12. `BOTTOM` 0.
13. `BOTTOM` 0,019.

Mutasi 7 dan 12 awalnya lolos. Karena itu ditambahkan cek garis tengah depan ≤ 40% dan tes jarak lembah depan ≥ 2%. Setelah itu keduanya tertangkap, begitu juga mutasi 13.

## Variasi seed (PAT-10)

Metriknya sama dengan hills (grid 40 kolom, seed 1–30, 435 pasangan), diukur pada kurva yang tergambar. Batasnya juga sama dengan hills: median ≥ 0,45, pasangan termirip ≥ 0,1, dan maksimal 2% (8 pasangan) di bawah 0,2.

| Preset, parameter awal | Median | Termirip | Di bawah 0,2 | Di bawah 0,3 |
| --- | --- | --- | --- | --- |
| and-fhd20 | 0,536 | 0,142 | 3 | 32 |
| ios-63 | 0,536 | 0,134 | 2 | 31 |
| ipad-pro-13 | 0,520 | 0,202 | 0 | 7 |
| mba-13 | 0,621 | 0,231 | 0 | 2 |
| desk-uw | 0,622 | 0,212 | 0 | 4 |
| desk-5k | 0,617 | 0,218 | 0 | 3 |

- **Hasil:** semua preset lulus. Median lebih tinggi dari hills (0,494–0,521).
- **Margin tersempit:** pasangan termirip di ios-63, 0,134 terhadap batas 0,1. Pasangan termirip di semua preset adalah seed 11 dan 18, serta 20 dan 28.
- **Kestabilan:** di 10 jendela seed (1–30, 31–60, …, 271–300), 58 dari 60 jendela lulus. Di jendela 151–180, ada 11 pasangan di bawah 0,2 di and-fhd20 dan 9 di ios-63, di atas batas 8. Median dan pasangan termirip lulus di semua jendela: median ≥ 0,520 dan termirip ≥ 0,119.

**Titik lemah, tidak diuji dengan batas ini:**

| Kasus | Median | Termirip | Di bawah 0,2 |
| --- | --- | --- | --- |
| `layers` 3 | 0,314–0,403 | 0,073–0,110 | 17–73 |
| `amplitude` 0 | 0,544–0,657 | 0,063–0,108 | 6–15 |
| `layers` 12 | 0,670–0,725 | ≥ 0,284 | 0 |
| `amplitude` 1 | 0,537–0,649 | ≥ 0,230 | 0 |

Metrik grid 40 kolom hampir tidak bisa melihat `frequency`. Hasil `frequency` 6 hampir sama dengan `frequency` 2, karena untuk pola yang berulang teratur, kolom-kolomnya hanya bertukar urutan. `frequency` bukan sumbu seed, jadi efeknya dites terpisah.

## Visibilitas dan dominasi

**Visibilitas.** Batas tesnya 0,63% tinggi kanvas: 15 px di and-fhd20 dan 10 px di mba-13. Hasil terukur, untuk seed 1–300 di 29 kanvas:

- **Langkah puncak terkecil:** 1,040% tinggi, di 1000×1000, seed 24, `layers` 12, `amplitude` 1.
- **Ketebalan tertipis yang terlihat** (diukur di parameter awal di semua kanvas, dan di `layers` 12 untuk and-fhd20 dan mba-13): 1,400% tinggi, yaitu 33,6 px di and-fhd20 (seed 150, `layers` 12, `amplitude` 0, `frequency` 6). Di mba-13 `layers` 12: 24,3 px.
- **Parameter awal (6 lapisan):** minimal 89,5 px di and-fhd20 (3,7%), 70,1 px di mba-13 (4,2%), dan 121,4 px di desk-5k (4,2%).

**Dominasi** (luas terlihat tiap lapisan dibagi luas seluruh pola, 400 kolom, seed 1–30):

| Kasus | Seed dengan lapisan > 50% | Lapisan terbesar | Median lapisan terbesar |
| --- | --- | --- | --- |
| Parameter awal | 0 di keenam preset | 38,4–39,2% | 23,5–25,6% |
| `layers` 12, `amplitude` 0 / 1, `frequency` 1 / 6 | 0 | paling banyak 40,0% | 22,7–29,0% |
| `layers` 3 | 3–4 per preset: seed 12 dan 14 (lapisan tengah), seed 15 dan 30 (lapisan belakang) | 51,6–54,2% | 42,0–44,2% |

Dengan 3 lapisan, rata-ratanya sudah 33% per lapisan, jadi `layers` 3 kucatat sebagai titik lemah, sama seperti di variasi seed.

## Waktu render dan ukuran file (ENG-07: ≤ 50 ms laptop, ≤ 100 ms ponsel)

| Kasus | Node, median 50 render | Node, terlama dari seed 1–200 | Chromium CPU 4×: median / terlama dari seed 1–200 | Chromium CPU 6×: median / terlama dari seed 1–200 | SVG seed 42 | SVG terbesar dari seed 1–200 |
| --- | --- | --- | --- | --- | --- | --- |
| desk-5k, nilai awal (6; 0,4; 2) | 0,11–0,26 ms | 1,9 ms | 0,1–0,4 / 2,5–3,2 ms | 0,05–0,06 / 3,5–3,6 ms | 3,5 KB | 3,6 KB |
| desk-5k, maksimum (12; 1; 6) | 0,45–0,58 ms | 1,7 ms | 1,1–1,2 / 8,7–9,0 ms | 1,7–1,8 / 6,5–10,7 ms | 17,0 KB | 17,4 KB |
| Custom 7680×320, nilai awal | 0,65 ms | 3,5 ms | 2,2–2,3 / 7,9–14,2 ms | 3,5–3,6 / 6,7–10,1 ms | 33,9 KB | 34,3 KB |
| Custom 7680×320, maksimum | 1,7 ms | 8,0 ms | 5,3–6,8 / 8,8–19,3 ms | 6,9–8,4 / 24,5–28,4 ms | 67,2 KB | 68,1 KB |

- **Kesimpulan:** semua jauh di bawah batas ENG-07.
- **Satu render per frame** (seperti slider, 300 frame), di 7680×320 maksimum dengan CPU 6× lebih lambat: median 7,9–9,0 ms dan terlama 20–24 ms. Hills di ukuran yang sama: median 3,2–3,6 ms dan terlama 15–18 ms.
- **Anomali yang kucatat apa adanya:**
  - Totalnya ada 28 putaran pengukuran Chromium (CPU 6×) di 7680×320 maksimum dengan batas 48 gelombang, sekitar 10.000 render.
  - Render di atas 100 ms hanya muncul di satu kelompok enam putaran berurutan (tiga per frame dan tiga per seed), tepat setelah keputusan A. Di kelompok itu, 7 dan 2 dari 300 frame melewati 100 ms (terlama 259 ms dan 123 ms), dan satu render per seed mencapai 244 ms.
  - Di 22 putaran lain, sebelum dan sesudah kelompok itu, render terlamanya 20–42 ms. Ini termasuk pengulangan dalam kondisi yang sama dengan hills sebagai kontrol.
  - Tiga putaran yang direkam dengan trace Chromium tidak punya render di atas 36 ms, jadi lonjakan itu tidak bisa diperiksa dengan trace.
  - Selama pengukuran, mesin virtual container kehilangan sekitar 4% waktu CPU ke host (steal time). Penyebab pasti lonjakan tidak kutemukan. Ukuran file dan median di kelompok itu sama dengan putaran normal.
- **Metode:** angka Node diambil dari `npm run preview:pattern -- waves` dan skrip ukur di luar repo. Angka Chromium memakai bundel engine + waves yang di-minify, dengan `Emulation.setCPUThrottlingRate`.
- **Ukuran kode** (rolldown, minify, sama untuk keduanya): engine + waves 6.168 B atau 3.128 B gzip; engine + hills 6.312 B atau 3.218 B gzip. JavaScript awal Home dan Create belum berubah, karena belum ada rute yang memuat pola.
- **Sumber angka:** container dan Chromium headless, bukan perangkat asli.

## Pratinjau

Semua pratinjau dibuat dengan `npm run preview:pattern -- waves`, memakai palet dan latar contoh Lampiran B:

- [pratinjau-seed-42.png](pratinjau-seed-42.png): seed 42 di 6 preset perwakilan, Terang dan Gelap.
- [variasi-seed.png](variasi-seed.png): seed 1–8 di and-fhd20 dan mba-13, Terang dan Gelap.
- [parameter.png](parameter.png): and-fhd20 seed 42 dengan `layers` 3 / 6 / 12, `amplitude` 0 / 0,4 / 1, dan `frequency` 1 / 2 / 6, Terang dan Gelap.

File SVG-nya tidak di-commit; skrip menulisnya ke `previews/waves/`, yang di-gitignore.

## Yang belum diuji

- Perangkat asli (laptop dan ponsel kelas menengah).
- Membuka SVG hasil ekspor di Figma, Illustrator, dan Inkscape. Perintah `S` adalah perintah path SVG standar, tapi impornya belum dicoba.
- Tampilan di bawah overlay jam lock screen, karena overlay belum dibuat.
- Tampilan strip Custom di atas 8:1, tempat batas 48 gelombang aktif. Tidak ada pratinjaunya, karena skrip pratinjau hanya memakai preset.

## Catatan

- **Link berbagi (Lampiran B):** nilai di antara langkah, misalnya `layers:3.5`, membuat `resolveColors` gagal, karena jumlah warnanya bukan bilangan bulat. Ini berlaku juga untuk arcs dan hills. Ingat saat mengerjakan pembaca link: Lampiran B baru mengatur nilai di luar rentang (dipotong ke batas), belum nilai di antara langkah.
- **Kemiripan dengan pola lain:** pada `amplitude` rendah di ponsel, waves mirip garis bergelombang sejajar. Kemiripannya lebih dekat ke pola masa depan `wavy-stripes` (#71) daripada ke hills. Bedanya, waves berupa lapisan terisi di bagian bawah layar.
- **Skrip pratinjau** membutuhkan Chromium dari Playwright (`npx playwright install chromium` sekali). Di container, Chromium bawaan disambungkan lewat path browser sementara di luar repo.
- **Prototipe:** angka di rencana diukur pada prototipe di luar repo. Angka di laporan ini diukur ulang pada kode akhir. Variasi seed, dominasi, batas potret, dan langkah puncak terkecil sama sampai 3 desimal.
