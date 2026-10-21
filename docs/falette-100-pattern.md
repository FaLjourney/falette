# Katalog Pola Falette

Daftar pola generatif Falette, disusun dari daftar awal 100 pola supaya bisa dikerjakan satu per satu dengan bantuan AI. File ini terpisah dari PRD dan disimpan bersamanya di repositori sebagai `docs/falette-100-pattern.md`; PRD merujuknya di PAT-01. Semua rentang dan nilai awal parameter adalah usulan awal dan boleh disesuaikan saat pola dikerjakan.

## Cara memakai file ini saat vibe coding

- Aturan kerja umum untuk AI ada di `AGENTS.md` di root repositori. File ini hanya mengatur pola.
- Kerjakan satu pola per sesi. Contoh perintah: "Buat pola `ridge-lines` sesuai barisnya di Katalog Pola. Ikuti PAT-02, PAT-09, PAT-10, ENG-01 sampai ENG-08, dan ENG-11 di PRD."
- Sertakan PRD dan baris pola yang sedang dikerjakan. Seluruh katalog tidak perlu ikut setiap kali.
- Setelah pola lolos PAT-10, beri tanda ✅ di depan namanya di file ini.

## Aturan umum

- **ID**: huruf kecil, kata dipisah tanda hubung. ID permanen dan tidak pernah dipakai ulang (PAT-09), karena tersimpan di link berbagi sebagai kunci `p`.
- **Modul**: satu modul per pola berisi `id`, nama, kategori, skema parameter, dan `generate()` (ENG-03). Daftar ringan (ID, nama, kategori) dimuat di awal, sedangkan modulnya baru dimuat saat thumbnail-nya mulai terlihat atau saat dipilih (ENG-10).
- **Parameter**: 2–4 per pola (PAT-02). Kunci dan nilai pilihannya berbahasa Inggris karena ikut tersimpan di link sebagai `x`, misalnya `layers:5` atau `mode:rings`; label di panel tetap diterjemahkan. Rentang 0–1 berarti nilai yang dinormalisasi terhadap ukuran layar atau intensitas, supaya hasilnya serupa di semua preset. Nilai awal juga dipakai bila link tidak memuat parameter itu (Lampiran B PRD), jadi jangan diubah setelah pola rilis tanpa menaikkan versi engine (SHR-03).
- **Geometri**: koordinat relatif terhadap ukuran kanvas dan menyesuaikan rasio potret, lanskap, atau ultrawide (ENG-04).
- **Potret**: di kanvas potret, bentuk utama pola Lanskap menempati minimal 30% tinggi kanvas di semua seed dan parameter (DEV-05).
- **Acak**: hanya lewat PRNG ber-seed (ENG-02), tanpa `Math.random()`. Tombol Acak hanya mengganti seed (PAT-04), jadi seed harus mengubah komposisi secara terlihat, bukan hanya detail kecil.
- **Warna**: memakai palet 1–5 warna pola dan Latar dari COL-05, dihitung di OKLCH (ENG-05). Bila pola butuh lebih banyak warna, kekurangannya diisi gradasi OKLCH (ENG-11). Bila palet berisi lebih banyak warna daripada kebutuhan pola, pola memakai warna berurutan mulai dari slot pertama.
- **Filter**: tanpa filter SVG berat (ENG-06). Efek lembut seperti blur ditiru dengan `radialGradient` atau `linearGradient` yang memudar ke transparan.
- **Render**: ≤ 50 ms di laptop dan ≤ 100 ms di ponsel kelas menengah (ENG-07).
- **Ekspor SVG**: mandiri tanpa font atau gambar eksternal, dengan angka dibulatkan maksimal 2 desimal (EXP-02). Warna ditulis lewat atribut presentasi seperti `fill`, `stroke`, `opacity`, dan `stop-color`, tanpa atribut atau elemen `style` (ENG-01).
- **Syarat rilis**: tiap pola lolos PAT-10, yaitu seed yang berbeda menghasilkan variasi yang terlihat, tampil baik di semua rasio layar dan di mode terang maupun gelap, memenuhi batas render, dan punya uji snapshot (ENG-08).

Format kolom Parameter: `kunci` rentang (nilai awal). Pilihan berupa teks ditulis seperti `mode` scatter/rings (rings).

## Arti kolom Render

