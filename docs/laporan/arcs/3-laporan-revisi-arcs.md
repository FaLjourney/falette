# Laporan revisi `arcs`

Semua perubahan ada di PR #4 (branch `claude/project-thread-ayzlwl`), dalam dua commit berurutan:

1. `11d4cbd` test(engine): snapshot kasus khusus hanya di dua preset, varian Terang (ENG-08).
2. `a38c878` feat(patterns): busur arcs minimal 30% tinggi di layar potret (PAT-10, DEV-05).

Rencana yang disetujui: [rencana-revisi-arcs.md](/mnt/project-files/arcs/revisi/rencana-revisi-arcs.md), dengan pilihan 1a, 2a, dan 3a.

---

## Yang berubah

| Commit | File | Isi | ID |
| --- | --- | --- | --- |
| 1 | `tests/fixtures/snapshot-patterns.ts`, `tests/engine/snapshot.test.ts` | Aturan baru: seed bersama di 6 preset × Terang dan Gelap; kasus khusus hanya di `ios-63` dan `mba-13`, Terang. Tes baru gagal bila ada file snapshot yatim. | ENG-08 |
| 1 | `tests/engine/__snapshots__/arcs/` | 90 file dihapus; 54 tersisa identik byte demi byte. | ENG-08 |
| 2 | `src/lib/patterns/arcs.ts` | `PORTRAIT_FLOOR = 0.3` baru, `PORTRAIT_MIN` dihapus. Di potret, seed memilih tinggi puncak 30–48%, dan `curve` hanya mengatur lebar. Lanskap dan persegi memakai rumus lama. | PAT-04, PAT-10, DEV-05, ENG-04 |
| 2 | `tests/patterns/arcs.test.ts`, `tests/fixtures/presets.ts` | 17 preset potret Lampiran A masuk fixture. Ada tes batas 30–50% di preset potret dan ukuran Custom potret. Tes curve dan sumbu seed disesuaikan dengan aturan baru, dan and-pixel masuk daftar ponsel. | PAT-10 |
| 2 | 27 snapshot arcs | Hanya potret yang berubah: and-fhd20 (6), ipad-pro-13 (6), ios-63 (15). | ENG-08 |

Tidak disentuh: engine, fungsi palet, pola lain, PRD, katalog, dan AGENTS.md. Versi engine tetap 1.

## Perubahan snapshot di commit 2

27 dari 54 file arcs berubah, semuanya potret. Penyebabnya, puncak busur di potret kini 30–48% tinggi di semua curve, dan curve hanya mengatur lebar. Sebelumnya puncak bisa turun sampai 12% di curve rendah.

27 file lanskap (mba-13, desk-uw, desk-5k) dan semua snapshot mock tetap sama persis. Ini aman karena arcs belum dirilis, sesuai izinmu.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | 0 error, 0 peringatan |
| `npm run lint` | bersih |
| `CI=true npx vitest run` | 190 lulus: 36 tes arcs, 90 kasus snapshot, 1 tes file yatim |
| Playwright (`tests/home.e2e.ts`) | 1 lulus, memakai config sementara di luar repo |
| `npm run build` | berhasil |

Pengukuran tambahan:

- Batas potret: 0 pelanggaran di 17 preset potret dan 5 ukuran Custom potret, × 304 seed × 31 set parameter. Puncak terendah 30,06% tinggi, tertinggi 47,96%.
- Lanskap dan persegi: 9.600 render dibandingkan dengan versi sebelum commit 2, dan semuanya identik.
- Uji mutasi: batas 0,29, tinggi potret yang kembali ikut curve, persegi yang diperlakukan sebagai potret, dan anggaran garis yang salah semuanya tertangkap tes.
- Kasus persegi baru tertangkap setelah tes curve kuperluas ke ukuran Custom: busur di persegi harus naik saat curve dinaikkan.

## Variasi seed (PAT-10)

| Preset, parameter awal (median / pasangan termirip / di bawah 0,3) | Sebelum | Sesudah |
| --- | --- | --- |
| and-fhd20 | 0,895 / 0,144 / 2 | 0,845 / 0,105 / 2 |
| ios-63 | 0,898 / 0,132 / 2 | 0,844 / 0,115 / 2 |
| ipad-pro-13 | 0,915 / 0,159 / 2 | 0,854 / 0,150 / 2 |
| mba-13, desk-uw, desk-5k | — | tidak berubah |

Rentang ukuran dari seed di potret kini 1,56×; maksimal yang mungkin 1,67×. Di lanskap tetap 2,4×. Batas tes lulus di 6 preset, dengan margin tersempit di and-fhd20: 0,105 terhadap batas 0,1.

## Pratinjau

- [pratinjau-seed-42.png](/mnt/project-files/arcs/pratinjau/pratinjau-seed-42.png) berisi 12 pratinjau seed 42, dan file SVG-nya ada di folder `pratinjau/svg`.
- Lembar variasi 8 seed: [variasi-seed-terang.png](/mnt/project-files/arcs/pratinjau/variasi-seed-terang.png) dan [variasi-seed-gelap.png](/mnt/project-files/arcs/pratinjau/variasi-seed-gelap.png).
- Perbandingan curve 0 / 0,6 / 1 di ponsel: [potret-sebelum-sesudah.png](/mnt/project-files/arcs/revisi/potret-sebelum-sesudah.png).

## Waktu render dan ukuran file (ENG-07)

| desk-5k | Median | Terlama dari 50 | SVG |
| --- | --- | --- | --- |
| Nilai awal | 0,10 ms | 0,20 ms | 1,1 KB |
| Nilai maksimum | 0,17 ms | 0,93 ms | 2,8 KB |

Ukuran file desk-5k tidak berubah karena lanskap memang tidak berubah. Selisih waktu dari laporan sebelumnya hanya variasi mesin.

## Tinjauan sebelum selesai

Perubahan commit 2 ditinjau dari tiga sudut: geometri, kekuatan tes, dan ketepatan komentar. Hasilnya dua komentar tes yang tidak akurat, dan keduanya sudah diperbaiki di commit 2 yang sama. Tidak ada temuan pada kode atau perilaku.

Agar branch tetap berisi tepat dua commit, perbaikan itu digabung ke commit 2 lalu di-push ulang (`178bc3b` → `a38c878`).

## Yang belum diuji

- Perangkat asli (ponsel dan laptop kelas menengah).
- Membuka SVG di Figma, Illustrator, dan Inkscape.
- Persetujuan visual PAT-10 darimu. Tanda ✅ di katalog belum diberikan.

## Catatan

- Lampiran A PRD menyebut `and-fhd20` paling tinggi, padahal `and-pixel` (1280 × 2856) dan `and-15k` (1220 × 2712) sedikit lebih tinggi. Kode dan tes sudah memakai angka yang benar; PRD tidak kuubah.
- Usulan warna Gelap belum diterapkan. Bila disetujui, sebaiknya dikerjakan sebagai PR engine tersendiri setelah #4.
