# Rencana: link berbagi (SHR-01 sampai SHR-03, Lampiran B)

Langkah 4 Fase 1a di AGENTS.md, bagian terakhir Fase 1a. Rencana ini menunggu persetujuan FaL; bagian [Keputusan](#5-keputusan-yang-kubutuhkan) berisi pilihan beserta rekomendasiku. Belum ada kode yang ditulis.

**Pengecekan awal:** main sudah memuat PR #10 (`918d811`, ekspor). Branch `claude/intelligent-bell-hh6w0u` sama dengan main.

---

## 1. Pembagian kerja

Halaman Create belum ada (Fase 1b), jadi seperti ekspor, sesi ini hanya membuat modul dan tesnya.

| Sekarang (Fase 1a) | Menunggu Fase 1b |
| --- | --- |
| `src/lib/share/link.ts`, modul tanpa Svelte dan tanpa DOM: menulis dan membaca hash, serta membuat URL berbagi | Tombol Salin link di kelompok Bagikan, dengan cadangan link terpilih bila clipboard ditolak (SHR-02) |
| `src/lib/presets/presets.json` ([bagian 6](#6-daftar-preset-untuk-d-dan-o)) | Memanggil `replaceState` setiap kali konfigurasi berubah (SHR-01) |
| Tes unit (Vitest) | Teks pemberitahuan di `en.json` dan `id.json` |
| Rencana dan laporan di `docs/laporan/link/` | Pengalih bahasa yang mempertahankan hash (NAV-11, NAV-09) |

---

## 2. API modul

```ts
// src/lib/share/link.ts
export type ViewMode = 'light' | 'dark' | 'pair'; // kunci m
export type Device = { preset: string } | { width: number; height: number }; // d, atau w dan h

export interface Design {
	pattern: string; // p
	seed: string; // s
	palette: string[]; // pal, HEX versi Terang huruf kecil tanpa '#'
	background: 'auto' | string; // bg
	mode: ViewMode; // m
	device: Device | null; // null: tidak ditulis, Create mendeteksi device (HOME-07, DEV-03)
	params: Params; // x, semua kunci di skema
}

export type LinkNotice =
	| { type: 'unknown-pattern'; id: string } // kembali ke Arcs (Lampiran B)
	| { type: 'version'; version: number }; // v berbeda dari ENGINE_VERSION (SHR-03)

export interface LinkRead {
	design: Partial<Design>; // hanya kunci yang ada di link dan terbaca
	notices: LinkNotice[];
}

export function writeLink(design: Design, pattern: PatternModule): string; // isi hash tanpa '#'
export function readLink(hash: string, patterns: readonly PatternModule[]): LinkRead;
export function shareUrl(origin: string, hash: string): string; // `${origin}/create/#${hash}`
export function normalizeParams(schema: ParamSchema, raw: Params): Params; // writer, reader, dan slider di Fase 1b
```

- **Versi tidak disimpan di `Design`.** `writeLink` selalu menulis `v=ENGINE_VERSION`. Link yang sudah dibuka dirender oleh engine sekarang, jadi Salin link berikutnya ikut menulis versi sekarang. Versi link lama hanya dilaporkan lewat notice.
- **`readLink` menerima modul pola dari pemanggil,** sama seperti `render()`, untuk mengambil skema parameter dan daftar ID yang dikenal. Di MVP, Create memuat keempat modul. Saat ENG-10 (P1) dikerjakan, pembacaan bisa dipecah dua: baca `p`, muat modulnya, lalu baca `x`.
- **Hasil baca berupa `Partial`,** karena Lampiran B hanya mengatur nilai awal parameter pola ([keputusan 1](#5-keputusan-yang-kubutuhkan)). Bentuk ini juga cocok untuk SHR-04 nanti, yang menggabungkan nilai per kunci.
- **Parser ditulis sendiri, tanpa `URLSearchParams`.** `URLSearchParams` mengubah `+` menjadi spasi, jadi seed `a+b` akan berubah.

---

## 3. Format tulis

- Urutan kunci tetap, sesuai contoh Lampiran B: `v`, `p`, `s`, `pal`, `bg`, `m`, lalu `d` atau `w` dan `h`, lalu `x`.
- Contoh di Lampiran B memakai nilai awal Arcs, jadi desain itu harus menghasilkan string yang **persis sama** dengan contohnya:

  ```
  v=1&p=arcs&s=42&pal=e07a5f.3d405b.81b29a&bg=f4efe6&m=pair&d=ios-69&x=layers:5,curve:0.6,focus:0.5
  ```

- `x` memuat semua parameter dengan urutan skema. Angka ditulis tanpa nol di belakang, mis. `0.6` dan `5`. Parameter dinormalkan dengan aturan yang sama seperti saat membaca, jadi link yang ditulis selalu sah.
- Seed ditulis dengan `encodeURIComponent`.
- `o` dan `fx` tidak ditulis ([keputusan 9](#5-keputusan-yang-kubutuhkan); efek lapisan belum ada).

---

## 4. Aturan baca dari Lampiran B

| Kasus | Hasil |
| --- | --- |
| Parameter hilang | Nilai awal dari skema, yang sama dengan Katalog Pola |
| Nilai di luar rentang | Dipotong ke batas: `layers:99` → 12, `curve:-1` → 0, `angle:400` → 360 |
| Kunci tak dikenal (`foo=1`, `fx=grain`) | Diabaikan |
| Nama parameter tak dikenal di `x` (`zoom:2`) | Diabaikan, sama seperti kunci tak dikenal |
| ID pola tak dikenal (`p=spiral`, `p=Arcs`) | Menjadi `arcs`, dengan notice `unknown-pattern` yang membawa ID aslinya. ID peka huruf besar-kecil |

Aturan turunan yang kupilih sendiri. Beri tahu aku kalau ada yang tidak kamu setujui:

- Hash boleh diawali `#` atau tidak.
- Bila kunci muncul dua kali, yang pertama dipakai.
- Percent-encoding yang rusak membuat kunci itu dianggap tidak ada.
- Angka harus desimal biasa. `layers:abc`, `layers:` (kosong), `1e1`, dan `0x10` dianggap hilang, jadi memakai nilai awal.
- Pilihan yang tidak ada di daftar (`type:conic`) juga memakai nilai awal.
- `readLink` tidak pernah melempar error.

---

## 5. Keputusan yang kubutuhkan

| No. | Hal | Pilihan | Rekomendasi |
| --- | --- | --- | --- |
| 1 | Kunci utama yang hilang (`p`, `s`, `pal`, `bg`, `m`). Lampiran B hanya mengatur parameter | (a) `readLink` hanya mengembalikan kunci yang ada. Create mengisi sisanya di Fase 1b, dan nilai awal Create tanpa link belum diatur PRD. Tanpa `p`, `x` diabaikan. (b) Nilai tetap ditentukan sekarang: `p` → arcs, `bg` → auto, `m` → pair, sedangkan `s` dan `pal` ditentukan FaL | a |
| 2 | Nilai di antara langkah (`layers:3.5`, `curve:0.62`), yang sekarang membuat `resolveColors` gagal | (a) Setelah dipotong, nilai dibulatkan ke langkah terdekat dihitung dari `min`, dengan setengah dibulatkan ke atas: 3.5 → 4, 0.62 → 0.6. Hasilnya bersih (0.6, bukan 0.6000000000000001), jadi selalu nilai yang bisa dibuat slider. (b) Hanya parameter berlangkah 1 yang dibulatkan. (c) Nilai seperti itu dianggap tidak sah dan memakai nilai awal | a |
| 3 | HEX tidak sah di `pal` (`zzz`, `fff`) | (a) Slot yang tidak sah dibuang dan sisanya tetap berurutan. Huruf besar diterima dan disimpan sebagai huruf kecil. Bila tidak ada yang sah, `pal` dianggap hilang. (b) Satu slot tidak sah membuat seluruh `pal` dianggap hilang | a |
| 4 | `bg` tidak sah (`zzz`) | (a) Dianggap hilang, jadi Create memakai nilai awalnya (Otomatis, COL-05). (b) Langsung menjadi `auto`. Hasilnya sama di MVP; bedanya baru muncul di SHR-04 | a |
| 5 | Jumlah warna di luar 1–5 | `pal=` (kosong) dianggap hilang. Untuk lebih dari 5: (a) lima warna pertama yang sah dipakai, sejalan dengan aturan "dipotong" dan slot berurutan di ENG-11. (b) Seluruh `pal` dianggap hilang | a |
| 6 | Seed kosong (`s=`) | (a) Dianggap hilang. (b) `''` dipakai sebagai seed sah. Seed lain dipakai apa adanya tanpa di-trim, karena seed peka huruf | a |
| 7 | Preset `d` tak dikenal | (a) Dianggap hilang, jadi Create mendeteksi device (DEV-03), tanpa pemberitahuan. (b) Sama, ditambah notice `unknown-device` yang butuh teks baru. (c) Kembali ke satu preset tetap | a |
| 8 | `w`/`h` di luar 320–7680 (DEV-04) atau berupa pecahan | (a) Dibulatkan ke piksel terdekat, lalu dipotong ke 320–7680, mengikuti aturan "dipotong" Lampiran B. (b) Dianggap hilang, jadi memakai `d` atau deteksi. Pada pilihan (a), nilai yang tidak terbaca, atau hanya ada salah satu dari `w`/`h`, dianggap hilang. Bila `w`/`h` sah, keduanya menggantikan `d` | a |
| 9 | `o` (DEV-06 dan DEV-07 masih P1) | (a) Di MVP `o` tidak ditulis dan tidak dibaca, dan preset tablet selalu potret. Di Fase 2, `o` yang hilang berarti potret, jadi link MVP tetap benar, dan `o` pada preset non-tablet diabaikan. (b) Dikerjakan sekarang, termasuk menukar sisi dan mode persegi. Ini pekerjaan P1 | a |
| 10 | `v` berbeda dari versi engine (SHR-03) | (a) Selalu dirender dengan engine sekarang. `v` yang lebih lama atau lebih baru memunculkan notice `version`. `v` yang hilang atau tidak terbaca dianggap versi sekarang, tanpa notice. Apakah algoritma lama perlu disimpan diputuskan saat versi pertama kali naik. (b) `v` yang hilang juga memunculkan notice | a |
| 11 | `x` dari pola tak dikenal setelah kembali ke Arcs | (a) Diabaikan seluruhnya, jadi Arcs memakai nilai awal, karena nilainya milik pola lain. (b) Nama yang kebetulan sama, mis. `layers`, tetap dipakai | a |
| 12 | Folder baru | (a) Tambah baris `share/` ke peta folder di AGENTS.md, seperti sesi ekspor. (b) Modul ditaruh di `src/lib/export/` | a |
| 13 | Daftar preset | Lihat [bagian 6](#6-daftar-preset-untuk-d-dan-o) | a |

---

## 6. Daftar preset untuk `d` dan `o`

Pembaca link perlu daftar ID preset yang sah, dan tes SHR-02 perlu ukurannya.

| Pilihan | Isi |
| --- | --- |
| (a) | Buat `src/lib/presets/presets.json` sekarang berisi 28 preset. Tiap preset hanya punya `id`, `category` (`phone`, `tablet`, `laptop`, `desktop`), `width`, dan `height`, karena keempatnya jelas dari Lampiran A. Lalu `tests/fixtures/presets.ts` dibaca dari JSON itu; komentarnya memang menulis "until presets.json exists". Snapshot yang tetap sama membuktikan perpindahan ini tidak mengubah apa pun |
| (b) | Semua bidang DEV-02 dibuat sekarang |
| (c) | JSON belum dibuat; `readLink` menerima daftar ID preset sebagai argumen |

Rekomendasiku (a). Bidang DEV-02 lainnya (nama, contoh model, OS, templat overlay, tautan sumber) ditunda ke Fase 1b bersama panel Perangkat. Alasannya, kolom Preset di Lampiran A berformat Indonesia ("iPhone 6,9″", "seri lama", "Kelas umum"), jadi perlu diputuskan dulu apakah nama disimpan di JSON atau di file terjemahan.

Pilihan (a) dan (b) menyentuh DEV-02, padahal aturan kerja meminta satu kebutuhan per sesi. Karena itu hal ini dijadikan keputusan.

---

## 7. Jaminan SHR-02

Desain kanonik artinya parameter berada di rentang dan tepat di langkah, HEX huruf kecil, 1–5 warna, dan seed tidak kosong. Untuk setiap desain kanonik `d`:

1. `readLink(writeLink(d)).design` sama persis (deep-equal) dengan `d`, tanpa notice.
2. Link yang ditulis ulang tidak berubah: `writeLink(readLink(h).design) === h`.
3. `render()` untuk desain hasil baca menghasilkan SVG yang identik dengan desain asal, di varian Terang dan Gelap.

Link dibaca lewat `new URL(shareUrl(...)).hash`. Node memakai parser URL WHATWG yang sama dengan browser, jadi tes ini juga membuktikan encoding di browser tidak mengubah link.

| Sumbu | Kasus |
| --- | --- |
| Pola | `arcs`, `hills`, `waves`, `gradient` |
| Seed | `1`, `42`, `senja-teduh-42`, dan seed berkarakter khusus `a+b & c=d#é 😀` |
| Parameter | Nilai awal, semua minimum, semua maksimum, dan kasus tambahan dari snapshot ENG-08 |
| Ukuran | 6 preset perwakilan dan satu ukuran Custom 3000 × 2000 |
| Varian | Terang dan Gelap |

Semua kombinasi parameter diuji di satu preset, dan semua preset diuji dengan nilai awal, supaya tes tetap cepat.

**Syarat untuk Fase 1b:** UI harus menyimpan nilai slider lewat `normalizeParams` juga. Kalau tidak, preview bisa memakai 0.6000000000000001 sementara link menyimpan 0.6.

---

## 8. Catatan untuk Fase 1b

- **NAV-11:** pengalih di `/create/` dan `/` harus membawa `location.hash`, mis. `location.replace('/' + lang + '/create/' + location.hash)`. Dropdown bahasa (NAV-09) juga harus mempertahankan hash.
- **SHR-01:** SvelteKit menyarankan `replaceState` dari `$app/navigation`, bukan `history.replaceState` langsung. Cek dokumentasi SvelteKit 3 yang terpasang dulu.
- **SHR-02:** link dibuat dengan `shareUrl(location.origin, hash)`, jadi tanpa awalan bahasa.
- **HOME-07:** Home memanggil `writeLink` dengan `device: null`. HOME-07 tidak menyebut `m`, jadi perlu diputuskan apakah Home menulis `m=pair`.
- **Belum diatur PRD:**
  - teks pemberitahuan untuk pola tak dikenal dan versi berbeda
  - nilai awal Create tanpa link (pola, seed, palet)
  - perilaku saat hash berubah ketika halaman sudah terbuka (`hashchange`)

---

## 9. Tes

| File | Isi |
| --- | --- |
| `tests/share/link-write.test.ts` | Contoh Lampiran B persis; urutan kunci; `w`/`h` menggantikan `d`; `device: null`; seed berkarakter khusus; tanpa `o`/`fx`; `shareUrl` berakhir di `/create/#` tanpa `/en/` atau `/id/` |
| `tests/share/link-read.test.ts` | [Bagian 4](#4-aturan-baca-dari-lampiran-b) dan setiap keputusan di [bagian 5](#5-keputusan-yang-kubutuhkan), termasuk `layers:3.5` yang setelah dibaca bisa dirender oleh keempat pola. Ditambah daftar hash rusak: `readLink` tidak pernah melempar error, dan hasilnya selalu bisa dirender |
| `tests/share/roundtrip.test.ts` | SHR-02 ([bagian 7](#7-jaminan-shr-02)) |
| `tests/presets.test.ts` | 28 preset, ID unik, keenam preset perwakilan ada, ponsel dan tablet potret, laptop dan desktop lanskap |

Snapshot ENG-08 tidak boleh berubah, engine tidak disentuh, dan `v` tetap 1. Setelah itu `npm run check`, `npm run lint`, `npm test`, dan `npm run build` dijalankan.

Tidak ada tes Playwright baru, karena modul ini tidak memakai DOM. Perilaku hash di browser asli (`replaceState`, pengalih bahasa) diuji di Fase 1b.

---

## 10. Setelah disetujui

Dikerjakan di branch `claude/intelligent-bell-hh6w0u`, dengan draft PR baru dari main. Urutan commit:

| No. | Commit |
| --- | --- |
| 1 | `docs: add share link plan (SHR-01 to SHR-03)`: rencana ini beserta keputusan FaL |
| 2 | `feat(presets): preset sizes from Appendix A (DEV-02)`: JSON dan fixture yang membacanya |
| 3 | `feat(share): write and read share links (SHR-01, SHR-02, SHR-03)`: modul dan tesnya |
| 4 | `docs: add share folder to AGENTS.md`, bila keputusan 12 disetujui |
| 5 | `docs: add share link session report`: laporan di `docs/laporan/link/` |

PRD, katalog, engine, dan snapshot tidak disentuh.

### Belum bisa diuji di Fase 1a

- `replaceState` dan hash di browser asli
- Pengalih bahasa yang mempertahankan hash
- Clipboard dan cadangan link terpilih
- Tampilan pemberitahuan