| Render | Arti |
|---|---|
| SVG | Aman untuk ekspor SVG dan PNG. |
| SVG + filter | Butuh filter SVG, misalnya noise untuk grain. Karena ENG-06 melarang filter berat, entri ini hanya dipakai sebagai lapisan opsional. |
| Piksel | Lebih cocok digambar di canvas, padahal fungsi render hanya menghasilkan SVG (ENG-01) dan PNG dibuat dari SVG (EXP-01). Menunggu keputusan Q10 di PRD. |
| Glyph | Butuh bentuk huruf. Karena SVG tidak boleh memakai font eksternal, hurufnya perlu disimpan sebagai path. Ikut keputusan Q10. |

Tambahan **berat** berarti elemen atau hitungannya sangat banyak. Batasi jumlahnya agar ukuran file dan waktu render tetap wajar.

## Kategori

Kategori ini dipakai untuk filter di panel Pola (PAT-08).

| Kategori | Jumlah pola |
|---|---|
| Lanskap | 11 |
| Gradasi | 5 |
| Geometri | 13 |
| Ubin & tekstil | 13 |
| Organik | 14 |
| Matematika | 14 |
| Garis & aliran | 10 |
| Retro & digital | 13 |
| Langit & cuaca | 4 |

Empat entri lain bukan pola mandiri, melainkan efek lapisan.

## Ringkasan

| Kelompok | Pola baru | Total pola |
|---|---|---|
| MVP | 4 | 4 |
| Fase 2 | 20 | 24 |
| Fase 3 | 57 | 81 |
| Perlu keputusan (Piksel atau Glyph) | 16 | — |
| Efek lapisan | 4 | — |

Kolom Total pola sama dengan angka di PAT-01 dan rencana rilis PRD.

Pola #15 "Arcs dan hills" dipecah menjadi dua pola, Arcs dan Hills, karena keduanya pola terpisah di MVP. Karena itu katalog berisi 101 entri.

Sampai Fase 3 ada 81 pola, semuanya SVG. Bila ke-16 pola di bagian "Perlu keputusan" ikut disetujui, jumlahnya menjadi 97, karena empat entri adalah efek lapisan dan tidak dihitung sebagai pola. Untuk genap 100 pola, perlu minimal tiga pola baru.

Set pamer Home (HOME-04) di MVP memakai keempat pola MVP.

## MVP (4 pola)

| No | ID | Pola | Kategori | Render | Parameter | Penjelasan | Catatan |
|---|---|---|---|---|---|---|---|
| 15a | `arcs` | ✅ Arcs | Lanskap | SVG | `layers` 3–12 (5) · `curve` 0–1 (0.6) · `focus` 0–1 (0.5) | Busur lengkung bertumpuk dengan gaya minimalis. | Dipecah dari #15. Nilai awal sama dengan contoh di Lampiran B PRD. |
| 15b | `hills` | Hills | Lanskap | SVG | `layers` 3–10 (5) · `height` 0–1 (0.5) · `softness` 0–1 (0.6) | Bukit lengkung bertumpuk dengan gaya minimalis. | Dipecah dari #15. |
| 1 | `waves` | Waves (Layered waves) | Lanskap | SVG | `layers` 3–12 (6) · `amplitude` 0–1 (0.4) · `frequency` 1–6 (2) | Beberapa lapis gelombang bertumpuk dengan warna bergradasi dari depan ke belakang. | Nama di aplikasi: Waves. |
| 2 | `gradient` | Gradient (linear dan radial) | Gradasi | SVG | `type` linear/radial (linear) · `angle` 0–360 (135) · `spread` 0–1 (0.5) | Peralihan halus antarwarna, lurus ke satu arah atau memancar dari satu titik pusat. | Seed mengatur sebaran titik warna dan, untuk radial, letak pusatnya, agar Acak tetap menghasilkan variasi yang terlihat (PAT-10). |

## Fase 2 (20 pola)

