# Atlas Ekonomi Kreatif Jakarta

Diagnosis spasial ekonomi kreatif Jakarta — memetakan **2.924 aset kreatif**, mengujinya secara statistik, lalu menerjemahkan hasilnya menjadi prioritas kebijakan per kecamatan.

Aplikasi web ini adalah pendamping interaktif untuk karya tulis **Jakarta Economic Forum (JEF) 2026**, topik penguatan infrastruktur pendukung ekonomi kreatif.

**Demo:** https://barata90.github.io/atlas-ekraf-jakarta/

---

## Apa yang ditemukan

| Temuan | Angka |
|---|---|
| Aset kreatif berbasis tempat dipetakan | 2.924 titik, 12 subsektor |
| Pangsa kuliner | 87,1% (hanya 378 aset non-kuliner) |
| Autokorelasi spasial (Moran's I) | 0,369 · z = 18,84 · p = 0,001 |
| Sel "gurun kreatif" (LISA Low-Low) | 186 dari 870 sel — melonjak jadi 335 tanpa kuliner |
| Klaster organik (DBSCAN) | 34 klaster, memuat 67,2% aset |
| Penduduk di 9 kecamatan prioritas | 2.489.452 jiwa |
| Kecamatan dengan **nol** aset non-kuliner | Johar Baru, Duren Sawit (470.883 jiwa) |

Pola klaster diuji pada **empat skenario**. Semuanya signifikan — termasuk ketika seluruh venue kuliner dikeluarkan. Pada resolusi kasar, Moran's I tanpa kuliner (0,434) justru sedikit lebih tinggi daripada dengan kuliner (0,425). Konsentrasi kreatif Jakarta bukan bayangan sebaran restoran.

---

## Yang membuat aplikasi ini berbeda

**Narasi interpretatif otomatis.** Tiap kecamatan dibacakan ulang dari angkanya sendiri oleh mesin narasi di [`assets/js/narrative.js`](assets/js/narrative.js) — bukan teks siap pakai. Mesin ini mengklasifikasikan profil statistik wilayah, memilih struktur kalimat yang sesuai, menerjemahkan angka ke skala manusia ("satu aset dipakai bersama 19.660 orang"), lalu membandingkannya dengan rata-rata kota. Kalimatnya menolak mengklaim hal yang tidak didukung data: bila jumlah aset terlalu kecil untuk disimpulkan, narasi mengatakannya.

**Heksagon sebagai motif struktural.** Grid H3 memang unit analisis dalam risetnya, jadi heksagon bukan hiasan. Peta utamanya berupa *tilegram* — 44 kecamatan disusun mengikuti letak geografis relatifnya.

**Warna yang membawa arti statistik.** Palet coral ↔ teal mengikuti konvensi diverging LISA: coral untuk konsentrasi, teal untuk ketiadaan.

---

## Menjalankan secara lokal

Tidak ada proses build. Cukup layani foldernya lewat HTTP:

```bash
git clone https://github.com/barata90/atlas-ekraf-jakarta.git
cd atlas-ekraf-jakarta
python3 -m http.server 8000
# buka http://localhost:8000
```

> Membuka `index.html` langsung lewat `file://` juga bisa, tetapi HTTP lebih disarankan.

## Memublikasikan ke GitHub Pages

Settings → Pages → Source: **Deploy from a branch** → Branch: `main`, folder `/ (root)` → Save.
Situs terbit di `https://barata90.github.io/atlas-ekraf-jakarta/` dalam beberapa menit.
Berkas `.nojekyll` sudah disertakan agar folder `assets/` tidak diabaikan Jekyll.

---

## Struktur

```
├── index.html                  Halaman tunggal
├── assets/
│   ├── css/style.css           Sistem desain
│   └── js/
│       ├── data.js             Hasil analisis (dihasilkan otomatis)
│       ├── narrative.js        Mesin narasi interpretatif
│       └── app.js              Tilegram, metrik, pencarian
├── figures/                    Peta geografis hasil analisis
└── scripts/
    └── export_web_data.py      Regenerasi data.js dari keluaran notebook
```

## Memperbarui data

Bila analisis dijalankan ulang, regenerasi `data.js` dari tabel keluaran notebook:

```bash
python3 scripts/export_web_data.py --tables /path/ke/outputs/tables --out assets/js/data.js
```

---

## Metode singkat

Aset kreatif diambil dari OpenStreetMap melalui Overpass API, diklasifikasikan ke 12 subsektor berbasis tempat. Analisis statistik berjalan pada grid heksagonal **H3 resolusi 8** (870 sel, ±0,75 km²) untuk menghindari *Modifiable Areal Unit Problem* — bias yang timbul dari bentuk dan ukuran unit administratif yang sangat tidak seragam. Kepadatan penduduk dari raster **WorldPop 100 m**.

Metode: Moran's I (autokorelasi global), LISA (klaster lokal), Getis-Ord Gi* (titik panas), DBSCAN (klaster organik, radius 400 m), entropi Shannon (diversitas subsektor), serta Indeks Kecukupan Infrastruktur Kreatif (IKIK) yang disusun penulis.

## Keterbatasan

Dinyatakan terbuka, karena ikut menentukan cara membaca hasilnya:

1. Kelengkapan OpenStreetMap tidak seragam antar subsektor. Kriya (2 titik) dan coworking (7 titik) hampir pasti tercatat di bawah kondisi sebenarnya — ini keterbatasan pencatatan, bukan kesimpulan bahwa aktivitasnya tidak ada.
2. Analisis mengukur **keberadaan** aset, bukan besaran ekonominya. Galeri kecil dan pusat seni besar sama-sama satu titik.
3. Subsektor murni digital (aplikasi, gim) tidak punya jejak lokasi konsisten sehingga tidak tertangkap.
4. Data populasi WorldPop adalah estimasi model berbasis grid, bukan sensus langsung.

Temuan pola klaster tetap kokoh karena diuji pada empat skenario, termasuk yang mengeluarkan subsektor dominan.

---

## Lisensi

- **Kode**: MIT — lihat [LICENSE](LICENSE)
- **Data turunan**: ODbL, mengikuti lisensi sumbernya

## Atribusi data

- Aset kreatif, batas wilayah, transit: © OpenStreetMap contributors, lisensi [ODbL](https://www.openstreetmap.org/copyright)
- Populasi: [WorldPop](https://hub.worldpop.org), University of Southampton, CC-BY 4.0
- Data diakses 24 Juli 2026
