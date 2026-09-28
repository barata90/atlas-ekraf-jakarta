# Atlas Ekonomi Kreatif Jakarta

Atlas spasial ekonomi kreatif Jakarta: sebaran aset kreatif dari dua sumber data terbuka, akses penduduk ke ruang kreatif publik di 42 kecamatan, dan usulan lokasi Simpul Kreatif.

Repositori ini adalah pendamping karya tulis **Jakarta Economic Forum (JEF) 2026**, Topik 4: Penguatan Infrastruktur Pendukung Ekonomi Kreatif Jakarta. Isinya aplikasi web, notebook pengolahan, tabel dan gambar hasil, serta data masukan beserta catatan asal datanya (provenance).

**Aplikasi:** https://barata90.github.io/atlas-ekraf-jakarta/

Semua angka di README dan aplikasi web berasal dari run final notebook Tahap 3 tanggal 27 September 2026 (`data/processed/hasil_tahap3.json`, `run_utc` 2026-09-27T19:09:59Z).

## Temuan utama

| Temuan | Angka |
|---|---|
| Aset kreatif OpenStreetMap / Overture Maps | 2.917 / 25.513 titik, 12 subsektor |
| Pangsa kuliner (Overture) | 84 persen |
| Moran's I (autokorelasi spasial): seluruh aset OSM / aset non-kuliner Overture | 0,368 / 0,282, keduanya p ≤ 0,0001 |
| Median akses kota (berbobot penduduk) | 14,6 ruang kreatif publik per 100 ribu penduduk; ambang akses rendah 7,3 |
| Akses per 100 ribu penduduk, tertinggi dan terendah | 90,1 (Kebayoran Baru) dan 5,9 (Kalideres) |
| Penduduk dengan akses rendah | 1,77 juta jiwa (16,1 persen); 2,19 juta bila kategori venue musik Overture dibuang |
| Prioritas utama (≥ 80 persen dari 48 skenario) | Cakung, Kalideres, Cengkareng, Cilincing, Cipayung, Tanjung Priok |
| Prioritas lanjutan (50 sampai 79 persen) | Koja, Ciracas |
| Jangkauan sembilan lokasi usulan Simpul Kreatif | 848.937 jiwa: 48,8 persen penduduk akses rendah di sel dengan data memadai, atau 48,1 persen dari seluruh penduduk akses rendah |

Cakupan sembilan lokasi peka terhadap radius layanan (median 23 persen pada radius 1 km dan 87 persen pada 2,5 km). Cipayung, Tanjung Priok, dan Ciracas belum terjangkau satu pun lokasi usulan.

## Metode singkat

- Aset: OpenStreetMap (snapshot Juli 2026) dan Overture Maps Places (confidence score ≥ 0,5); titik dari kedua sumber yang berjarak kurang dari 30 m dianggap aset yang sama.
- Penduduk: WorldPop 100 m, dikalibrasi ke jumlah penduduk resmi kecamatan (Registrasi Disdukcapil 2025 untuk 36 kecamatan; Proyeksi BPS 2024 untuk 6 kecamatan Jakarta Utara).
- Pola: Moran's I, LISA (Local Indicators of Spatial Association) dengan koreksi FDR (false discovery rate), dan DBSCAN, pada grid H3 resolusi 8 yang dipotong batas daratan.
- Akses: 2SFCA (two-step floating catchment area) per piksel penduduk, dengan buffer (zona penyangga) 3 km di luar batas kota.
- Lokasi: MCLP (maximal covering location problem) atas pasar, balai warga, dan kantor pemerintahan; ketahanan daftar prioritas diuji pada 48 skenario.
- Keterbatasan data: cek manual 100 sampel venue musik Overture menemukan 53 persen entri bukan ruang kreatif (selang kepercayaan 95 persen: 43,3 sampai 62,5 persen). Karena itu penduduk akses rendah dan cakupan simpul dibaca sebagai rentang antara skenario utama dan skenario tanpa kategori venue musik.

## Isi repositori