| No | ID | Pola | Kategori | Render | Parameter | Penjelasan | Catatan |
|---|---|---|---|---|---|---|---|
| 3 | `mesh-gradient` | Mesh gradient | Gradasi | SVG | `points` 3–8 (4) · `softness` 0–1 (0.7) | Gradasi dari beberapa titik warna yang menyatu halus ke segala arah. | SVG tidak punya mesh gradient bawaan; tiru dengan lingkaran besar ber-`radialGradient` yang memudar ke transparan, tanpa filter blur (ENG-06). |
| 4 | `blobs` | Blobs | Organik | SVG | `count` 1–8 (3) · `wobble` 0–1 (0.5) · `size` 0–1 (0.6) | Bentuk organik melengkung dari kurva bezier yang titik-titiknya digeser acak. | — |
| 5 | `dots` | Dots / grid | Geometri | SVG | `spacing` 0–1 (0.3) · `size` 0–1 (0.3) · `jitter` 0–1 (0) | Titik-titik yang tersusun rapi dalam baris dan kolom berjarak seragam. | — |
| 6 | `stripes` | Stripes / garis | Geometri | SVG | `angle` 0–180 (45) · `width` 0–1 (0.3) · `gap` 0–1 (0.3) | Garis sejajar horizontal, vertikal, atau diagonal dengan tebal dan jarak yang bisa diatur. | — |
| 7 | `circles` | Circles dan concentric rings | Geometri | SVG | `mode` scatter/rings (rings) · `count` 3–40 (12) · `size` 0–1 (0.5) | Lingkaran yang tersebar acak, atau cincin bertingkat yang mengecil ke satu pusat. | — |
| 8 | `low-poly` | Triangles / low-poly | Geometri | SVG | `density` 0–1 (0.4) · `jitter` 0–1 (0.5) | Bidang yang dipecah menjadi segitiga acak, masing-masing diberi warna dari palet. | — |
| 9 | `truchet` | Truchet tiles | Ubin & tekstil | SVG | `tile` 0–1 (0.3) · `style` curve/diagonal (curve) · `weight` 0–1 (0.3) | Ubin kecil bergaris lengkung atau diagonal yang diputar acak hingga membentuk pola seperti labirin. | — |
| 11 | `radial-burst` | Spiral / radial burst | Garis & aliran | SVG | `mode` burst/spiral (burst) · `rays` 6–72 (24) · `twist` 0–1 (0.3) | Garis yang berputar keluar dari pusat, atau sinar yang memancar ke segala arah. | — |
| 13 | `ridge-lines` | Ridge lines | Lanskap | SVG | `lines` 10–80 (40) · `height` 0–1 (0.5) · `roughness` 0–1 (0.4) | Garis bergelombang bertumpuk yang membentuk profil pegunungan. | Beban sedang. |
| 14 | `topography` | Garis topografi | Lanskap | SVG | `levels` 5–30 (12) · `scale` 0–1 (0.5) · `weight` 0–1 (0.3) | Garis kontur seperti peta ketinggian, dihitung dari nilai noise. | Kontur dari noise lewat marching squares; beban sedang. |
| 18 | `duotone-shapes` | Duotone shapes | Geometri | SVG | `count` 2–12 (5) · `size` 0–1 (0.5) | Bentuk-bentuk sederhana dengan dua warna yang kontras. | Cocok untuk palet duotone. |
| 19 | `voronoi` | Voronoi | Organik | SVG | `cells` 8–200 (40) · `stroke` 0–1 (0.2) · `jitter` 0–1 (0.6) | Bidang yang dibagi menjadi sel tak beraturan berdasarkan titik terdekat, mirip sel atau batu kali. | — |
| 21 | `hexagon` | Hexagon / honeycomb | Ubin & tekstil | SVG | `size` 0–1 (0.3) · `gap` 0–1 (0.1) · `fill` 0–1 (0.5) | Sel segi enam yang saling menempel seperti sarang lebah. | — |
| 27 | `bauhaus` | Bauhaus shapes | Geometri | SVG | `grid` 2–8 (4) · `variety` 0–1 (0.6) | Grid berisi lingkaran, setengah lingkaran, seperempat lingkaran, dan kotak berwarna tegas. | — |
| 33 | `phyllotaxis` | Phyllotaxis | Matematika | SVG | `points` 100–2000 (600) · `size` 0–1 (0.4) · `spread` 0–1 (0.5) | Titik-titik yang tersusun spiral dengan sudut emas, seperti biji bunga matahari. | Batasi jumlah titik; beban sedang. |
| 64 | `papercut` | Papercut layers | Lanskap | SVG | `layers` 3–10 (5) · `wave` 0–1 (0.5) · `shadow` 0–1 (0.4) | Lapisan kertas bergelombang yang bertumpuk dengan bayangan lembut. | Bayangan ditiru dengan pita gradien tipis di bawah tepi tiap lapisan, tanpa filter blur (ENG-06). |
| 71 | `wavy-stripes` | Wavy stripes | Garis & aliran | SVG | `lines` 6–40 (16) · `amplitude` 0–1 (0.3) · `frequency` 1–8 (3) | Garis-garis sejajar yang bergelombang bersama. | — |
| 74 | `mondrian` | Mondrian / treemap | Geometri | SVG | `splits` 3–30 (10) · `fill` 0–1 (0.4) · `stroke` 0–1 (0.3) | Bidang yang dibagi acak menjadi persegi panjang, sebagian diisi warna primer. | Warna mengikuti palet, tidak harus warna primer. |
| 79 | `conic-gradient` | Conic gradient | Gradasi | SVG | `center` 0–1 (0.5) · `twist` 0–1 (0) | Gradasi warna yang berputar mengitari satu titik pusat, seperti roda warna. | SVG tidak punya gradien konik bawaan; susun dari banyak irisan tipis. |
| 94 | `pine-forest` | Pine forest layers | Lanskap | SVG | `layers` 3–8 (5) · `density` 0–1 (0.5) · `fog` 0–1 (0.4) | Siluet hutan pinus berlapis dengan kabut di antaranya. | — |

