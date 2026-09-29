# Data

Folder ini mengikuti struktur folder kerja notebook: masukan dan keluaran antara ada di `data/processed/`, masukan manual ada di `data/raw/`. Semua berkas di sini dibaca atau ditulis oleh run notebook Tahap 3 (27 September 2026); kolom "Dibuat oleh" menunjukkan tahap yang menghasilkan tiap berkas.

## data/processed

| Berkas | Isi | Dibuat oleh |
|---|---|---|
| `poi_creative.gpkg` | Snapshot aset kreatif OpenStreetMap, Juli 2026 (layer `poi`, `poi_unique`, `poi_kecamatan`) | Tahap 1 |
| `transit.gpkg` | Stasiun rel dan halte bus dari OpenStreetMap (layer `stations`, `bus_stops`) | Tahap 1 |
| `kecamatan_bersih.gpkg` | Batas kecamatan hasil partisi Tahap 2 (44 unit; Tahap 3 memakai 42 kecamatan daratan) | Tahap 2 |
| `osm_rujukan_snapshot_v2.gpkg` | Snapshot seluruh POI OSM (amenity, shop, office, craft, tourism) di 42 kecamatan dan cincin 3 km, diakses 2026-09-25T00:18:48 UTC | Tahap 3, SEL 3 |
| `osm_rujukan_provenance_v2.json` | Catatan asal data snapshot OSM: waktu akses, mirror Overpass, kueri, jumlah fitur | Tahap 3, SEL 3 |
| `overture_places_jakarta.parquet` | Overture Maps Places di 42 kecamatan dan cincin 3 km (256.927 tempat), diakses 2026-09-25 | Tahap 3, SEL 3b |
| `overture_provenance.json` | Catatan asal data Overture | Tahap 3, SEL 3b |
| `h3_res8.gpkg` | Grid H3 res 8 terpotong batas beserta hasil LISA, Gi*, dan penduduk akses rendah per sel | Tahap 3, SEL 11 |
| `lokasi_simpul_mclp.gpkg` | Sembilan lokasi usulan Simpul Kreatif (MCLP) | Tahap 3, SEL 11 |
| `hasil_tahap3.json` | Parameter, angka ringkasan, dan seluruh kalimat interpretasi hasil run | Tahap 3, SEL 11 |

Tabel keluaran Tahap 3 ada di `outputs/tahap3/tables/` dan gambarnya di `outputs/tahap3/figures/`.

## data/raw

`penduduk_resmi_kecamatan.csv` berisi penduduk resmi 42 kecamatan yang dipakai SEL 5 Tahap 3 untuk mengalibrasi WorldPop: Registrasi Disdukcapil 2025 untuk 36 kecamatan dan Proyeksi BPS 2024 untuk 6 kecamatan Jakarta Utara (total 10.957.909 jiwa). Berkas ini disusun ulang dari kolom `penduduk_resmi`, `tahun_data`, dan `sumber` pada `outputs/tahap3/tables/tabel_penduduk_worldpop_vs_resmi.csv`, sehingga angkanya sama dengan yang dibaca notebook Tahap 3.

## Yang tidak disertakan

- Raster penduduk WorldPop (CC-BY 4.0), karena ukurannya. Unduh `idn_pop_2026_CN_100m_R2025A_v1.tif` dari https://hub.worldpop.org/ (Indonesia, 100 m, constrained, rilis R2025A), simpan di `data/raw/`, lalu jalankan notebook Tahap 1 untuk membuat `data/processed/worldpop_jakarta.tif`.
- `jakarta_studyarea.gpkg` keluaran Tahap 1 (masukan Tahap 2). Berkas ini dibuat ulang saat notebook Tahap 1 dijalankan.

## Lisensi

Data OpenStreetMap © OpenStreetMap contributors, tersedia di bawah Open Database License (ODbL). Basis data turunan OpenStreetMap di folder ini juga berlisensi ODbL. Overture Maps Places: CDLA Permissive 2.0 (Overture Maps Foundation). Turunan WorldPop: CC-BY 4.0.
