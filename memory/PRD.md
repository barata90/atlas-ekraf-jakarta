# Atlas Ekonomi Kreatif Jakarta — PRD

## Problem statement (asli)
Repo: github.com/barata90/atlas-ekraf-jakarta (situs statis HTML/CSS/JS, GitHub Pages).
Permintaan user (Indonesia): beberapa item kurang interpretasi otomatis saat di-klik;
grafik batang dan elemen lain sebaiknya juga punya interpretasi otomatis saat di-klik;
serta buat desain lebih mewah/premium.

## Pilihan user
- Interpretasi otomatis untuk SEMUA elemen.
- Berbasis aturan/rumus (offline, tanpa backend/AI).
- Palet coral+gelap dipertahankan, dipoles premium.
- Output tetap situs statis (index.html + assets) untuk GitHub Pages.
- Bahasa Indonesia.

## Arsitektur
Situs statis murni. index.html + assets/css/style.css + assets/js/{data,narrative,interpretasi,app}.js.
Dipreview lokal via `python3 -m http.server 3000` dari /app (tidak pakai supervisor frontend/backend).

## Yang sudah diimplementasikan (2026-06)
- assets/js/interpretasi.js (BARU): modul INTERP, mesin interpretasi berbasis aturan +
  modal premium (glass, backdrop blur, aksen emas/coral). Generator: subsektor, klaster,
  kecamatan (pakai NARASI.tulis), sensitivitas, lokasi, peta.
- app.js: setiap elemen kini membuka modal interpretasi saat di-klik/Enter:
  batang subsektor, kartu klaster, kartu prioritas (profil kecamatan), baris tabel
  sensitivitas, baris tabel lokasi usulan, gambar peta (kepadatan/lisa/akses),
  dan heksagon hero. Heksagon di seksi profil tetap memperbarui kartu samping.
  Tambahan: bar progres baca (#progres).
- style.css: peningkatan premium — glassmorphism pada panel/kartu/modal, film grain,
  aura radial halus, judul hero gradien, tombol metrik gradien+glow, hover micro-interaction,
  affordance "＋ interpretasi" + petunjuk "klik untuk interpretasi", scrollbar/selection kustom.
- index.html: markup modal + overlay + progres, figur peta dapat di-klik, baris petunjuk,
  data-testid di semua elemen interaktif.

## Status pengujian
testing_agent iteration_1: frontend 100%, tanpa error console, semua alur terverifikasi.

## Backlog / P1-P2
- (P2) Opsi bagikan/salin teks interpretasi.
- (P2) Interpretasi otomatis untuk heksagon di seksi profil (saat ini update kartu samping saja).
- (P2) Mode terang penuh / toggle tema.