## Fase 3 (57 pola)

| No | ID | Pola | Kategori | Render | Parameter | Penjelasan | Catatan |
|---|---|---|---|---|---|---|---|
| 10 | `halftone` | Halftone | Retro & digital | SVG, berat | `cell` 0–1 (0.3) · `angle` 0–90 (45) · `contrast` 0–1 (0.6) | Titik-titik yang ukurannya mengikuti terang-gelap, seperti hasil cetak koran lama. | Batasi jumlah titik. |
| 12 | `flow-field` | Flow field | Garis & aliran | SVG, berat | `lines` 100–3000 (800) · `length` 0–1 (0.5) · `scale` 0–1 (0.4) | Ribuan garis yang mengikuti arah medan noise, tampak seperti aliran air atau angin. | Batasi jumlah garis agar file SVG tetap kecil. |
| 16 | `clouds` | Clouds | Langit & cuaca | SVG | `count` 2–12 (5) · `softness` 0–1 (0.7) · `height` 0–1 (0.6) | Bentuk awan lembut dan blur di atas gradasi langit. | Kelembutan dari kumpulan lingkaran ber-`radialGradient`, tanpa filter blur (ENG-06). |
| 20 | `fractal` | Fractal | Matematika | SVG | `shape` triangle/carpet (triangle) · `depth` 1–7 (5) | Bentuk yang mengulang dirinya dalam skala makin kecil, misalnya segitiga Sierpinski. | Kedalaman di atas 7 membuat elemen terlalu banyak. |
| 22 | `chevron` | Chevron / zigzag | Ubin & tekstil | SVG | `size` 0–1 (0.3) · `angle` 20–70 (45) · `weight` 0–1 (0.4) | Garis siku bergerigi yang berulang membentuk pola V. | — |
| 23 | `isometric-cubes` | Isometric cubes | Geometri | SVG | `size` 0–1 (0.3) · `shade` 0–1 (0.5) | Kubus yang tampak 3D, tersusun dari tiga belah ketupat dengan tiga tingkat terang. | Tiga tingkat terang diambil dari satu warna palet. |
| 24 | `argyle` | Argyle | Ubin & tekstil | SVG | `size` 0–1 (0.4) · `lines` 0–1 (0.3) | Belah ketupat berwarna yang dilapisi garis diagonal bersilang, seperti motif kaus kaki. | — |
| 25 | `plaid` | Plaid / tartan | Ubin & tekstil | SVG | `bands` 2–8 (4) · `width` 0–1 (0.4) · `opacity` 0–1 (0.5) | Lajur horizontal dan vertikal berlapis yang saling menimpa seperti kain kotak-kotak. | — |
| 26 | `scales` | Scales | Ubin & tekstil | SVG | `size` 0–1 (0.3) · `outline` 0–1 (0.2) | Setengah lingkaran berundak seperti sisik ikan atau genteng. | — |
| 28 | `memphis` | Memphis / confetti | Geometri | SVG | `count` 10–80 (30) · `size` 0–1 (0.4) | Squiggle, segitiga, titik, dan zigzag yang meriah bergaya desain 80-an. | — |
| 29 | `terrazzo` | Terrazzo | Ubin & tekstil | SVG | `chips` 50–600 (200) · `size` 0–1 (0.3) | Serpihan bentuk kecil acak yang tersebar seperti lantai terrazzo. | Beban sedang. |
| 30 | `moire` | Moiré | Garis & aliran | SVG | `mode` lines/circles (lines) · `lines` 20–200 (80) · `offset` 0–1 (0.2) | Dua set garis atau lingkaran bertumpuk yang memunculkan pola interferensi bergelombang. | Beban sedang. |
| 31 | `spirograph` | Spirograph / Lissajous | Matematika | SVG | `ratio` 0–1 (0.6) · `loops` 2–40 (12) · `weight` 0–1 (0.2) | Kurva dari perpaduan dua gerak melingkar atau sinus, seperti hasil mainan spirograf. | — |
| 32 | `rose-curves` | Rose curves / superformula | Matematika | SVG | `mode` rose/superformula (rose) · `petals` 2–12 (5) · `scale` 0–1 (0.7) | Bentuk kelopak bunga atau bintang dari rumus koordinat polar. | — |
| 34 | `circle-packing` | Circle packing | Geometri | SVG | `count` 20–600 (150) · `gap` 0–1 (0.1) | Lingkaran beragam ukuran yang memenuhi bidang tanpa saling tumpang tindih. | Penempatannya mahal dihitung; batasi jumlah lingkaran agar sesuai ENG-07. |
| 35 | `ripple` | Ripple | Garis & aliran | SVG | `sources` 1–6 (3) · `rings` 5–40 (16) | Riak melingkar dari beberapa titik yang saling bertemu, seperti tetes air di kolam. | — |
| 36 | `plexus` | Plexus | Garis & aliran | SVG | `points` 20–300 (80) · `distance` 0–1 (0.3) | Titik-titik yang dihubungkan garis bila berdekatan, seperti jaringan atau rasi bintang. | Beban sedang. |
| 38 | `maze` | Maze / Hilbert curve | Matematika | SVG | `mode` maze/hilbert (maze) · `cell` 0–1 (0.3) · `weight` 0–1 (0.3) | Labirin acak, atau satu garis berliku yang mengisi seluruh bidang. | — |
| 39 | `cellular-automata` | Cellular automata | Matematika | SVG | `mode` rule/life (rule) · `rule` 0–255 (30) · `cell` 0–1 (0.2) | Pola dari aturan sederhana antarsel, misalnya Rule 30 atau Game of Life. | Beban sedang. |
| 44 | `starfield` | Starfield / bokeh | Langit & cuaca | SVG | `mode` stars/bokeh (stars) · `count` 20–800 (200) · `glow` 0–1 (0.4) | Bintang kecil yang tersebar, atau lingkaran cahaya blur seperti latar foto. | Bokeh dari lingkaran ber-`radialGradient` yang memudar, tanpa filter blur (ENG-06). |
| 45 | `penrose` | Penrose tiling | Ubin & tekstil | SVG | `scale` 0–1 (0.4) · `depth` 3–8 (5) | Dua bentuk ubin yang menutup bidang tanpa pernah berulang persis (aperiodik). | — |
| 46 | `kaleidoscope` | Kaleidoscope / mandala generatif | Matematika | SVG | `segments` 4–16 (8) · `complexity` 0–1 (0.5) | Potongan pola acak yang dicerminkan berulang dengan simetri radial. | — |
| 47 | `op-art` | Checkerboard / op art | Geometri | SVG | `cells` 4–24 (10) · `bulge` 0–1 (0.5) | Kotak berselang-seling, termasuk versi melengkung yang tampak menggembung (ilusi optik). | — |
| 48 | `houndstooth` | Houndstooth | Ubin & tekstil | SVG | `size` 0–1 (0.3) · `rotation` 0–45 (0) | Kotak bergerigi berulang mirip gigi anjing, motif klasik kain jas. | — |
| 49 | `herringbone` | Herringbone / basket weave | Ubin & tekstil | SVG | `mode` herringbone/basket (herringbone) · `size` 0–1 (0.3) · `gap` 0–1 (0.05) | Persegi panjang yang disusun zigzag seperti tulang ikan, atau berselang seperti anyaman keranjang. | — |
| 50 | `overlapping-circles` | Overlapping circles | Geometri | SVG | `radius` 0–1 (0.3) · `weight` 0–1 (0.2) | Lingkaran sama besar yang saling tumpang tindih membentuk kelopak geometris. | — |
| 51 | `metaballs` | Metaballs | Organik | SVG | `balls` 3–20 (8) · `threshold` 0–1 (0.5) | Bola-bola yang meleleh dan menyatu saat saling mendekat, seperti lampu lava. | Kontur lewat marching squares; beban sedang. |
| 52 | `l-system` | L-system | Organik | SVG | `type` tree/fern (tree) · `depth` 3–8 (5) · `angle` 10–45 (25) | Pohon, pakis, atau tanaman yang tumbuh dari aturan rekursif. | — |
| 56 | `stippling` | Stippling | Retro & digital | SVG, berat | `dots` 500–8000 (3000) · `contrast` 0–1 (0.6) | Titik-titik dengan kerapatan bervariasi yang membentuk gelap-terang, gaya pointilis. | Batasi jumlah titik. |
| 57 | `crosshatch` | Crosshatch | Garis & aliran | SVG | `density` 0–1 (0.5) · `layers` 1–4 (2) · `angle` 0–90 (45) | Arsiran garis yang saling menyilang untuk membentuk bayangan, seperti sketsa pena. | Beban sedang. |
| 58 | `mosaic` | Mosaic / pixel blocks | Retro & digital | SVG | `cell` 0–1 (0.2) · `jitter` 0–1 (0.2) | Kotak-kotak warna kasar seperti piksel besar atau ubin mosaik. | — |
| 59 | `circuit` | Circuit traces | Retro & digital | SVG | `traces` 10–200 (60) · `pads` 0–1 (0.4) | Jalur bersudut 45° dengan titik sambungan, seperti papan sirkuit elektronik. | — |
| 61 | `ribbons` | Ribbons / silk | Garis & aliran | SVG | `ribbons` 1–8 (3) · `twist` 0–1 (0.5) · `sheen` 0–1 (0.5) | Pita atau kain sutra yang melengkung lembut dengan kilap bergradasi. | Kilap dari gradien linear di sepanjang pita. |
| 62 | `synthwave` | Synthwave | Retro & digital | SVG | `horizon` 0–1 (0.55) · `grid` 6–40 (16) · `sun` 0–1 (0.6) | Grid perspektif menuju cakrawala dengan matahari bergaris, gaya retro 80-an. | — |
| 63 | `wireframe-terrain` | Wireframe terrain | Lanskap | SVG | `rows` 10–80 (30) · `height` 0–1 (0.5) · `perspective` 0–1 (0.5) | Jaring garis 3D bergelombang seperti permukaan peta digital. | Beban sedang. |
| 65 | `origami` | Origami folds | Geometri | SVG | `folds` 4–40 (12) · `shade` 0–1 (0.5) | Bidang-bidang segitiga dengan terang-gelap berbeda, seperti kertas yang dilipat. | — |
| 66 | `crackle` | Crackle | Organik | SVG | `cracks` 20–300 (100) · `weight` 0–1 (0.2) | Pola retakan seperti tanah kering atau glasir keramik. | Bisa memakai tepi sel Voronoi. |
| 67 | `agate` | Agate / geode | Organik | SVG | `bands` 5–40 (15) · `wobble` 0–1 (0.5) | Pita warna berlapis tidak beraturan seperti irisan batu akik. | Kontur noise; beban sedang. |
| 69 | `string-art` | String art | Garis & aliran | SVG | `pins` 20–200 (80) · `step` 2–60 (17) | Garis lurus yang menghubungkan titik-titik di tepi hingga membentuk kurva. | — |
| 70 | `waveform` | Waveform / equalizer | Retro & digital | SVG | `bars` 16–160 (64) · `height` 0–1 (0.6) · `gap` 0–1 (0.3) | Batang vertikal dengan tinggi bervariasi seperti visualisasi audio. | — |
| 73 | `holographic` | Holographic / iridescent | Gradasi | SVG | `bands` 2–8 (4) · `angle` 0–360 (120) · `shift` 0–1 (0.5) | Gradasi pelangi metalik seperti permukaan stiker hologram. | Kesan metalik dari banyak titik gradien. |
| 75 | `golden-spiral` | Golden spiral | Matematika | SVG | `turns` 4–12 (8) · `weight` 0–1 (0.3) | Persegi berukuran deret Fibonacci dengan busur spiral emas yang menyambungkannya. | — |
| 76 | `hyperbolic` | Hyperbolic tiling | Matematika | SVG | `order` 4–8 (5) · `depth` 2–5 (3) | Ubin yang makin kecil menuju tepi lingkaran, seperti karya Escher. | Perhitungan geometrinya cukup rumit. |
| 77 | `chladni` | Chladni figures | Matematika | SVG | `n` 1–8 (3) · `m` 1–8 (5) · `weight` 0–1 (0.3) | Garis simetris dari pola getaran pelat (gelombang berdiri). | Kontur lewat marching squares; beban sedang. |
| 80 | `tunnel` | Tunnel / vortex | Garis & aliran | SVG | `rings` 8–60 (24) · `twist` 0–1 (0.2) · `center` 0–1 (0.5) | Lingkaran atau garis yang mengecil ke satu titik sehingga tampak seperti lorong. | — |
| 82 | `camouflage` | Camouflage | Organik | SVG | `scale` 0–1 (0.4) · `coverage` 0–1 (0.5) | Bercak organik bertumpuk dalam beberapa warna seperti pola kamuflase. | Kontur noise; beban sedang. |
| 84 | `wood-grain` | Wood grain | Organik | SVG | `rings` 10–80 (30) · `wobble` 0–1 (0.4) | Serat kayu dari cincin melingkar yang digoyang noise. | Beban sedang. |
| 85 | `brick` | Brick / stone wall | Ubin & tekstil | SVG | `mode` brick/stone (brick) · `size` 0–1 (0.3) · `variation` 0–1 (0.3) | Susunan bata atau batu dengan sedikit variasi warna dan ukuran. | — |
| 86 | `knit` | Knit | Ubin & tekstil | SVG | `size` 0–1 (0.3) · `thickness` 0–1 (0.5) | Pola V kecil berulang seperti rajutan wol. | — |
| 87 | `twill` | Twill / carbon fiber | Ubin & tekstil | SVG | `size` 0–1 (0.2) · `sheen` 0–1 (0.5) | Anyaman diagonal rapat dengan kilap yang bergantian. | — |
| 88 | `lightning` | Lightning | Langit & cuaca | SVG | `bolts` 1–4 (1) · `branches` 0–1 (0.5) · `roughness` 0–1 (0.6) | Petir bercabang dari garis yang dipecah dan digeser acak (midpoint displacement). | — |
| 89 | `rain-snow` | Rain / snowfall | Langit & cuaca | SVG | `mode` rain/snow (rain) · `density` 0–1 (0.5) · `angle` 0–30 (12) | Goresan hujan miring atau butiran salju yang tersebar. | — |
| 93 | `skyline` | City skyline | Lanskap | SVG | `layers` 1–4 (3) · `density` 0–1 (0.6) · `windows` 0–1 (0.3) | Siluet gedung berlapis dengan jendela yang menyala. | — |
| 95 | `fantasy-map` | Fantasy map / archipelago | Lanskap | SVG | `land` 0–1 (0.45) · `islands` 1–20 (6) · `contours` 0–1 (0.3) | Peta pulau dengan garis pantai dari noise, seperti peta dunia fantasi. | Garis pantai dari kontur noise; beban sedang. |
| 96 | `street-map` | Street map | Lanskap | SVG | `density` 0–1 (0.5) · `curviness` 0–1 (0.3) | Jaringan jalan yang dibangkitkan secara prosedural, seperti peta kota dari atas. | — |
| 97 | `graph-paper` | Graph paper / blueprint | Retro & digital | SVG | `grid` 0–1 (0.3) · `major` 2–10 (5) | Grid kertas milimeter atau cetak biru dengan garis tipis. | — |
| 98 | `hud-radar` | HUD / radar | Retro & digital | SVG | `rings` 2–8 (4) · `ticks` 0–1 (0.5) · `sweep` 0–360 (60) | Lingkaran, garis ukur, dan sapuan radar ala antarmuka sci-fi. | — |

