# Laporan langkah 3: pola `arcs`

Draft PR: https://github.com/faljourney/falette/pull/4 (branch `claude/project-thread-ayzlwl`, 5 commit). Semua keputusan di rencana diikuti: langkah slider 0,05, 10 konstanta, snapshot khusus arcs, tanpa validasi parameter di pola, `runnerImport`, dan `export default`.

---

## Yang berubah

| File | Isi | ID |
| --- | --- | --- |
| `src/lib/patterns/arcs.ts` (baru) | Modul pola: skema persis katalog, `colorCount = layers`, `generate()`, dan `layout()` murni (geometri dari ukuran, parameter, dan tepat 5 tarikan PRNG, tanpa warna). Tiap pita ditulis sebagai `path` yang dipotong di tepi kanvas dan dibelah di puncaknya. | PAT-01, PAT-02, PAT-04, PAT-09, ENG-01–ENG-06, ENG-11, MODE-01, DEV-05 |
| `tests/patterns/arcs.test.ts` (baru) | 35 tes (rincian di bawah). | PAT-10, ENG-08 |
| `tests/fixtures/snapshot-patterns.ts`, `tests/engine/snapshot.test.ts` | `arcs` masuk snapshot, ditambah kasus khusus per pola. Snapshot `mock` tidak berubah. | ENG-08 |
| `tests/engine/__snapshots__/arcs/…` (baru) | 144 file: 3 seed bersama + seed `1234` dan `106` + 7 kasus parameter, × 6 preset × Terang dan Gelap. | ENG-08 |
| `scripts/preview-pattern.js`, `package.json`, `.gitignore` | `npm run preview:pattern -- arcs` menulis 12 SVG ke `previews/` (di-gitignore), lalu mencetak ukuran file dan waktu render di desk-5k. | PAT-10, ENG-07 |

Tidak disentuh: engine, fungsi palet, pola lain, PRD, katalog, dan AGENTS.md. Versi engine tetap 1.

## Hasil uji

| Perintah | Hasil |
| --- | --- |
| `npm run check` | ✅ 0 error, 0 peringatan |
| `npm run lint` | ✅ bersih |
| `npx vitest run` | ✅ 278 lulus (35 tes arcs, 180 kasus snapshot) |
| Playwright (`tests/home.e2e.ts`) | ✅ 1 lulus, memakai Chromium bawaan container lewat config lokal sementara (versi browser container tidak cocok dengan Playwright 1.64) |
| `npm run build` | ✅ berhasil |

Isi tes arcs: skema katalog; urutan warna ENG-11 untuk palet 1, 3, dan 5 warna; Terang = Gelap setelah warna disamarkan (MODE-01); geometri tidak berubah walau palet atau latar diganti; tepat 5 tarikan PRNG untuk semua gaya seed; hanya `rect` dan `path` tanpa `style`/filter; maksimal 2 desimal; tidak ada yang keluar kanvas; tiap busur tepat di lingkarannya (selisih ≤ 0,05 px); ukuran 2× menghasilkan geometri tepat 2×; setengah atas ponsel kosong; lanskap menyisakan ≥ 8% lebar di tiap sisi; `layers` hanya membagi pita; `curve` monoton sampai setengah lingkaran; `focus` menempatkan pusat tanpa mengubah ukuran; garis tertipis ≥ `MIN_LINE`; bukaan 25–50% dan celah ≤ 80%; variasi seed di 6 preset; batas waktu ENG-07.

## Waktu render dan ukuran file (ENG-07: ≤ 50 ms laptop, ≤ 100 ms ponsel)

| Kasus di desk-5k (5120×2880) | Node, median 50 render | Chromium, CPU 4× lebih lambat | Chromium, CPU 6× lebih lambat | Ukuran SVG |
| --- | --- | --- | --- | --- |
| Nilai awal (5; 0,6; 0,5) | 0,08 ms | median 0,1 ms, terlama 2 ms | median 0,1 ms, terlama 4 ms | 1,1 KB |
| Nilai maksimum (12; 1; 1) | 0,12 ms | median 0,9 ms, terlama 2,7 ms | median 0,1 ms, terlama 1,7 ms | 2,8 KB |

Kesimpulan: jauh di bawah batas ENG-07 (lebih dari 10× ruang sisa, bahkan untuk render terlama). Engine + arcs setelah minify berukuran 3,0 KB gzip. Angka ini dari container dan Chromium headless, bukan perangkat asli.

## Perbaikan setelah ditinjau

Perubahan ditinjau dari empat sudut (geometri, kepatuhan PRD, kekuatan tes, dan perkakas), dan tiap temuan diverifikasi ulang. Ada 9 temuan yang terbukti; semuanya sudah diperbaiki.

- Di `curve` 1, setengah lingkaran yang ditulis sebagai satu busur bisa bergeser sampai ~6 px di renderer karena pembulatan. Sekarang busur dibelah di puncaknya, dan semua busur berada ≤ 0,05 px dari lingkarannya. Snapshot arcs dibuat ulang; ini aman karena arcs belum dirilis.
- Tes diperketat: batas garis tertipis memakai `MIN_LINE` persis, cek taper dan condong punya toleransi, tarikan PRNG dicek di keempat gaya seed, dan ada tes baru untuk bagian bukaan dan celah. Enam mutasi kode yang dicoba semuanya tertangkap tes.
- Skrip pratinjau sekarang wajib diberi ID pola.

## Yang belum diuji

- Perangkat asli (laptop dan ponsel kelas menengah).
- Membuka SVG hasil ekspor di Figma, Illustrator, dan Inkscape.
- Persetujuan visual PAT-10 darimu. Tanda ✅ di katalog belum diberikan.

## Catatan

- Seed tetap untuk pratinjau adalah `42`, yang kebetulan bergaya garis (pita berjarak). Variasi seed lain ada di `variasi-seed-terang.png` dan `variasi-seed-gelap.png`.
- Daftar pola ringan (ENG-10, P1) belum dibuat, sesuai rencana.
