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

Setelah meninjau pratinjau, FaL meminta **batas kecuraman**: tinggi gelombang dari puncak ke lembah paling banyak sekitar 0,6× panjang gelombangnya, tanpa mengubah `frequency` 1–3. Semua angka di laporan ini sudah mengikuti revisi itu kecuali bila disebut lain; rinciannya ada di [Revisi setelah pratinjau](#revisi-setelah-pratinjau-batas-kecuraman).

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| 1 `2cde270` | `src/lib/patterns/waves.ts` (baru) | Modul pola: skema persis katalog, `colorCount = layers`, `layout()` murni (garis tengah, amplitudo, dan fase tiap gelombang dari ukuran, parameter, dan 18 tarikan PRNG), `curve()` (kurva Bézier per seperempat gelombang, dipotong di tepi kanvas), dan path dengan `S` untuk potongan tengah. 15 konstanta. | PAT-01, PAT-02, PAT-04, PAT-09, ENG-01–ENG-07, ENG-11, MODE-01, DEV-05 |
| 1 | `tests/patterns/waves.test.ts` (baru) | 61 tes (69 setelah commit 5, 70 setelah commit 7), rinciannya di bawah. | PAT-10, ENG-07 |
| 2 `20019b6` | `tests/fixtures/snapshot-patterns.ts`, `tests/engine/__snapshots__/waves/` | `waves` masuk snapshot: 3 seed bersama × 6 preset × Terang dan Gelap (36 file), ditambah 10 kasus khusus di `ios-63` dan `mba-13` Terang (20 file). | ENG-08 |
| 3 `4f2c92c` | `tests/patterns/waves.test.ts` | Tes batas 48 gelombang kini mencakup ke-28 preset Lampiran A. Sebelumnya lima preset laptop dan desktop terlewat, temuan saat memeriksa laporan ini. | ENG-07, DEV-05 |
| 4 `f21caf5` | `docs/laporan/waves/` | Laporan ini dan tiga pratinjau PNG. | PAT-10, ENG-07 |
| 5 `3b2e027` | `src/lib/patterns/waves.ts`, `tests/patterns/waves.test.ts` | Setelah verifikasi independen: 8 tes rng tiruan, cek `amplitude` di setiap langkah, komentar yang dibetulkan, serta nama `wavelength`, `frontAmp`, dan `backAmp`. Hasil SVG tidak berubah. | PAT-04, PAT-10 |
| 6 `3dea333` | `docs/laporan/waves/laporan-waves.md` | Laporan dibetulkan setelah verifikasi independen. | |
| 7 `018ab2c` | `src/lib/patterns/waves.ts`, `tests/patterns/waves.test.ts`, 4 snapshot waves | Revisi: batas kecuraman `STEEP` 0,6 (konstanta ke-16), dua tes yang berubah karena kebutuhannya berubah, satu tes baru, dan 4 snapshot `frequency` 6. | PAT-10, ENG-08 |
| 8 `2a202a0` | `docs/laporan/waves/` | Laporan, `parameter.png`, dan gambar baru `kecuraman-sebelum-sesudah.png` untuk revisi. | PAT-10 |
| 9 `d52f43a` | `tests/patterns/waves.test.ts` | Batas waktu 15 detik untuk 10 tes waves yang berat (15 kasus), tanpa mengubah isi pengecekannya. | PAT-10 |
| 10 | `docs/falette-100-pattern.md`, laporan ini | Tanda ✅ di depan Waves setelah FaL menyetujui pratinjau, dan catatan batas 48 gelombang serta kecuraman di kolom Catatan baris waves. | PAT-10, ENG-07 |

Yang tidak disentuh:
- Engine, palet, arcs, hills, PRD, dan AGENTS.md.
- Katalog, kecuali baris waves: tanda ✅ dan dua catatan di kolom Catatan (commit 10).
- Skrip pratinjau: tidak perlu diubah, karena sudah mengeluarkan `frequency` 1 / 2 / 6.

Versi engine tetap 1. Snapshot mock, arcs, dan hills tidak berubah. Tanda ✅ di katalog diberikan di commit 10, setelah FaL menyetujui pratinjau sesudah revisi kecuraman.

## Bentuk dan parameter

- **Lapisan:** `layers` lapis gelombang dicat dari belakang ke depan, warna ke-1 di belakang. Isi SVG: satu `rect` latar ditambah satu `path` per lapisan, ditutup di tepi bawah.
- **Bentuk gelombang:** periodik sempurna dengan profil air `cos 2πτ + 0,2·cos 4πτ`. Puncaknya sedikit lancip dan lembahnya lebih landai. Bentuk ini sama di semua seed.
- **Cara digambar:** kurva Bézier kubik di antara titik seperempat gelombang (puncak, lembah, dan titik di tengahnya), dengan kemiringan dari rumus gelombang.
  - Potongan tepi dipotong tepat di x = 0 dan x = lebar.
  - Titik yang jatuh kurang dari 0,001 gelombang dari tepi dipindah ke tepi, supaya tidak ada potongan nyaris nol.
  - Selisih dari gelombang eksak paling banyak 0,65% tinggi gelombang di potongan seperempat gelombang, dan 0,80% di potongan tepi yang titiknya dipindah ke tepi.
- **Antar-lapisan:**
  - Semua lapisan berbagi panjang gelombang.
  - Tinggi puncak turun merata dari belakang ke depan, sehingga setiap lapisan terlihat di puncaknya.
  - Lapisan belakang lebih tenang (perspektif).
- **Perintah `S`:** mulai potongan penuh kedua, setiap potongan selebar potongan sebelumnya dan bertemu dengan kemiringan sama. Jadi titik kendali pertamanya adalah cerminan titik kendali kedua potongan sebelumnya, dan `S` boleh tidak menuliskannya.
  - Teks potongan-potongan itu sepertiga lebih pendek.
  - Seluruh teks path 21–28% lebih pendek di parameter awal, dan 29–33% di parameter maksimum.

| Parameter | Arti |
| --- | --- |
| `layers` 3–12 (6) | Jumlah lapisan. Lapisan belakang dan depan tetap; nilai ini hanya menyisipkan lapisan di antaranya. |
| `amplitude` 0–1 (0,4) | Tinggi gelombang depan dari puncak ke lembah naik merata dari 3% sisi terpendek di nilai 0 (riak kecil) sampai batas atasnya di nilai 1. Batas atas itu 18% sisi terpendek, atau 0,6× panjang gelombang bila lebih kecil: di `frequency` 1–3 tetap 18% (9% di nilai awal), di `frequency` 4 / 5 / 6 menjadi 15% / 12% / 10%. Lapisan belakang 40–90% dari gelombang depan, dipilih seed. Garis tengah ikut menyesuaikan sedikit supaya lembah belakang tetap di atas 30% dan lembah depan tetap di atas tepi bawah. Tidak ada yang bergeser ke samping. |
| `frequency` 1–6 (2) | Jumlah gelombang selebar sisi terpendek layar, maksimal 48 gelombang selebar layar. Di `frequency` 1–3 hanya panjang gelombang yang berubah. Di `frequency` 4–6, batas kecuraman juga menurunkan batas atas `amplitude`. |

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
| 4 | Depan: garis tengah lapisan depan, dari setinggi yang menjaga lembahnya 2% sisi terpendek di atas tepi bawah sampai 40% garis tengah belakang |
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

**Pengukuran pertama, sebelum ada batas.** Dengan perintah `S`, Custom 7680×320 di parameter maksimum (12; 1; 6) berisi 144 gelombang × 12 lapisan, yaitu 6.924 potongan, dan file 204 KB (di laporan ini 1 KB = 1000 B, seperti laporan hills). Di Chromium dengan CPU 6× lebih lambat:
- Median 19–34 ms.
- Satu render per frame: 0–7 dari 300 frame di atas 100 ms, terlama 494 ms.
- 50 render beruntun: terlama 261–678 ms.

Sekitar 82% waktunya habis untuk memformat angka dan menyusun string path. Sesuai instruksi, pekerjaan dihentikan sebelum commit, dan FaL memilih solusi A.

**Solusi A.** Panjang gelombang = max(sisi terpendek / `frequency`, lebar / 48).
- Batas ini aktif bila lebar dibagi tinggi lebih dari 48 / `frequency`. Artinya, strip lebih dari 8:1 di `frequency` 6, 9,6:1 di `frequency` 5, 12:1 di `frequency` 4, dan 16:1 di `frequency` 3. Di `frequency` 1–2 tidak pernah aktif, karena DEV-04 maksimal 24:1. Di kanvas potret juga tidak pernah aktif.
- Tidak ada satu pun dari 28 preset Lampiran A yang terdampak (paling lebar desk-uw, 2,39:1). Tes memeriksa ini di semua `frequency` untuk ke-28 preset, ditambah tablet yang diputar (4:3) dan layar 32:9.
- **Harganya:** di strip seperti itu gelombang lebih panjang dari bentuk aslinya. Di 7680×320, gelombangnya 3× lebih panjang di `frequency` 6 (48 gelombang, bukan 144), 2,5× di `frequency` 5, 2× di `frequency` 4, dan 1,5× di `frequency` 3. Ini penyimpangan yang disengaja dari DEV-05, terbatas pada ukuran Custom di atas 48 / `frequency` : 1.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | ✅ 0 error, 0 peringatan |
| `npm run lint` | ✅ bersih |
| `npm test` (unit) | ✅ 406 lulus: 70 tes waves, 56 snapshot waves, dan 280 tes lama yang tidak berubah |
| `npm test` (Playwright, `tests/home.e2e.ts`) | ✅ 1 lulus. Di container, Chromium bawaan disambungkan lewat config sementara di luar repo |
| `npm run build` | ✅ berhasil |

Isi tes waves:

- **Modul dan warna:**
  - Skema persis katalog (langkah 1 / 0,05 / 1).
  - Satu warna per lapisan.
  - Urutan warna ENG-11, lapisan belakang lebih dulu, untuk palet 1, 3, dan 5 warna di kedua varian.
- **MODE-01:** Terang = Gelap setelah warna disamarkan, dan geometri tetap saat palet atau latar diganti.
- **ENG-02:** tepat 18 tarikan PRNG di parameter ekstrem dan tengah, di ponsel dan ukuran Custom ekstrem. Semua tarikan terjadi sebelum parameter dipakai.
- **Isi SVG:**
  - Hanya `rect` dan `path` dengan atribut presentasi.
  - Maksimal 2 desimal, tanpa angka negatif, dan hanya perintah M, L, C, S, dan Z.
  - Tiap lapisan tertutup di tepi bawah, dan tidak ada titik di luar kanvas.
  - `S` hanya dipakai mulai potongan penuh kedua sampai sebelum potongan terakhir, dan titik kendali yang dihilangkan memang cerminan titik sebelumnya.
- **Proporsi:**
  - Ukuran 2× menghasilkan geometri tepat 2×.
  - Panjang gelombang = sisi terpendek / f, dan batas 48 gelombang tidak aktif di ke-28 preset Lampiran A.
  - Layar 2× lebih lebar menambah gelombang di kedua sisi tanpa mengubah yang di tengah.
  - Setiap gelombang berulang tepat satu kali per panjang gelombang.
  - Batas 30% dan batas atas berlaku di 17 preset potret, 5 Custom potret, serta di lanskap dan persegi.
  - Lembah depan minimal 2% sisi terpendek di atas tepi bawah.
- **Parameter:**
  - `layers` mempertahankan gelombang belakang dan depan.
  - `amplitude` membesarkan setiap gelombang di setiap langkah, di semua `frequency`, tanpa menggeser ke samping. Gelombang depan naik merata dari 3% sisi terpendek sampai 18%, atau sampai 0,6× panjang gelombang bila lebih kecil.
  - Setiap gelombang paling tinggi 0,6× panjang gelombangnya, di semua kanvas, seed, `frequency`, dan langkah `amplitude`. Di `amplitude` 1, batas ini tercapai tepat mulai `frequency` 4 (15% / 12% / 10% sisi terpendek); sampai `frequency` 3 gelombang depan tetap 18%.
  - `frequency` 1–3 hanya mengubah panjang gelombang. `frequency` 4–6 juga boleh mengecilkan gelombang, tapi fase dan urutan lapisan tetap, dan `amplitude` 0 tidak berubah.
  - Titik kendali tetap di antara tinggi ujung potongannya, kurva ≤ 1% dari gelombang eksak, dan tidak ada potongan yang lebih sempit dari 0,001 gelombang.
- **Visibilitas:** di puncaknya, setiap lapisan lebih tinggi dari semua lapisan di depannya minimal (1 − `TAPER`)/11 × ((1 − `FRONT_MAX`)·0,3 − `AMP_MAX`·(1 − `FADE_MIN`)·(1 + `SHARP`)) = **0,63% tinggi kanvas**. Dicek di seed 1–300.
- **Dominasi:** di parameter awal, seed 1–30, dan 6 preset, tidak ada lapisan di atas 50% luas pola.
- **Seed:**
  - Batas variasi hills di 6 preset.
  - Ketujuh sumbu seed bergerak ke dua arah.
  - Garis tengah depan tidak pernah melewati 40% garis tengah belakang.
- **Sumbu seed di ujung rentangnya** (rng tiruan menggantikan PRNG):
  - Profil air: puncak 1,2, lembah −0,8.
  - Fase 0 menaruh puncak lapisan belakang di tengah layar.
  - Tumpukan menurunkan lembah belakang tepat ke 30% dan menaikkan puncaknya tepat ke batas atas.
  - Depan menurunkan lembah depan tepat ke 2% sisi terpendek dan menaikkan garis tengahnya tepat ke 40% garis tengah belakang.
  - Perspektif 40% dan 90%.
  - Taper 0,304 dan 0,496 untuk lapisan 3 dari 6.
  - Condong −1 dan +1 gelombang, dengan setiap lapisan sesuai bagiannya.
  - Setiap slot hanya menggeser lapisannya sendiri sebesar ±0,25 gelombang.
- **ENG-07:** desk-5k dan strip 7680×320 di parameter maksimum, median < 50 ms.

Tes waves berjalan sekitar 20 detik (hills sekitar 10 detik). Tes terlama 2,4 detik, sekitar setengah batas 5 detik per tes. Di mesin yang sedang sibuk, tes waves dan hills sama-sama bisa melewati batas itu.

Di container baru yang dipakai untuk revisi kecuraman, mesinnya lebih lambat. Tes waves berjalan sekitar 28 detik, dan tes terlamanya 3,6–4,6 detik: batas bawah di lanskap dan persegi, yang tidak berubah oleh revisi. Tes yang sama di hills berjalan 1,1 detik di container itu.

Atas permintaan FaL (commit 9), tes waves yang berat kini punya batas waktu 15 detik, tiga kali batas bawaan, supaya tidak gagal di mesin yang lebih lambat:

- **Aturannya:** tes yang di container ini butuh lebih dari 0,5 detik, sepersepuluh batas bawaan. Jumlahnya 10 tes (15 kasus): batas bawah di lanskap dan persegi; visibilitas; skala 2×; `amplitude`; penutupan di tepi bawah; ukuran Custom potret; jarak lembah depan; perintah `S`; profil kurva; dan dominasi (6 preset).
- **Caranya:** opsi `{ timeout: 15000 }` di argumen kedua `it`, lewat satu konstanta `HEAVY`. Isi pengecekan tidak berubah: dibandingkan token demi token tanpa spasi, berkas tes identik dengan sebelumnya kecuali `HEAVY`. Prettier memindahkan argumen 4 tes bernama panjang ke baris baru, jadi isinya menjorok satu tab.
- **Bukti batasnya berlaku:** dengan batas global dipaksa 300 ms (`--testTimeout=300`), ke-15 kasus `HEAVY` tetap lulus (sampai 4,6 detik), sedangkan 19 kasus lain yang lebih dari 300 ms gagal karena waktu.
- **Yang tetap memakai batas bawaan:** 17 tes batas potret per preset (0,34–0,44 detik), MODE-01, dan `layers` (0,37–0,42 detik).

**Uji mutasi.** Ada dua putaran. Semuanya dijalankan ulang pada kode akhir, terhadap tes waves saja (tanpa snapshot).

Putaran pertama, 13 mutasi:

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

Mutasi 7 dan 12 awalnya lolos. Karena itu ditambahkan cek garis tengah depan ≤ 40% dan tes jarak lembah depan ≥ 2%.

Putaran kedua: 41 mutasi baru dari pemeriksa independen.
- 13 di antaranya lolos dari tes waves, walaupun snapshot menangkapnya. Contohnya `SHARP` 0,1, `CAP_HEIGHT` 0,65, `FADE_MIN` 0,3, `FADE_MAX` 1, `LEAN` 2, `JITTER` 0,5, `TAPER` 0,3, `BOTTOM` 0,03, slot lapisan tengah yang salah, condong yang tidak mengikuti taper, dan `amplitude` yang tidak merata.
- Penyebabnya: tes hanya mengecek batas satu arah, dan `amplitude` hanya di ujungnya. Padahal semua ini mengubah keputusan yang disetujui.
- Karena itu ditambahkan 8 tes rng tiruan yang mengunci setiap sumbu seed di ujung rentangnya, ditambah cek `amplitude` di setiap langkah.

**Hasil akhir:** 52 dari 54 mutasi tertangkap oleh tes waves saja. Dua sisanya setara, karena SVG-nya identik dengan kode asli: `k / 4 <= end` di loop titik, dan `lerp` yang ditulis sebagai a + (b − a)·t.

Putaran ketiga, untuk revisi kecuraman: 6 mutasi baru dan 3 mutasi `amplitude` lama, yang diulang karena baris `amplitude` berubah. Semuanya tertangkap (rinciannya di [Revisi setelah pratinjau](#revisi-setelah-pratinjau-batas-kecuraman)).

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
| `frequency` 4 (sesudah revisi) | 0,523–0,627 | 0,113–0,205 | 0–6 |
| `frequency` 5 (sesudah revisi) | 0,522–0,635 | 0,098–0,178 | 2–7 |
| `frequency` 6 (sesudah revisi) | 0,524–0,643 | 0,093–0,161 | 1–9 |

Metrik grid 40 kolom hampir tidak bisa melihat panjang gelombang, karena untuk pola yang berulang teratur, kolom-kolomnya hanya bertukar urutan. Sebelum revisi, hasil `frequency` 4–6 karena itu hampir sama dengan `frequency` 2. Sesudah revisi, `frequency` 4–6 juga mengecilkan gelombang, jadi variasinya melemah seperti di `amplitude` kecil. Penjelasannya ada di [Revisi setelah pratinjau](#revisi-setelah-pratinjau-batas-kecuraman).

## Visibilitas dan dominasi

**Visibilitas.** Batas tesnya 0,63% tinggi kanvas: 15 px di and-fhd20 dan 10 px di mba-13. Hasil terukur, untuk seed 1–300:

- **Langkah puncak terkecil:** 1,040% tinggi, di 1000×1000, seed 24, `layers` 12, `amplitude` 1. Diukur di 29 kanvas yang sama dengan pengukuran batas potret, dengan 7 set parameter untuk visibilitas. Pemeriksa independen mendapat angka yang sama di ke-117 set parameter batas potret.
- **Ketebalan tertipis yang terlihat** (`layers` 9 dan 12 × `amplitude` 0 / 0,4 / 1 × `frequency` 1 / 2 / 6, di 320×7680, and-fhd20, mba-13, dan 1000×1000):
  - 1,349% tinggi (103,6 px) di 320×7680, seed 24, `layers` 12, `amplitude` 0.
  - Di and-fhd20: 1,400% (33,6 px), seed 150, `layers` 12, `amplitude` 0, di `frequency` berapa pun.
  - Di mba-13: 1,460% (24,3 px).
- **Parameter awal (6 lapisan), di 29 kanvas:** minimal 89,5 px di and-fhd20 (3,7%), 70,1 px di mba-13 (4,2%), dan 121,4 px di desk-5k (4,2%).

**Dominasi** (luas terlihat tiap lapisan dibagi luas seluruh pola, 400 kolom, seed 1–30):

| Kasus | Seed dengan lapisan > 50% | Lapisan terbesar | Median lapisan terbesar |
| --- | --- | --- | --- |
| Parameter awal | 0 di keenam preset | 38,4–39,2% | 23,5–25,6% |
| Satu per satu: `layers` 12; `amplitude` 0; `amplitude` 1; `frequency` 1; `frequency` 6 | 0 | paling banyak 40,0% | 22,7–29,0% |
| Gabungan `layers` 12 × `amplitude` 0 / 1 × `frequency` 1 / 6 | 0 | paling banyak 41,4% | 21,1–28,8% |
| `layers` 3 | 3–4 per preset (gabungan semua preset: seed 12 dan 14 di lapisan tengah, seed 15 dan 30 di lapisan belakang; desk-uw: 14, 15, dan 30, yang terakhir 50,001%) | 51,6–54,2% | 42,0–44,2% |

Dengan 3 lapisan, rata-ratanya sudah 33% per lapisan, jadi `layers` 3 kucatat sebagai titik lemah, sama seperti di variasi seed.

## Waktu render dan ukuran file (ENG-07: ≤ 50 ms laptop, ≤ 100 ms ponsel)

| Kasus | Node, median 50 render | Node, terlama dari seed 1–200 | Chromium CPU 4×: median / terlama dari seed 1–200 | Chromium CPU 6×: median / terlama dari seed 1–200 | SVG seed 42 | SVG terbesar dari seed 1–200 |
| --- | --- | --- | --- | --- | --- | --- |
| desk-5k, nilai awal (6; 0,4; 2) | 0,11–0,26 ms | 1,9 ms | 0,1–0,4 / 2,5–3,2 ms | 0,05–0,06 / 3,5–3,6 ms | 3,6 KB | 3,7 KB |
| desk-5k, maksimum (12; 1; 6) | 0,45–0,58 ms | 1,7 ms | 1,1–1,2 / 8,7–9,0 ms | 1,7–1,8 / 6,5–10,7 ms | 17,4 KB | 17,8 KB |
| Custom 7680×320, nilai awal | 0,65 ms | 3,5 ms | 2,2–2,3 / 7,9–14,2 ms | 3,5–3,6 / 6,7–10,1 ms | 34,7 KB | 35,1 KB |
| Custom 7680×320, maksimum | 1,7 ms | 8,0 ms | 5,3–6,8 / 8,8–19,3 ms | 6,9–8,4 / 24,5–28,4 ms | 68,8 KB | 69,8 KB |

1 KB = 1000 B. Angka byte dari skrip pratinjau: 3.618 B dan 17.447 B untuk desk-5k seed 42. Tabel ini diukur sebelum revisi kecuraman; angka sesudahnya ada di [Revisi setelah pratinjau](#revisi-setelah-pratinjau-batas-kecuraman). Hanya baris desk-5k maksimum yang keluarannya berubah. Ketiga baris lain identik byte demi byte, termasuk Custom 7680×320 maksimum, karena di sana batas 48 gelombang membuat batas kecuraman tidak aktif.

- **Kesimpulan:** semua angka di tabel jauh di bawah batas ENG-07. Satu kelompok putaran anomali (lihat di bawah) sempat melewatinya.
- **Satu render per frame** (seperti slider, 300 frame), di 7680×320 maksimum dengan CPU 6× lebih lambat: median 7,9–9,0 ms dan terlama 20–24 ms. Hills di ukuran yang sama: median 3,2–3,6 ms dan terlama 15–18 ms.
- **Anomali yang kucatat apa adanya:**
  - Totalnya ada 28 putaran pengukuran Chromium (CPU 6×) di 7680×320 maksimum dengan batas 48 gelombang, sekitar 10.000 render.
  - Render di atas 100 ms hanya muncul di satu kelompok enam putaran berurutan (tiga per frame dan tiga per seed), tepat setelah keputusan A. Di kelompok itu, 7 dan 2 dari 300 frame melewati 100 ms (terlama 259 ms dan 123 ms), dan satu render per seed mencapai 244 ms.
  - Di 22 putaran lain, sebelum dan sesudah kelompok itu, render terlamanya 20–42 ms. Ini termasuk pengulangan dalam kondisi yang sama dengan hills sebagai kontrol.
  - Tiga putaran yang direkam dengan trace Chromium tidak punya render di atas 36 ms, jadi lonjakan itu tidak bisa diperiksa dengan trace.
  - Selama pengukuran, mesin virtual container kehilangan sekitar 4% waktu CPU ke host (steal time). Penyebab pasti lonjakan tidak kutemukan. Ukuran file dan median di kelompok itu sama dengan putaran normal.
- **Metode:** angka Node diambil dari `npm run preview:pattern -- waves` dan skrip ukur di luar repo. Angka Chromium memakai bundel engine + waves yang di-minify, dengan `Emulation.setCPUThrottlingRate`.
- **Ukuran kode** (rolldown, minify, sama untuk keduanya): engine + waves 6.199 B atau 3.142 B gzip sesudah revisi (sebelumnya 6.168 B atau 3.128 B gzip); engine + hills 6.312 B atau 3.218 B gzip.
  - Angka hills ini berbeda dari laporan hills (6,5 KB atau 3,3 KB gzip), karena metode ukurnya berbeda. Kode hills sendiri sama.
  - JavaScript awal Home dan Create belum berubah, karena belum ada rute yang memuat pola.
- **Sumber angka:** container dan Chromium headless, bukan perangkat asli.

## Pratinjau

Semua pratinjau dibuat dengan `npm run preview:pattern -- waves`, memakai palet dan latar contoh Lampiran B:

- [pratinjau-seed-42.png](pratinjau-seed-42.png): seed 42 di 6 preset perwakilan, Terang dan Gelap.
- [variasi-seed.png](variasi-seed.png): seed 1–8 di and-fhd20 dan mba-13, Terang dan Gelap.
- [parameter.png](parameter.png): and-fhd20 seed 42 dengan `layers` 3 / 6 / 12, `amplitude` 0 / 0,4 / 1, dan `frequency` 1 / 2 / 6, Terang dan Gelap. Dibuat ulang sesudah revisi kecuraman; yang berubah hanya kolom `frequency` 6.
- [kecuraman-sebelum-sesudah.png](kecuraman-sebelum-sesudah.png): seed 42 dengan `amplitude` 1 dan `frequency` 4 / 5 / 6 di and-fhd20 dan mba-13, sebelum dan sesudah revisi, Terang.

`pratinjau-seed-42.png` dan `variasi-seed.png` dibuat ulang sesudah revisi dan identik byte demi byte dengan sebelumnya, karena keduanya memakai `frequency` 2.

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
- **Prototipe:** angka di rencana diukur pada prototipe di luar repo. Angka di laporan ini diukur ulang pada kode akhir. Variasi seed, dominasi, batas potret, langkah puncak terkecil, dan ketebalan tertipis sama sampai 3 desimal.

## Verifikasi independen

Sebelum laporan ini difinalkan, kode, tes, dan laporan diperiksa oleh empat pemeriksa independen. Masing-masing menulis skrip sendiri dan bekerja di salinan repo:

- **Angka metrik:** semua angka di bagian batas potret, variasi seed, visibilitas, dominasi, dan tabel DEV-05 cocok sampai pembulatan.
- **Klaim di laporan:** commit, jumlah konstanta, urutan tarikan, jumlah tes, ukuran file, ukuran kode, cakupan preset, dan catatan `layers:3.5` cocok. Ketiga PNG bisa dibuat ulang byte demi byte.
- **Tinjauan kode:** tidak ada bug dan tidak ada pelanggaran AGENTS.md. Yang ditemukan hanya komentar yang kurang tepat dan nama yang ambigu.
- **Uji mutasi baru:** 41 mutasi baru (lihat uji mutasi di bagian Hasil uji).

Setiap temuan lalu diuji ulang oleh pemeriksa kedua yang mencoba membantahnya. Tidak ada yang terbantah, dan semuanya sudah ditindaklanjuti:

| Temuan | Perbaikan |
| --- | --- |
| Komentar kode: "puncak turun dalam garis lurus" salah karena geser per lapisan; "sepertiga lebih sedikit teks" hanya berlaku per potongan | Komentar dibetulkan. `Layout.length` diganti `wavelength`, dan amplitudo di `layout()` diberi nama `frontAmp` dan `backAmp`. Hasil SVG tidak berubah |
| Dokumen `outOfRange` di tes menyebut `high` sebagai bagian dari tinggi, padahal piksel; nama tes `amplitude` menyebut 3% ke 18% untuk setiap gelombang | Dibetulkan |
| 13 dari 41 mutasi baru lolos dari tes waves (snapshot tetap menangkapnya), padahal mengubah keputusan yang disetujui | 8 tes rng tiruan mengunci setiap sumbu seed di ujung rentangnya dan profil air, dan `amplitude` dicek di setiap langkah. Kini 52 dari 54 mutasi tertangkap; dua sisanya setara |
| Error kurva 0,66% hanya diukur di t = ¼, ½, ¾ | 0,65% di potongan seperempat gelombang, 0,80% di potongan tepi |
| Daftar rasio aktif batas 48 melewatkan `frequency` 5 | Diganti aturan umum: aktif bila lebar / tinggi > 48 / `frequency` |
| Satuan KB tercampur (SI dan 1024 B) | Semua SI, seperti laporan hills |
| "Semua jauh di bawah batas ENG-07" bertentangan dengan paragraf anomali | Dibatasi ke angka di tabel |
| Baris dominasi "`layers` 12, `amplitude` 0 / 1, `frequency` 1 / 6" terbaca sebagai gabungan | Dipisah: satu per satu, dan gabungan (paling banyak 41,4%) |
| Beberapa kalimat lain kurang tepat: `S` di "potongan tengah", "garis tengah depan dari tepat di atas tepi bawah", "penyimpangan kecil", "jauh di bawah batas 5 detik", "18 tarikan di semua parameter", daftar seed `layers` 3, dan ukuran hills yang berbeda dari laporan hills | Dibetulkan atau diperjelas |

## Revisi setelah pratinjau: batas kecuraman

**Alasan dari FaL.** Di `amplitude` dan `frequency` yang sama-sama tinggi, gelombang jadi runcing seperti api, misalnya di snapshot (12; 1; 6) di mba-13. Permintaannya:

- Tinggi gelombang dari puncak ke lembah paling banyak sekitar 0,6× panjang gelombangnya.
- `frequency` 1–3 tidak boleh berubah.
- Slider `amplitude` tetap berpengaruh di seluruh rentangnya: rentangnya menyempit di `frequency` tinggi, bukan mentok.

**Yang berubah di kode** (commit 7 `018ab2c`). Satu konstanta baru, `STEEP = 0.6`, dan satu baris di `layout()`:

- Batas atas amplitudo = min(`AMP_MAX`, `STEEP` / 2 × panjang gelombang / sisi terpendek).
- Amplitudo depan = lerp(`AMP_MIN`, batas atas, `amplitude`) × sisi terpendek.
- Jadi yang turun adalah ujung atas rentang, bukan amplitudonya yang dipotong. Setiap langkah slider tetap mengubah gelombang, dan `amplitude` 0 tetap riak 3%.
- Lapisan belakang selalu lebih kecil dari lapisan depan, jadi batas ini berlaku untuk semua lapisan.
- Sampai `frequency` 3 batas atasnya tetap `AMP_MAX`, sehingga hitungannya persis sama dengan sebelumnya. Dicek pada 57.600 render (29 kanvas, seed 1–40, `layers` 3 / 6 / 12, `amplitude` 0 / 0,05 / 0,4 / 0,65 / 1, `frequency` 1–3): semuanya identik byte demi byte dengan sebelum revisi.

Tinggi gelombang depan dari puncak ke lembah, dibagi panjang gelombang (dan sebagai bagian dari sisi terpendek), di preset mana pun:

| `frequency` | `amplitude` 0 | `amplitude` 0,4, sebelum → sesudah | `amplitude` 1, sebelum → sesudah |
| --- | --- | --- | --- |
| 1 | 0,03 (3%) | 0,09 (9%), tetap | 0,18 (18%), tetap |
| 2 | 0,06 (3%) | 0,18 (9%), tetap | 0,36 (18%), tetap |
| 3 | 0,09 (3%) | 0,27 (9%), tetap | 0,54 (18%), tetap |
| 4 | 0,12 (3%) | 0,36 → 0,312 (9% → 7,8%) | 0,72 → 0,60 (18% → 15%) |
| 5 | 0,15 (3%) | 0,45 → 0,33 (9% → 6,6%) | 0,90 → 0,60 (18% → 12%) |
| 6 | 0,18 (3%) | 0,54 → 0,348 (9% → 5,8%) | 1,08 → 0,60 (18% → 10%) |

Di strip Custom tempat batas 48 gelombang aktif, panjang gelombangnya lebih panjang, jadi batas kecuraman lebih jarang aktif. Di 7680×320 `frequency` 6, misalnya, batas ini tidak aktif sama sekali.

**Tes yang diubah.** Keduanya berubah karena kebutuhannya berubah, bukan supaya tes lulus:

| Tes | Sebelum | Sesudah | Alasan |
| --- | --- | --- | --- |
| "frequency changes the wavelength and nothing else" | `frequency` 2–6 menghasilkan lapisan yang sama persis dengan `frequency` 1 | `frequency` 2–3 tetap sama persis. Di `frequency` 4–6, fase dan urutan lapisan tetap, amplitudo boleh lebih kecil, dan `amplitude` 0 tetap sama persis | `frequency` 4–6 kini memang mengecilkan gelombang |
| "amplitude grows every wave…" | Naik merata dari 3% ke 18%, hanya di `frequency` 2 | Naik merata dari 3% ke min(18%, 0,6× panjang gelombang), dan setiap lapisan membesar di setiap langkah, di `frequency` 1–6 | Batas atas berubah. Cakupan tes ini juga lebih luas, jadi lebih ketat, bukan lebih longgar |

**Tes baru:** "keeps every wave at most 0.6 wavelengths from crest to trough". Batas ini dicek di semua kanvas tes, seed 1–20, `frequency` 1–6, dan setiap langkah `amplitude`. Tes ini juga memastikan batasnya tercapai tepat di `amplitude` 1 mulai `frequency` 4 (15% / 12% / 10%), dan sampai `frequency` 3 gelombang depan tetap 18%.

**Uji mutasi untuk revisi ini.** Semuanya tertangkap tes waves:

1. `STEEP` 0,7.
2. `STEEP` 0,5, yang ikut mengubah `frequency` 3.
3. Amplitudo dipotong di batas, bukan rentangnya disempitkan, sehingga slider mentok.
4. Batas dihitung dari `frequency`, tanpa memperhitungkan batas 48 gelombang.
5. Batas tanpa pembagian 2, yaitu 1,2× panjang gelombang.
6. Batas hanya dipasang di lapisan belakang.

Tiga mutasi `amplitude` lama (`amplitude`², `amplitude`^1,5, dan `AMP_MAX` 0,08) diulang karena barisnya berubah, dan ketiganya tetap tertangkap.

**Snapshot.** Tepat 4 dari 56 snapshot waves berubah, semuanya `frequency` 6 di varian Terang:
- `ios-63-42_frequency-6.svg`
- `ios-63-42_layers-12_amplitude-1_frequency-6.svg`
- `mba-13-42_frequency-6.svg`
- `mba-13-42_layers-12_amplitude-1_frequency-6.svg`

Dengan tes yang sudah diubah dan sebelum snapshot diperbarui, `CI=true npx vitest run` gagal tepat di 4 kasus itu, dan 402 tes lain lulus. Snapshot mock, arcs, dan hills tidak berubah.

**Dampak lain:**

- **Batas potret:** semua angka di tabel batas potret sama sampai 3 desimal.
- **Visibilitas:** langkah puncak terkecil dan ketebalan tertipis sama.
- **Dominasi:** tetap 0 seed dengan lapisan di atas 50%.
  - Di `frequency` 4 dan 5, pada `amplitude` 0,4 dan 1, lapisan terbesar 38,8–39,2%.
  - Di `frequency` 6, lapisan terbesar 38,5%.
  - Gabungan `layers` 12 × `amplitude` 0 / 1 × `frequency` 1 / 6 tetap paling banyak 41,4%.
- **Variasi seed** di parameter awal (`frequency` 2) tidak berubah. Di `frequency` 4–6 dengan `amplitude` 0,4, variasinya melemah, karena gelombangnya kini lebih kecil. Di `frequency` 6, gelombang depan 5,8% sisi terpendek, setara `amplitude` sekitar 0,19 di `frequency` 2.

| `frequency` (`amplitude` 0,4) | Median, sebelum → sesudah | Termirip terendah, sebelum → sesudah | Paling banyak di bawah 0,2, sebelum → sesudah |
| --- | --- | --- | --- |
| 4 | 0,523–0,620 → 0,523–0,627 | 0,122 → 0,113 | 3 → 6 |
| 5 | 0,522–0,621 → 0,522–0,635 | 0,132 → 0,098 (and-fhd20) | 4 → 7 |
| 6 | 0,520–0,621 → 0,524–0,643 | 0,134 → 0,093 (and-fhd20) | 3 → 9 (and-fhd20 dan ios-63) |

Batas variasi hills hanya dites di parameter awal, jadi tidak ada tes yang gagal. Tapi kalau batas itu dipakai di `frequency` 5–6, pasangan termirip di and-fhd20 jatuh sedikit di bawah 0,1, dan di `frequency` 6 ada 9 pasangan di bawah 0,2 di dua ponsel (batasnya 8). Di `frequency` 6 dengan `amplitude` 1, variasinya tetap lulus (termirip ≥ 0,139, paling banyak 2 pasangan di bawah 0,2). Ini kucatat sebagai titik lemah, sama seperti `amplitude` 0.

**Waktu render dan ukuran sesudah revisi.** Diukur di container baru, yang lebih lambat dari container pengukuran awal: median hills di 7680×320 maksimum dengan CPU 6× naik dari 3,2–3,6 ms ke 4,6–5,3 ms.

- **desk-5k maksimum:**
  - SVG seed 42: 17.407 B (sebelumnya 17.447 B), terbesar dari seed 1–200: 17.847 B. Keduanya tetap 17,4 KB dan 17,8 KB.
  - Node: median 0,56 ms, terlama dari seed 1–200 2,4 ms.
  - Chromium CPU 4×: median 2,5–3,5 ms, terlama 17–30 ms. CPU 6×: median 2,3–2,9 ms, terlama 9,1–9,7 ms.
- **Custom 7680×320 maksimum:** keluarannya identik dengan sebelum revisi (68.766 B). Di 8 putaran Chromium CPU 6× di container baru, sekitar 2.700 render:
  - Median 9–13 ms.
  - **Satu render mencapai 104 ms** (seed 105, putaran pertama, saat render per seed). Di 7 putaran lain, termasuk 3 putaran satu render per frame dengan hills sebagai kontrol, render terlamanya 30–48 ms.
  - Ini sama dengan anomali yang tercatat di bagian waktu render: jarang, tidak terulang, dan tidak berhubungan dengan revisi ini, karena keluarannya tidak berubah. Tetap kucatat, karena satu render itu melewati batas ponsel ENG-07.
- **Ukuran kode:** engine + waves 6.199 B atau 3.142 B gzip (sebelumnya 6.168 B atau 3.128 B).

**Pratinjau.** `parameter.png` dibuat ulang dan hanya berubah di kolom `frequency` 6. Gambar baru [kecuraman-sebelum-sesudah.png](kecuraman-sebelum-sesudah.png) menunjukkan seed 42 di `amplitude` 1 dengan `frequency` 4 / 5 / 6, di and-fhd20 dan mba-13, sebelum dan sesudah revisi.

**Hasil uji sesudah revisi.** `npm run check` 0 error, `npm run lint` bersih, `npm test` 406 tes unit dan 1 tes Playwright lulus, dan `npm run build` berhasil.

**Verifikasi.** Revisi ini kuperiksa sendiri dengan skrip terpisah dan uji mutasi di atas. Pemeriksaan independen dengan banyak pemeriksa, seperti di bagian sebelumnya, tidak diulang untuk revisi ini.
