# Atlas Ekonomi Kreatif Jakarta

Atlas spasial ekonomi kreatif Jakarta: sebaran aset kreatif dari dua sumber data terbuka, akses penduduk ke ruang kreatif publik di 42 kecamatan, dan usulan lokasi Simpul Kreatif.

Aplikasi ini adalah pendamping karya tulis **Jakarta Economic Forum (JEF) 2026**, Topik 4: Penguatan Infrastruktur Pendukung Ekonomi Kreatif Jakarta.

**Aplikasi:** https://barata90.github.io/atlas-ekraf-jakarta/

## Temuan utama

| Temuan | Angka |
|---|---|
| Aset kreatif (OpenStreetMap / Overture Maps) | 2.917 / 25.320 titik, 12 subsektor |
| Pangsa kuliner (Overture) | 85 persen |
| Moran's I (autokorelasi spasial), OSM / Overture | 0,368 / 0,291, p ≤ 0,0001 |
| Selisih akses ruang kreatif publik per 100 ribu penduduk | 90,1 (Kebayoran Baru) vs 5,9 (Kalideres) |
| Penduduk dengan akses rendah | 1,77 juta jiwa (16,1 persen) |
| Prioritas utama | Cakung, Kalideres, Cengkareng, Cilincing, Cipayung, Tanjung Priok |
| Jangkauan sembilan lokasi usulan Simpul Kreatif | 48,9 persen penduduk dengan akses rendah |

## Metode singkat

- Aset: OpenStreetMap (snapshot 2026) dan Overture Maps Places (confidence score ≥ 0,5); titik berjarak kurang dari 30 m dianggap aset yang sama.
- Penduduk: WorldPop 100 m, dikalibrasi ke jumlah penduduk resmi kecamatan (Disdukcapil 2025; BPS 2024 untuk Jakarta Utara).
- Pola: Moran's I, LISA (Local Indicators of Spatial Association) dengan koreksi FDR (false discovery rate), DBSCAN, pada grid H3 resolusi 8.
- Akses: 2SFCA (two-step floating catchment area) per piksel penduduk, dengan buffer (zona penyangga) 3 km di luar batas kota.
- Lokasi: MCLP (maximal covering location problem) atas pasar, balai warga, dan kantor pemerintahan; ketahanan prioritas diuji pada 48 skenario.

## Struktur

```
index.html                 halaman utama
assets/js/data.js          data hasil analisis (dibuat oleh scripts/export_web_data.py)
assets/js/narrative.js     penyusun profil otomatis per kecamatan
assets/js/interpretasi.js  interpretasi otomatis (modal) saat batang, kartu, tabel, atau peta di-klik
assets/js/app.js           peta skematik, pencarian, kartu, tabel, dan pemicu interpretasi
figures/                   peta hasil analisis
scripts/export_web_data.py ekspor tabel notebook Tahap 3 ke data.js
```

Memperbarui data setelah notebook dijalankan ulang:

```
python scripts/export_web_data.py --tabel outputs/revisi/tables \
  --hasil data/processed/hasil_tahap3.json --keluaran assets/js/data.js
```

## Lisensi

Kode: MIT. Data turunan OpenStreetMap: ODbL (© OpenStreetMap contributors). Overture Maps: CDLA Permissive 2.0. WorldPop: CC-BY 4.0.
