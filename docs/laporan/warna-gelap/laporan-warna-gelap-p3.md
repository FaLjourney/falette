# Laporan: warna varian Gelap, pilihan P3

Usulan asalnya ada di bagian 4 [rencana revisi arcs](../arcs/2-rencana-revisi-arcs.md). FaL memilih P3, bukan P2. Alasannya, latar Gelap tetap lebih gelap (#1f1f1f, bukan #242424), dan chroma tetap diturunkan (0,92 < 1), jadi masih sesuai MODE-02. Versi engine tetap 1, juga atas keputusan FaL.

---

## Yang berubah

| File | Isi | ID |
| --- | --- | --- |
| `src/lib/engine/color-constants.ts` | `BG_DARK_L` 0,2 → 0,24, `MIN_DL` 0,25 → 0,31, `DARK_CHROMA` 0,85 → 0,92. Komentar `BG_DARK_L` kini "about #1f1f1f when neutral". Komentar pembuka mengikuti AGENTS.md: setelah rilis publik, perubahan konstanta wajib menaikkan versi; sebelum rilis, versi tetap 1. | MODE-02, COL-05, SHR-03 |
| `tests/engine/palette.test.ts` | 4 tes memakai nilai baru (tabel di bawah). | MODE-02, COL-05, ENG-11 |
| `tests/engine/__snapshots__/{mock,arcs}/dark/` | 36 file Gelap: 18 mock dan 18 arcs. Hanya warna `fill` yang berubah, geometrinya sama. | ENG-08 |
| `docs/laporan/warna-gelap/` | Laporan ini dan [pratinjau-gelap-p3.png](pratinjau-gelap-p3.png). | |

Tidak disentuh: logika palet (`palette.ts`), pola arcs, konstanta lain, PRD, katalog, dan AGENTS.md. `ENGINE_VERSION` tetap 1.

## Hasil dibandingkan dengan perkiraan rencana

| Perkiraan di rencana | Hasil |
| --- | --- |
| Hanya 36 snapshot Gelap berubah (18 mock, 18 arcs) | ✅ 36 file, semuanya Gelap. Bila warna `fill` disamarkan, isinya identik dengan sebelumnya. |
| 54 snapshot Terang identik | ✅ 0 file Terang berubah |
| `palette.test.ts`: 4 tes berubah | ✅ Dengan konstanta baru dan sebelum nilai diperbarui, yang gagal hanya 4 tes palet itu dan 36 kasus snapshot Gelap. 150 tes lainnya lulus tanpa diubah. |
| Di Terang, hanya gradasi palet satu warna yang berubah | ✅ Gradasi dua warna, isian Lampiran B, dan latar Terang tetap sama |
| `e07a5f` di Gelap: `#ad543c` (L 0,55) | ✅ `#ad543c` (L 0,551) |
| `ff8c42` di Gelap: `#b15200` | ✅ `#b15200` |
| Latar Gelap netral `#1f1f1f` | ✅ `#1f1f1f` |
| ΔE pita bersebelahan, palet Lampiran B: 0,107 (batas 0,10) | ✅ 0,107 |
| Warna yang jaraknya tetap: 61% → 48% | Pengukuranku: 63% → 50%, dari 200.000 warna sRGB acak seragam. Cara hitung di rencana tidak tercatat, tapi turunnya serupa. |

## Nilai tes yang berubah

| Tes | Sebelum | Sesudah |
| --- | --- | --- |
| Palet satu warna `e07a5f`, 5 warna, Terang | `#bc5940` `#983920` `#731b00` `#460d00` | `#b35138` `#95361c` `#761c00` `#4f0f00` |
| Latar Otomatis, palet Lampiran B, Gelap | `#1d1311` | `#271c19` |
| Latar Manual `f4efe6`, Gelap | `#191610` | `#221f19` |
| Latar Manual `2a78d6`, Gelap (tes yang sama) | `#001533` | `#001e44` |
| Contoh Lampiran B, Gelap | `#8e3e29` `#a47497` `#afb3cf` `#628895` `#385f4d` | `#ad543c` `#b37fa4` `#bcc0de` `#6b94a3` `#517c68` |

Warna pertama palet satu warna (`#e07a5f`) tetap sama. Hanya langkah gradasinya yang berubah, karena langkah lightness-nya dihitung dari `MIN_DL` dan `BG_DARK_L`.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | ✅ 0 error, 0 peringatan |
| `npm run lint` | ✅ bersih |
| `CI=true npx vitest run` | ✅ 190 lulus |
| Playwright (`tests/home.e2e.ts`) | ✅ 1 lulus, memakai config sementara di luar repo yang menunjuk ke Chromium bawaan container |
| `npm run build` | ✅ berhasil |

Pengecekan tambahan: tint latar Otomatis (`BG_AUTO_C` × `DARK_CHROMA` = 0,0184) masih muat di sRGB untuk semua hue di L 0,24. Jadi komentar `BG_AUTO_C` tetap benar.

## Pratinjau

[pratinjau-gelap-p3.png](pratinjau-gelap-p3.png) berisi arcs seed 42 di 6 preset perwakilan, varian Gelap, sebelum dan sesudah. Palet yang dipakai Lampiran B dengan latar Manual `f4efe6` dan parameter awal, sama dengan `npm run preview:pattern -- arcs`. Di bawahnya ada contoh warna `e07a5f`, `ff8c42`, `f2a541`, dan palet Lampiran B (5 warna) di Terang, Gelap sebelum, dan Gelap sesudah.

| Warna terang | Gelap sebelum | Gelap sesudah P3 |
| --- | --- | --- |
| `e07a5f` | `#8e3e29` (L 0,47) | `#ad543c` (L 0,55) |
| `ff8c42` | `#873d00` (L 0,45) | `#b15200` (L 0,55) |
| `f2a541` | `#774a00` (L 0,45) | `#9d6300` (L 0,55) |

## Yang belum diuji

- Tampilan di layar dan perangkat asli; pratinjau dibuat dengan Chromium headless.
- Amber/kuning (`f2a541` → `#9d6300`) masih terbaca oker. Ini sudah diperkirakan di rencana dan bukan bagian perubahan ini.

## Catatan

- Snapshot arcs berasal dari PR #4. Perubahan ini dikerjakan di atas PR #4 karena main belum berisi arcs.
