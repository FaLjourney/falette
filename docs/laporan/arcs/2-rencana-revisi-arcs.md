# Revisi `arcs`: commit 1 selesai, rencana commit 2, dan usulan warna Gelap

Branch dan PR tetap sama (#4). Commit 1 sudah di-push. Commit 2 menunggu persetujuanmu; bagian "Pertanyaan" di bawah berisi tiga pilihan beserta rekomendasiku.

---

## 1. Commit 1: snapshot dipangkas (sudah di-push, `11d4cbd`)

| | Sebelum | Sesudah |
| --- | --- | --- |
| Seed bersama (3 seed × 6 preset × Terang dan Gelap) | 36 | 36 |
| Kasus khusus arcs (2 seed tambahan + 7 kasus parameter) | 9 × 6 preset × 2 varian = 108 | 9 × `ios-63` dan `mba-13` × Terang = 18 |
| Total file arcs | 144 | 54 |
| File mock | 36 | 36 (tidak berubah) |

- Aturannya ada di kerangka snapshot (`tests/fixtures/snapshot-patterns.ts`: `snapshotExtraPresets`, `snapshotExtraVariants`), jadi berlaku untuk semua pola berikutnya.
- 90 file yang tidak terpakai dihapus. Git hanya mencatat penghapusan: tidak ada satu pun file tersisa yang berubah isinya, dan uji dengan `CI=true` lulus tanpa menulis ulang snapshot.
- Vitest tidak pernah menandai file snapshot `.svg` sebagai usang, jadi aku menambah satu tes kecil: tes gagal bila ada file di `__snapshots__` yang tidak ditulis oleh kasus mana pun. Tes ini sudah kucoba dengan file palsu dan langsung menangkapnya.
- Hasil: `npm run check` 0 error, `npm run lint` bersih, `vitest run` 189 lulus (sebelumnya 278; selisihnya snapshot yang dihapus, ditambah 1 tes baru), `npm run build` berhasil, Playwright 1 lulus.

## 2. Config Playwright

- Config sementara tidak pernah masuk repo. Sekarang aku menaruhnya di folder scratch di luar repo, sehingga tidak mungkin ikut ter-commit. Di repo hanya ada `playwright.config.ts`.
- Config asli valid: ia memuat, menjalankan build, menyalakan server preview, lalu menjalankan tes. Di container tes gagal hanya karena browser bawaan container (Chromium build 1194) tidak cocok dengan Playwright 1.64, yang mencari build 1248.
- Cara menjalankannya di komputermu, cukup sekali: `npx playwright install chromium`. Setelah itu `npm test` menjalankan unit test dan tes browser tanpa config tambahan. Di Linux, bila library sistem kurang, pakai `npx playwright install --with-deps chromium`.

---

## 3. Rencana commit 2: busur potret minimal 30% tinggi kanvas

ID: PAT-04, PAT-10, DEV-05, ENG-04, ENG-08. File yang diubah: `src/lib/patterns/arcs.ts`, `tests/patterns/arcs.test.ts`, `tests/fixtures/presets.ts`, dan 27 snapshot arcs.

### Kenapa batas ini gagal sekarang

Saat ini tinggi busur = ukuran dari seed × √rasio, dengan rasio dari `curve` (0,4 sampai 1). Jadi `curve` rendah menurunkan busur sampai 63% tingginya. Di ponsel puncaknya hanya 12–30% tinggi kanvas di curve 0, dan 19–48% di curve 1.

Aturan lama ini tidak bisa dipertahankan. Agar curve 0 tetap ≥ 30%, ukuran seed minimal harus 47,4% tinggi, padahal maksimalnya 48%. Rentang ukuran dari seed jadi tinggal 1,01×, artinya variasi ukuran hilang.

### Cara kerja baru (hanya kanvas potret, tinggi > lebar)

- Seed langsung memilih tinggi puncak busur terluar: `lerp(PORTRAIT_FLOOR × tinggi, unit, tarikan seed)`. Di semua kanvas potret, `unit` = 48% tinggi, sama dengan busur ponsel terbesar sekarang. Jadi puncak selalu 30–48% tinggi kanvas, dan setengah atas tetap kosong.
- `curve` hanya mengatur lebar dan kebulatan busur, tidak lagi tingginya. Karena tinggi tidak bergantung pada `curve`, batas 30% berlaku sama di curve 0 dan curve 1. Di curve 0 busur jadi 2,5× lebih lebar, bukan lebih rendah.
- Secara matematis, puncak = 0,3·tinggi + (selisih positif) × tarikan seed ≥ 0,3·tinggi. Ini berlaku persis, termasuk setelah pembulatan floating-point.
- `layers` dan `focus` tidak menyentuh puncak terluar; ini sudah dicek tes yang ada.
- Lanskap dan persegi (lebar ≥ tinggi) memakai rumus lama tanpa perubahan. Aku sudah membandingkan 9.600 render lanskap dan persegi: 0 berbeda.
- Tetap 5 tarikan PRNG dengan urutan sama, geometri tidak bergantung warna, dan skala 2× tetap persis 2×.

### Konstanta

- Baru: `PORTRAIT_FLOOR = 0.3`, di blok konstanta yang sama: "puncak terendah busur terluar di layar potret, sebagai bagian dari tingginya, di semua seed dan curve".
- Dihapus (bila pertanyaan 1 dijawab a): `PORTRAIT_MIN = 9 / 20`. Aturan "layar lebih tinggi dari 9:20 hanya mendapat langit lebih banyak" bertentangan dengan batas 30% untuk semua kanvas potret.
- Hanya komentar yang berubah: `SIZE_MIN` (kini khusus lanskap) dan `FLAT` ("tetap kubah di ponsel" tidak lagi benar).

### Variasi seed (PAT-10)

Rentang puncak di potret maksimal 0,5 / 0,3 = 1,67×, karena dibatasi 30% di bawah dan setengah layar di atas. Rancangan ini memakai 1,56× (30–48%). Di lanskap tetap 2,4×. Pembukaan, celah, condong, dan taper tetap diatur seed.

| Metrik variasi, seed 1–30 (median / pasangan termirip / pasangan di bawah 0,3) | Sekarang | Sesudah |
| --- | --- | --- |
| and-fhd20, parameter awal | 0,895 / 0,144 / 2 | 0,845 / 0,105 / 2 |
| ios-63, parameter awal | 0,898 / 0,132 / 2 | 0,844 / 0,115 / 2 |
| ipad-pro-13, parameter awal | 0,915 / 0,159 / 2 | 0,854 / 0,150 / 2 |
| and-fhd20, curve 0 | 0,894 / 0,101 / 3 | 0,846 / 0,053 / 4 |
| mba-13 (lanskap) | 0,916 / 0,160 / 2 | sama persis |

Batas tes PAT-10 (median ≥ 0,8, termirip ≥ 0,1, maksimal 2% pasangan di bawah 0,3) tetap lulus di 6 preset. Margin tersempit ada di and-fhd20: 0,105 terhadap batas 0,1. Lihat [potret-sebelum-sesudah.png](/mnt/project-files/arcs/revisi/potret-sebelum-sesudah.png): tiga baris atas kondisi sekarang dan tiga baris bawah sesudahnya, 15 seed di and-fhd20, curve 0 / 0,6 / 1.

### Akibat yang terlihat

- Di curve 0, ponsel menampilkan pita hampir mendatar: busur terluar turun sekitar 2% tinggi dari tengah ke tepi.
- Di ponsel 20:9, busur terluar selalu lebih lebar dari layar, jadi pelangi kecil yang utuh dari seed kecil tidak muncul lagi di ponsel. Di iPad potret dengan curve 1 masih muncul.
- Ada lompatan di rasio persegi: 1000 × 1001 mendapat batas 30%, sedangkan 1000 × 1000 tetap memakai aturan lanskap. Ini konsekuensi definisi potret = tinggi > lebar dan lanskap tidak berubah.

### Tes

Tambahan:

- Batas 30–50% di semua 17 preset potret Lampiran A: 11 ponsel dan 6 tablet. Daftarnya kutaruh di `tests/fixtures/presets.ts` di samping 6 preset perwakilan, sampai `presets.json` ada.
  - Seed: 1–300, ditambah semua seed snapshot.
  - Parameter: 10 kombinasi ekstrem, ditambah setiap langkah curve 0–1 (per 0,05) di nilai awal, serta di layers 12 / focus 0.
  - Total sekitar 267 ribu pengecekan, ±1,5 detik. Di modul sekarang tes ini gagal di 163.614 kasus, jadi tes ini memang menangkap masalahnya.
- Batas yang sama di ukuran Custom potret: 320 × 7680, 1644 × 3840 (ponsel 21:9), 320 × 400, 1000 × 1001, dan 7679 × 7680.

Perubahan karena kebutuhannya berubah (bukan supaya lulus):

| Tes sekarang | Perubahan | Alasan |
| --- | --- | --- |
| "layar lebih tinggi dari 9:20 mendapat langit lebih banyak" (320 × 7680: puncak ≤ 10% tinggi) | Diganti tes batas 30% di ukuran Custom potret | Bertentangan langsung dengan aturan baru, padahal 320 × 7680 ukuran Custom yang sah (DEV-04) |
| "curve menaikkan dan menyempitkan busur" | Potret: tinggi tetap di semua curve. Lanskap: tetap naik. Lebar tetap menyempit di keduanya | Di potret, curve tidak lagi mengatur tinggi |
| "setiap sumbu seed bergerak dua arah": rentang puncak ≥ 2× | Potret: seed harus menjangkau kedua ujung rentang (terendah ≤ 33% dan tertinggi ≥ 45% tinggi; terukur 30,1–47,0%). Lanskap: tetap ≥ 2× | 2× mustahil di potret; maksimalnya 1,67× |
| Helper `archUnit` di tes | Batas 9:20 dihapus, mengikuti modul | `PORTRAIT_MIN` dihapus |
| Daftar `phones` | Tambah and-pixel (1280 × 2856) | Ponsel paling tinggi di Lampiran A |

Uji coba di scratch: modul baru lulus 36 dari 36 tes arcs versi baru. `tsc --strict` bersih.

### Snapshot

- 27 dari 54 file arcs berubah, semuanya potret: and-fhd20 (6), ipad-pro-13 (6), dan ios-63 (15).
- 27 file lanskap (mba-13, desk-uw, desk-5k) tetap sama persis. Mock tidak berubah. Versi engine tetap 1.

### Ketidaksesuaian yang kulaporkan, tidak kuubah

Lampiran A PRD menyebut `and-fhd20` paling tinggi. Kenyataannya `and-pixel` (1280 × 2856) dan `and-15k` (1220 × 2712) sedikit lebih tinggi dari 9:20. Komentar `PORTRAIT_MIN` di arcs mengulang kekeliruan ini; komentar itu ikut hilang bersama konstantanya. PRD tidak kuubah.

### Pertanyaan

Balas "lanjut" untuk memakai semua rekomendasi, atau sebutkan nomor dan huruf yang berbeda.

1. **Ukuran Custom yang lebih tinggi dari preset tertinggi (mis. 320 × 7680, ponsel 21:9)?**
   - a. Batas 30% berlaku untuk semua kanvas potret. Pita di 320 × 7680 jadi hampir datar di 30–48% tinggi, dan tes "langit lebih banyak" diganti. **(rekomendasi: sesuai kalimat aturanmu, dan ponsel 21:9 asli juga tercakup)**
   - b. Hanya sampai preset tertinggi. `PORTRAIT_MIN` diubah ke rasio and-pixel, dan Custom yang lebih tinggi tetap mendapat langit lebih banyak (ponsel 21:9 turun sampai 28,7%). Hasil di semua preset dan snapshot sama persis dengan a.
2. **Di potret, apakah curve hanya mengatur lebar, atau tetap sedikit menaikkan busur?**
   - a. Hanya lebar: satu konstanta, variasi seed terbesar. **(rekomendasi)**
   - b. Naik 5% dari curve 0 ke 1: konstanta kedua `PORTRAIT_RISE`, rentang ukuran 1,52×.
3. **Pengganti cek "rentang puncak ≥ 2×" di potret?**
   - a. Seed menjangkau kedua ujung rentang (≤ 33% dan ≥ 45%). **(rekomendasi: tidak mepet ke batasnya)**
   - b. Rasio ≥ 1,5× (terukur 1,56×).

---

## 4. Usulan saja (belum diterapkan): warna hangat di varian Gelap

### Penyebab

Varian Gelap mencerminkan jarak lightness ke latar (MODE-02). Oranye `e07a5f` (L 0,69) berjarak 0,27 dari latar terang (L 0,95), jadi di Gelap mendarat di L 0,2 + 0,27 = 0,47. Hasilnya `#8e3e29`: hue tetap, tapi oranye segelap itu terbaca cokelat bata.

Oranye dan kuning yang lebih terang kena batas `MIN_DL` 0,25 dan jatuh ke L 0,45:

| Warna terang | Gelap sekarang |
| --- | --- |
| `ff8c42` | `#873d00` |
| `f2a541` | `#774a00`, kuning tua zaitun |

Menaikkan chroma saja tidak cukup: dengan `DARK_CHROMA` 1,0 hasilnya masih `#95371d`. Yang menentukan adalah lightness warna yang dekat dengan latar, yaitu `BG_DARK_L + MIN_DL`.

### Pilihan (hanya konstanta di `color-constants.ts`)

| | Konstanta | `e07a5f` di Gelap | `ff8c42` | Latar Gelap (netral) | Pita bersebelahan palet Lampiran B (ΔE, batas 0,10) | Warna yang jaraknya tetap |
| --- | --- | --- | --- | --- | --- | --- |
| Sekarang | — | `#8e3e29` (L 0,47) | `#873d00` | `#161616` | 0,160 | 61% |
| P1 | `MIN_DL` 0,25 → 0,40 | `#b9664f` (L 0,60) | `#c06325` | `#161616` | 0,050, nyaris menyatu | 29% |
| **P2 (rekomendasi)** | `BG_DARK_L` 0,20 → 0,26 dan `MIN_DL` 0,25 → 0,31 | `#af5d47` (L 0,57) | `#b65a18` | `#242424` | 0,104 | 48% |
| P3 | `BG_DARK_L` 0,24, `MIN_DL` 0,31, dan `DARK_CHROMA` 0,85 → 0,92 | `#ad543c` (L 0,55) | `#b15200` | `#1f1f1f` | 0,107 | 48% |

Contoh warna dan render arcs untuk tiap pilihan ada di [usulan-warna-gelap.png](/mnt/project-files/arcs/revisi/usulan-warna-gelap.png).

**P2** memberi kenaikan terbesar tanpa membuat pita bersebelahan menyatu. Harganya: latar Gelap jadi `#242424`, bukan `#161616` (Otomatis dengan palet Lampiran B: `#1d1311` → `#2c211e`).

**P1** paling hangat, tapi pita `4d7a89` dan `81b29a` di palet 5 warna nyaris tak terbedakan di Gelap.

**P3** menjaga latar paling gelap, tapi chroma naik untuk semua hue. Ini berlawanan dengan "chroma sedikit diturunkan".

Batas yang jujur:

- Semua pilihan membuat lebih sedikit warna yang mempertahankan jaraknya (MODE-02), dari 61% menjadi 48% di P2.
- Amber/kuning (`f2a541`) tetap terbaca oker di semua pilihan yang menjaga pita tetap terbedakan. Memperbaikinya butuh logika baru, misalnya batas lightness khusus hue hangat. Itu di luar perubahan konstanta.

### Dampak bila diterapkan

- Snapshot: tepat 36 dari 90 file berubah, yaitu semua file Gelap (mock 18 dan arcs 18). Semua 54 file Terang tetap sama. Angka ini dihitung ulang secara independen dan cocok.
- Tes unit `palette.test.ts`: P1 mengubah 2 tes (monokrom dan contoh Lampiran B); P2 dan P3 mengubah 4 tes (ditambah latar Otomatis dan Manual).
- Ada efek di varian Terang: palet satu warna ikut berubah gradasinya, karena langkah lightness-nya dihitung dari `MIN_DL` dan `BG_DARK_L`.
- Versi engine: komentar di `color-constants.ts` mewajibkan naik versi. Tapi belum ada rilis, dan perbaikan warna sebelumnya (`cc1bc3f`) tetap di versi 1. Usulku: tetap v1, sebagai keputusan eksplisit darimu.
- Ini perubahan engine, jadi sebaiknya commit/PR sendiri setelah #4, bukan di #4.