## Perlu keputusan (16 pola)

Pola-pola ini belum diberi fase karena render-nya perlu diputuskan dulu (Q10 di PRD): boleh dirilis sebagai pola khusus PNG, ditunda, atau dibuang.

| No | ID | Pola | Kategori | Render | Parameter | Penjelasan | Catatan |
|---|---|---|---|---|---|---|---|
| 37 | `marbling` | Marbling | Organik | Piksel | `swirl` 0–1 (0.6) · `scale` 0–1 (0.5) | Warna yang mengalir dan berpilin seperti marmer atau kertas marmer. | — |
| 40 | `reaction-diffusion` | Reaction-diffusion | Organik | Piksel, berat | `feed` 0–1 (0.5) · `kill` 0–1 (0.5) · `steps` 500–5000 (2000) | Simulasi dua zat yang bereaksi dan menyebar sehingga membentuk belang dan bintik seperti kulit hewan. | Simulasi ribuan langkah; jauh melewati batas ENG-07. |
| 41 | `dithering` | Dithering | Retro & digital | Piksel | `levels` 2–8 (4) · `method` bayer/diffusion (bayer) | Gradasi yang dibentuk dari titik-titik dengan sedikit warna, seperti grafis game lawas. | Bisa juga menjadi efek di atas pola lain. |
| 42 | `glitch` | Glitch | Retro & digital | Piksel | `slices` 5–60 (20) · `shift` 0–1 (0.3) · `split` 0–1 (0.4) | Potongan gambar yang bergeser dan kanal warna yang terpisah, seperti gangguan digital. | Butuh gambar dasar; bisa memakai pola lain sebagai dasar. |
| 53 | `mandelbrot` | Mandelbrot / Julia set | Matematika | Piksel, berat | `mode` mandelbrot/julia (mandelbrot) · `zoom` 0–1 (0.3) · `iterations` 50–500 (200) | Fraktal klasik dari bilangan kompleks dengan tepi yang detailnya tak berujung. | — |
| 54 | `domain-warp` | Domain warping | Organik | Piksel | `scale` 0–1 (0.4) · `warp` 0–1 (0.6) | Noise yang dibengkokkan oleh noise lain sehingga tampak seperti cat cair atau asap. | — |
| 55 | `dla` | Diffusion-limited aggregation | Organik | SVG, berat | `particles` 1000–20000 (6000) · `stickiness` 0–1 (0.8) | Partikel yang menempel satu per satu membentuk percabangan seperti koral atau kristal es. | Hasilnya bisa SVG, tetapi simulasinya melewati batas ENG-07. |
| 60 | `digital-rain` | Digital rain | Retro & digital | Glyph | `columns` 10–80 (30) · `length` 0–1 (0.5) | Kolom karakter yang jatuh dari atas dengan jejak yang memudar. | — |
| 68 | `strange-attractor` | Strange attractor | Matematika | Piksel, berat | `type` lorenz/clifford (clifford) · `points` 100000–2000000 (500000) | Jutaan titik dari rumus Lorenz atau Clifford yang membentuk pusaran halus. | — |
| 78 | `plasma` | Plasma | Gradasi | Piksel | `scale` 0–1 (0.4) · `waves` 2–8 (4) | Gradasi warna bergelombang dan berpilin dari penjumlahan fungsi sinus, efek klasik demoscene. | — |
| 81 | `tie-dye` | Tie-dye | Organik | Piksel | `rings` 3–20 (8) · `bleed` 0–1 (0.5) | Spiral warna-warni dengan tepi meresap seperti kain celup ikat. | — |
| 83 | `watercolor` | Watercolor wash | Organik | Piksel | `layers` 3–20 (8) · `bleed` 0–1 (0.6) | Lapisan warna transparan dengan tepi menyebar seperti cat air. | Bisa ditiru dengan filter SVG, tetapi berat. |
| 91 | `pixel-sort` | Pixel sorting | Retro & digital | Piksel | `threshold` 0–1 (0.5) · `direction` vertical/horizontal (vertical) | Piksel yang diurutkan berdasarkan terang-gelap menjadi goresan gradasi panjang. | Butuh gambar dasar. |
| 92 | `ascii` | ASCII / typographic | Retro & digital | Glyph | `cell` 0–1 (0.2) · `charset` compact/full (compact) | Karakter teks yang disusun membentuk gradasi terang-gelap. | — |
| 99 | `fractal-flame` | Fractal flame | Matematika | Piksel, berat | `functions` 2–8 (4) · `points` 100000–2000000 (500000) | Lengkung cahaya lembut dari sistem fungsi iterasi (IFS). | — |
| 100 | `newton-fractal` | Newton fractal | Matematika | Piksel, berat | `degree` 3–8 (3) · `iterations` 20–200 (60) | Fraktal dari metode Newton mencari akar persamaan, dengan pita warna tajam. | — |

