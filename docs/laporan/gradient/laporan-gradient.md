# Laporan: pola `gradient` (PAT-01)

Branch `claude/project-thread-njwnls`, dari main `d96d138`. FaL menyetujui rencana revisi 2 dengan pilihan 1a, 2b, 3a, 4a, 5a, 6a, 7a, dan 8a, termasuk batas variasi seed yang diusulkan:

1. `colorCount` tetap 5.
2. Latar menjadi salah satu ujung gradasi.
3. `angle` mengikuti konvensi CSS, dengan langkah 1.
4. `spread` adalah lebar zona peralihan.
5. `angle` di radial menggeser titik fokus, dan titik fokus selalu di dalam lingkaran.
6. Jumlah tarikan seed tetap, sama untuk linear dan radial.
7. Stop antara dihitung di OKLCH.
8. ID gradien diambil dari hash isinya.

Dua tambahan dari FaL saat menyetujui: pratinjau 6 preset untuk radial juga, dan catatan dithering serta uji banding untuk EXP-01 (lihat [Catatan](#catatan)).

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| 1 `201617a` | `src/lib/patterns/gradient.ts` (baru) | Modul pola: skema persis katalog, `colorCount` 5, `layout()` murni (garis atau lingkaran gradien dan 6 posisi stop dari ukuran, parameter, dan 9 tarikan PRNG), `stops()` (stop antara OKLCH), dan `generate()`. 10 konstanta. | PAT-01, PAT-02, PAT-04, PAT-09, ENG-01–ENG-07, ENG-11, MODE-01, DEV-05 |
| 1 | `tests/patterns/gradient.test.ts` (baru) | 65 tes, rinciannya di bawah. | PAT-10, ENG-07 |
| 2 `f73733e` | `tests/fixtures/snapshot-patterns.ts`, `tests/engine/__snapshots__/gradient/` | 3 seed bersama × 6 preset × Terang dan Gelap (36 file), ditambah 14 kasus khusus di `ios-63` dan `mba-13` Terang (28 file). | ENG-08 |
| 3 `f5b93cb` | `scripts/preview-pattern.js` | Argumen opsional `key=value` yang mengunci parameter di semua set pratinjau, misalnya `type=radial`. Hasilnya ditulis ke `previews/<id>/<key>-<value>/`. | PAT-10 |
| 4 | `docs/laporan/gradient/` | Laporan ini dan 7 gambar. | PAT-10, ENG-07 |

Yang tidak disentuh:

- Engine, palet, arcs, hills, waves, fixture preset, PRD, katalog, dan AGENTS.md.
- Versi engine tetap 1.
- Snapshot mock, arcs, hills, dan waves tidak berubah.
- Tanda ✅ di katalog menunggu persetujuan pratinjau.

---

## Bentuk dan parameter

- **Isi SVG:**
  - `<defs>` berisi satu `linearGradient` atau `radialGradient` dengan `gradientUnits="userSpaceOnUse"` dan koordinat piksel.
  - Di dalamnya ada 21 `stop`: 6 stop utama ditambah 3 stop antara OKLCH di setiap pasangan.
  - Setelah itu satu `rect` seukuran kanvas dengan `fill="url(#id)"`.
  - Tidak ada `rect` latar terpisah, karena latar sudah menjadi stop.
  - Ukurannya sekitar 1,2 KB di semua ukuran dan parameter.
- **Urutan warna (2b):** Latar, lalu warna 1 sampai 5.
  - Linear: Latar di awal garis.
  - Radial: Latar di tepi luar dan warna 5 di titik fokus.
- **Offset ditulis sebagai persen** dengan 2 desimal, misalnya `offset="37.25%"`. Resolusinya 0,01%, seratus kali lebih halus daripada pecahan 2 desimal, dan tetap memenuhi EXP-02.
- **ID** adalah `g` diikuti hash xmur3 (`hashSeed`) dalam basis 36, dihitung dari teks elemen gradien tanpa ID.

| Parameter | Arti |
| --- | --- |
| `type` linear/radial (linear) | Linear: garis lewat tengah kanvas dengan ujung di sudut terdekat dan terjauh, seperti CSS. Radial: lingkaran terkecil yang memuat keempat sudut, dengan titik fokus 0,3 jari-jari dari pusatnya. |
| `angle` 0–360 (135), langkah 1 | Konvensi CSS: 0 ke atas, searah jarum jam, diukur di piksel nyata. Linear: arah garis. Radial: arah dari pusat lingkaran ke titik fokus, sehingga warna 5 condong ke arah itu. 0 dan 360 menghasilkan SVG yang sama. |
| `spread` 0–1 (0,5), langkah 0,05 | Lebar zona peralihan, dari 25% (di nilai 0) sampai 100% (di nilai 1) panjang gradien. Linear: di luar zona, Latar dan warna 5 rata. Radial: zona selalu berakhir di titik fokus, dan di luarnya Latar rata. |

**DEV-05.** Sudut dan lingkaran diukur di piksel nyata, jadi gradien tidak direntangkan. Ukuran 2× menghasilkan geometri tepat 2× dan stop yang sama.

**Seed:** PRNG ditarik tepat 9 kali dengan urutan tetap, di kedua jenis:

| Tarikan | Isi | Dipakai di |
| --- | --- | --- |
| 1–5 | Lebar 5 celah antarstop, 0,1–1,9 relatif | Keduanya |
| 6 | Geser zona, ±75% sisa ruang | Linear |
| 7 | Kerapatan: pangkat e^±0,8 (0,45–2,23). Stop merapat ke ujung Latar atau ke ujung warna 5 | Keduanya |
| 8–9 | Titik fokus x dan y, 20–80% lebar dan tinggi | Radial |

Setelah pangkat kerapatan diterapkan, setiap celah dinaikkan menjadi minimal 5% zona. Mengganti `type` tidak mengubah sebaran relatif stop di dalam zona.

---

## Pengukuran

Prototipe yang dipakai untuk rencana menghasilkan SVG yang byte-identik dengan modul ini di 240 kombinasi seed, jenis, sudut, `spread`, dan mode. Jadi angka-angka rencana berlaku untuk modul ini.

### Variasi seed (PAT-10)

**Metrik:**

- Grid 40 kolom, dengan jumlah baris mengikuti rasio layar.
- Warna tiap sel dihitung dengan model interpolasi sRGB seperti browser, memakai offset seperti yang tertulis di SVG.
- Model ini dicek terhadap piksel Chromium: selisihnya ≤ ΔE 0,0042.
- Jarak dua seed adalah rata-rata ΔE OKLab per sel, dari 30 seed (435 pasangan).

**Batas yang disetujui dan dites:** di `spread` 0 / 0,5 / 1, kedua jenis, dan 6 preset, median ≥ 0,10 dan pasangan di bawah 0,03 ≤ 5%. Minimum ≥ 0,015 hanya di `spread` 0,5. Ketiga batas lulus di semua 36 kombinasi.

| Parameter awal | Linear | Radial |
| --- | --- | --- |
| Median | 0,125–0,127 ✅ | 0,171–0,189 ✅ |
| Minimum | 0,018–0,019 ✅ | 0,027–0,035 ✅ |
| Pasangan < 0,03 | 3,9–4,6% ✅ | 0–0,2% ✅ |

### Stop antara OKLCH (7a)

- Di Chromium (and-fhd20, `angle` 90, Lampiran B), ΔE terbesar terhadap gradien OKLCH yang tepat turun dari 0,021 menjadi 0,0073 di Terang, dan dari 0,018 menjadi 0,0057 di Gelap.
- Palet monokrom dan duotone ≤ 0,002.
- Palet primer jenuh tetap meleset sampai 0,139, karena chroma hasil `gamutMap` anjlok di dekat biru murni.

### Banding di desk-5k

- **Teori tanpa dithering:** satu tingkat 8 bit selebar paling banyak 11–12 px di `spread` 0, 28–31 px di `spread` 0,5, dan 45–49 px di `spread` 1.
- **Diukur di Chromium** lewat SVG → `img` → canvas, seperti EXP-01:
  - Chromium memberi dithering pada gradien. Satu kolom gradien mendatar berisi 2–3 warna berbeda.
  - Deretan piksel identik terpanjang di dalam zona hanya 4–8 px.
  - Lompatan antarpiksel bertetangga paling banyak 2 tingkat.
- **Safari dan Firefox belum dites.**

### Waktu render (ENG-07)

`npm run preview:pattern`, desk-5k, median dari 50 render:

| Jenis | Parameter awal | `angle` 360, `spread` 1 | Ukuran |
| --- | --- | --- | --- |
| Linear | 0,083 ms | 0,071 ms | 1.205 / 1.192 B |
| Radial | 0,091 ms | 0,075 ms | 1.221 / 1.217 B |

Batasnya 50 ms. Jumlah elemennya tetap di semua ukuran dan parameter. Waktu cat browser dan waktu di ponsel tidak diukur.

---

## Tes (65)

| Kelompok | Isi |
| --- | --- |
| Modul | Baris katalog, `colorCount` 5 di semua parameter |
| Warna | Latar lalu warna 1–5 berurutan untuk palet 1, 2, 3, dan 5 warna, Latar Otomatis dan Manual, Terang dan Gelap; 3 stop antara `gamutMap(mixOklch)` di setiap pasangan |
| MODE-01 | Terang dan Gelap: geometri dan offset sama; ID berbeda (lihat [Penyimpangan](#penyimpangan-dari-rencana)); geometri tetap saat palet atau latar berganti |
| ENG-02 | Tepat 9 tarikan di kedua jenis dan semua parameter; sebaran stop di zona tetap saat `type` berganti |
| SVG | Hanya `defs`, gradien, 21 `stop`, dan `rect` dengan atribut presentasi; angka ≤ 2 desimal di 28 preset dan 3 ukuran Custom; ID = hash isi; `angle` 0 = 360 |
| Geometri | Linear: arah CSS, lewat tengah, sudut terdekat dan terjauh tepat di ujung (28 preset + Custom × 25 sudut). Latar di bawah untuk 0, kiri untuk 90, kanan untuk 270, kiri atas untuk 135. Radial: fokus 0,3·r ke arah sudut dan di 20–80% kanvas (200 seed × 6 sudut), lingkaran memuat semua sudut kanvas dan sudut terjauh tepat di garisnya (50 seed × 25 sudut). Ukuran 2× menghasilkan geometri 2× |
| `spread` | Zona tepat 0,25 + 0,75·spread di 21 langkah × 100 seed; zona di dalam [0, 1]; radial berakhir di fokus; setiap celah ≥ 5% zona |
| Variasi seed | 36 kasus: 6 preset × 2 jenis × `spread` 0 / 0,5 / 1, dengan batas di atas |
| Ujung sumbu seed | Tarikan tengah memberi stop rata; geser ±75% di linear dan tanpa efek di radial; kerapatan e^±0,8; celah 0,1–1,9; fokus 20% dan 80% |
| ENG-07 | desk-5k di kedua jenis, median < 50 ms |

Snapshot khusus (ENG-08):

- radial dengan seed `1`, `42`, dan `senja-teduh-42`
- seed `53` (zona linear bergeser ke ujung Latar dan stop merapat ke sana) dan seed `2875` (kebalikannya)
- `angle` 0, 90, dan 270
- `spread` 0 dan 1
- radial `angle` 0 dan 270
- radial `spread` 0 dan 1

## Uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | 0 error, 0 peringatan |
| `npm run lint` | Bersih |
| `npm test` | 535 tes unit (65 gradient, 64 snapshot gradient) dan 1 tes Playwright lulus |
| `npm run build` | Berhasil |
| `npm run preview:pattern -- gradient` dan `-- gradient type=radial` | 2 × 3 lembar pratinjau |

Di lingkungan sesi ini, `npx playwright install chromium` diblokir jaringan. Tes Playwright dan skrip pratinjau dijalankan dengan `PLAYWRIGHT_BROWSERS_PATH` yang menunjuk ke Chromium yang sudah terpasang (revisi 1243, bukan 1248 yang diminta `@playwright/test` 1.64). Repositori tidak diubah untuk ini.

---

## Pratinjau

Palet dan latar Lampiran B, seed 42 kecuali disebut lain.

- [pratinjau-linear-seed-42.png](pratinjau-linear-seed-42.png) dan [pratinjau-radial-seed-42.png](pratinjau-radial-seed-42.png): 6 preset perwakilan, Terang dan Gelap.
- [variasi-seed-linear.png](variasi-seed-linear.png) dan [variasi-seed-radial.png](variasi-seed-radial.png): seed 1–8 di and-fhd20 dan mba-13.
- [parameter-linear.png](parameter-linear.png) dan [parameter-radial.png](parameter-radial.png): setiap parameter di nilai minimum, awal, dan maksimum di and-fhd20 (`type` di lembar linear).
- [jenis-palet.png](jenis-palet.png): Lampiran B, monokrom gelap, monokrom terang, duotone, dan 5 warna jenuh. Lembar ini dibuat dengan skrip prototipe yang hasilnya identik, bukan dengan `preview:pattern`.

Lembar seed dan 6 preset diperkecil menjadi 60% supaya ukuran file wajar.

---

## Penyimpangan dari rencana

1. **ID gradien Terang dan Gelap berbeda.** Rencana menulis bahwa ID sama di kedua mode. Itu keliru: ID dihitung dari isi gradien, termasuk warnanya, dan memang harus berbeda. Bila sama, preview Berdampingan yang menampilkan kedua varian di satu halaman akan memakai gradien yang sama untuk keduanya. Tes MODE-01 kini memeriksa bahwa geometri dan offset sama, dan ID berbeda.
2. **Skrip pratinjau diubah** (commit 3) supaya pratinjau radial di 6 preset bisa dibuat dengan `type=radial`, sesuai permintaan FaL. Tanpa argumen, keluarannya sama seperti sebelumnya.
3. **Dua seed snapshot khusus** dipilih dari 5.000 seed: `53` dan `2875`, yang paling dekat ke ujung sumbu geser dan kerapatan.

---

## Titik lemah

1. **Linear `spread` 0:** satu sisi bisa rata sampai sekitar 66% garis (Latar atau warna 5). Pasangan seed terdekat 0,008.
2. **Linear `spread` 1:** pasangan seed terdekat 0,005, dan Latar hanya terlihat di satu sudut. Median 0,107–0,108 dan 4,1–4,8% pasangan di bawah 0,03, keduanya tipis di atas batas.
3. **Radial `spread` 0:** cahaya kecil di atas Latar, sehingga sebagian besar layar polos ([parameter-radial.png](parameter-radial.png)).
4. **`angle` di radial lemah:** perubahan 15° hanya bernilai ΔE 0,020–0,025, dibanding 0,043–0,056 di linear.
5. **Cincin dan garis gelap:** warna gelap di antara warna terang (navy di Lampiran B) membentuk cincin di radial dan garis di linear. Ini bergantung pada palet.
6. **Monokrom dengan warna gelap:** tingkat ENG-11 bergerak ke arah terang, jadi urutan Latar → warna 1 (gelap) → makin terang tidak searah. Hasilnya pita gelap di dekat ujung Latar ([jenis-palet.png](jenis-palet.png)). Monokrom terang tetap searah.
7. **Palet primer jenuh:** stop antara masih bisa meleset ΔE 0,14 dari OKLCH tepat.

---

## Catatan

Untuk diingat saat mengerjakan ekspor PNG (EXP-01):

- **Uji banding di Safari dan Firefox.** Chromium memberi dithering pada gradien, jadi PNG desk-5k-nya bebas pita: deretan piksel identik terpanjang hanya 4–8 px. Safari dan Firefox belum dites. Bila keduanya tidak memberi dithering, `spread` 1 di desk-5k bisa menghasilkan pita selebar 45–49 px per tingkat warna, paling terlihat di gradien gelap berchroma rendah (varian Gelap di dekat Latar). Ujinya perlu jalur EXP-01 yang sebenarnya (SVG → canvas → `toBlob`) di kedua browser.
- **Usulan dithering saat ekspor PNG.** Di dalam SVG tidak ada cara ringan tanpa filter. Noise butuh `feTurbulence` (dilarang ENG-06) atau ribuan elemen kecil (ukuran file dan ENG-07), dan menambah stop tidak membantu kuantisasi 8 bit. Bila uji di atas menemukan banding, ekspor PNG bisa menambah dithering ±0,5 tingkat ke `ImageData` setelah SVG digambar ke canvas dan sebelum `toBlob`. Ini perilaku baru yang tidak ada di PRD, jadi perlu keputusan FaL dan mungkin catatan di PRD sebelum dikerjakan. Hasil engine dan snapshot tidak berubah karenanya.

## Belum diuji

- Banding dan tampilan di Safari dan Firefox.
- Waktu render dan cat di ponsel kelas menengah (ENG-07, ≤ 100 ms). Yang diukur hanya `render()` di Node.
- Pemeriksaan visual pratinjau oleh FaL. Tanda ✅ di katalog menunggu persetujuan itu.