```
index.html                    halaman utama aplikasi web
assets/js/data.js             data aplikasi (dibuat oleh scripts/export_web_data.py, jangan disunting manual)
assets/js/narrative.js        penyusun profil otomatis per kecamatan
assets/js/interpretasi.js     interpretasi otomatis (modal) saat batang, kartu, tabel, atau peta di-klik
assets/js/app.js              peta skematik, pencarian, kartu, tabel, dan pemicu interpretasi
figures/                      peta untuk aplikasi web (potongan Gambar R1, R2, R5 run final)
notebooks/                    notebook pengolahan Tahap 1, 2, dan 3 beserta keluaran run-nya
data/processed/               data masukan dan keluaran antara (lihat data/README.md)
data/raw/                     penduduk resmi per kecamatan
outputs/revisi/tables/        tabel keluaran Tahap 3 (run final)
outputs/revisi/figures/       Gambar R1 sampai R10 Tahap 3 (run final)
outputs/figures/              gambar Tahap 1 dan 2 (arsip; hasil Tahap 2 dikoreksi di Tahap 3)
scripts/export_web_data.py    ekspor tabel Tahap 3 ke assets/js/data.js
scripts/potong_peta_web.py    memotong bidang peta dari Gambar R1, R2, R5 ke figures/
```

| Notebook | Isi |
|---|---|
| `01_akuisisi_pembersihan_ekraf_jakarta_v4.ipynb` | Tahap 1: batas wilayah, POI aset kreatif dan transit dari OpenStreetMap, raster WorldPop |
| `02_analisis_spasial_ekraf_jakarta.ipynb` | Tahap 2: analisis awal (Moran's I, LISA, Gi*, entropi, DBSCAN, IKIK) dan partisi batas kecamatan. Sebagian klaimnya dikoreksi di Tahap 3 (`outputs/revisi/tables/tabel_klaim_vs_revisi.csv`) |
| `03_revisi_analisis_ekraf_jakarta_v6.ipynb` | Tahap 3: revisi dan sumber seluruh angka di naskah final, slide, dan aplikasi web |

## Menjalankan ulang

1. Siapkan lingkungan Python dengan paket `numpy`, `pandas`, `geopandas`, `rasterio`, `pyproj`, `shapely`, `h3`, `scipy`, `scikit-learn`, `libpysal`, `esda`, `statsmodels`, `osmnx`, `matplotlib`, `mapclassify`, `pyarrow`, dan `jupyterlab`. Keluaran notebook mencatat geopandas 1.1.3 dan h3 4.5.0 (Tahap 3) serta osmnx 2.1.1 (Tahap 1). Paket `overturemaps` dan `duckdb` hanya dibutuhkan bila data Overture diunduh ulang.
2. Unduh raster WorldPop `idn_pop_2026_CN_100m_R2025A_v1.tif` dari https://hub.worldpop.org/ (Indonesia, 100 m, constrained, rilis R2025A) ke `data/raw/`.
3. Notebook memakai folder kerja (`Path.cwd()`) sebagai folder proyek dan membaca `data/` serta `outputs/` relatif terhadapnya. Salin notebook ke root repositori (`cp notebooks/*.ipynb .`) lalu jalankan dari sana.
4. Tahap 1: untuk membuat `data/processed/worldpop_jakarta.tif`, jalankan SEL 1, 2, dan 6. SEL 3, 4, dan 5 mengunduh ulang OpenStreetMap (`FORCE_REFRESH = True`) dan menimpa snapshot Juli di `poi_creative.gpkg` dan `transit.gpkg`, jadi lewati sel-sel ini bila ingin mereplikasi angka run final.
5. Tahap 3: **Kernel → Restart → Run All**. Notebook membaca snapshot OSM dan Overture yang tersimpan di `data/processed/` (`FORCE_REFETCH = False`), memakai seed tetap (`SEED = 42`), dan menulis tabel ke `outputs/revisi/tables/`, gambar ke `outputs/revisi/figures/`, serta `data/processed/hasil_tahap3.json`. Overture diambil dari rilis terbaru tanpa nomor rilis tetap, jadi unduhan ulang dapat memberi angka berbeda.

Memperbarui aplikasi web setelah notebook Tahap 3 dijalankan ulang (dari root repositori):

```
python scripts/export_web_data.py --tabel outputs/revisi/tables \
  --hasil data/processed/hasil_tahap3.json --keluaran assets/js/data.js
python scripts/potong_peta_web.py
```

Skrip ekspor mengambil semua angka dari tabel dan `hasil_tahap3.json`, dan berhenti dengan pesan galat bila tabel dan JSON berasal dari run yang berbeda (misalnya jumlah aset Overture, Moran's I, daftar prioritas, atau cakupan simpul tidak sama).

## Lisensi

Kode: MIT. Data turunan OpenStreetMap: ODbL (© OpenStreetMap contributors). Overture Maps: CDLA Permissive 2.0. WorldPop: CC-BY 4.0. Rincian per berkas ada di `data/README.md`.