## Efek lapisan (4 entri)

Entri ini bukan pola mandiri, melainkan lapisan opsional di atas pola lain. Grain, scanlines, dan light leaks masuk efek lapisan ENG-09 (P2, menunggu Q6) dan tersimpan di link sebagai kunci `fx`; reeded glass mengikuti Q10.

| No | ID | Efek | Render | Parameter | Penjelasan | Catatan |
|---|---|---|---|---|---|---|
| 17 | `grain` | Noise / grain | SVG + filter | `amount` 0–1 (0.2) · `size` 0–1 (0.3) | Tekstur bintik halus seperti butiran film, biasanya jadi lapisan tambahan. | Butuh filter noise (`feTurbulence`). Juga mengurangi banding gradien di PNG. |
| 43 | `scanlines` | Scanlines | SVG | `spacing` 0–1 (0.2) · `opacity` 0–1 (0.3) | Garis horizontal tipis berulang seperti layar TV tabung (CRT). | — |
| 72 | `reeded-glass` | Reeded glass | Piksel | `ribs` 10–80 (30) · `distortion` 0–1 (0.4) | Efek kaca bergaris vertikal yang membiaskan warna di belakangnya. | Membiaskan pola di belakangnya, jadi butuh piksel. |
| 90 | `light-leaks` | Light leaks / lens flare | SVG | `leaks` 1–4 (2) · `warmth` 0–1 (0.6) · `flare` 0–1 (0.3) | Bocoran cahaya hangat dan lingkaran silau seperti foto film analog. | Cahaya dari `radialGradient` besar yang memudar, tanpa filter (ENG-06). |
