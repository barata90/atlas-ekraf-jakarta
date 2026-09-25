"""Ekspor data dashboard Atlas Ekonomi Kreatif Jakarta.

Membaca tabel keluaran notebook Tahap 3 (outputs/revisi/tables) dan, bila ada,
data/processed/hasil_tahap3.json, lalu menulis assets/js/data.js.

Pemakaian (dari folder proyek analisis):
    python scripts/export_web_data.py --tabel outputs/revisi/tables \
        --hasil data/processed/hasil_tahap3.json --keluaran ../atlas-ekraf-jakarta/assets/js/data.js
"""
import argparse
import json
import math
from datetime import date
from pathlib import Path

import pandas as pd

# Angka dari run notebook 25 September 2026, dipakai bila hasil_tahap3.json tidak tersedia
CADANGAN = {
    "a_ref_per100rb": 29.2,          # median akses kota (berbobot penduduk), ruang kreatif publik per 100 ribu
    "pct_tanpa_literasi": 9.8,       # penduduk tanpa toko buku/alat tulis/perpustakaan dalam 1,5 km (%)
    "pct_tanpa_perpustakaan": 36.9,  # penduduk tanpa perpustakaan dalam 1,5 km (%)
    "pangsa_literasi_pusel": 56.3,   # pangsa aset literasi di Jakarta Pusat + Selatan (%)
    "pangsa_penduduk_pusel": 30.8,   # pangsa penduduk Jakarta Pusat + Selatan (%)
    "elastisitas": 1.27,             # elastisitas aset non-kuliner terhadap tempat usaha non-kreatif (Overture)
    "moran_pangsa": 0.073,           # Moran's I pangsa aset non-kuliner (Empirical Bayes, Overture)
    "tanpa_nonkul_gabungan": 2339,   # penduduk tanpa aset non-kuliner dalam 1,5 km (OSM + Overture)
    "diakses": "2026-09-25",
}
NAMA_SUB = {
    "seni_pertunjukan": "Seni pertunjukan", "seni_rupa_galeri": "Galeri seni", "musik": "Musik",
    "film_sinema": "Film dan bioskop", "kriya": "Kriya", "fesyen": "Fesyen", "penerbitan_literasi": "Literasi",
    "desain_layanan_kreatif": "Desain", "coworking_hub": "Ruang kerja bersama", "fotografi": "Fotografi",
    "kuliner_kafe": "Kafe", "kuliner_restoran": "Restoran",
}
LABEL_MORAN = {
    "seluruh aset, res 8": "OSM, seluruh aset (H3 res 8)",
    "tanpa kuliner, res 8": "OSM, tanpa kuliner (H3 res 8)",
    "seluruh aset, res 7": "OSM, seluruh aset (H3 res 7)",
    "tanpa kuliner, res 7": "OSM, tanpa kuliner (H3 res 7)",
    "seluruh aset log1p, res 8": "OSM, seluruh aset, transformasi log (H3 res 8)",
    "Overture non-kuliner, res 8": "Overture, tanpa kuliner (H3 res 8)",
}
STATUS = {"Prioritas stabil": "Prioritas utama", "Prioritas bersyarat": "Prioritas lanjutan",
          "Prioritas utama": "Prioritas utama", "Prioritas lanjutan": "Prioritas lanjutan",
          "Perlu verifikasi data": "Perlu verifikasi data"}
JENIS = {"marketplace": "pasar", "community_centre": "balai warga", "townhall": "kantor pemerintahan",
         "social_centre": "pusat kegiatan sosial", "sel H3": "titik tengah sel"}
KATA_WAJAR = ("pasar", "gedung", "balai", "kantor", "kelurahan", "kecamatan", "pusat", "rptra", "aula", "gor", "graha", "wisma")


def r(x, d=1):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), d)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tabel", default="outputs/revisi/tables")
    ap.add_argument("--hasil", default="data/processed/hasil_tahap3.json")
    ap.add_argument("--keluaran", default="assets/js/data.js")
    a = ap.parse_args()
    T = Path(a.tabel)
    c = dict(CADANGAN)
    hp = Path(a.hasil)
    if hp.exists():
        h = json.loads(hp.read_text(encoding="utf-8"))
        akh = h.get("akses", {})
        if akh.get("a_ref_per100rb"):
            c["a_ref_per100rb"] = akh["a_ref_per100rb"]
        if akh.get("pct_tanpa_literasi") is not None:
            c["pct_tanpa_literasi"] = 100 * akh["pct_tanpa_literasi"]
        if akh.get("tanpa_nonkul") is not None:
            c["tanpa_nonkul_gabungan"] = akh["tanpa_nonkul"]
        c["diakses"] = str(h.get("run_utc", c["diakses"]))[:10]

    ak = pd.read_csv(T / "tabel_prioritas_kecamatan_revisi.csv")
    lk = pd.read_csv(T / "tabel_kelengkapan_osm_vs_overture_kecamatan.csv")
    ak = ak.merge(lk[["kecamatan", "kelengkapan_relatif"]], on="kecamatan", how="left")
    kec = []
    for _, x in ak.iterrows():
        kec.append({
            "nama": x.kecamatan, "kota": x.kabkota, "pop": int(round(x.penduduk)), "luas": r(x.luas_km2, 2),
            "akses": r(x.akses_per100rb), "akses_nk": r(x.akses_nonkul_per100rb), "rendah": int(round(x.akses_rendah)),
            "pct_rendah": r(100 * x.pct_akses_rendah), "kurang": r(x.defisit_aset, 0),
            "tanpa_nk": int(round(x.tanpa_nonkul_sama_sekali)), "jarak": r(x.jarak_aset_median_m, 0),
            "halte": r(100 * x.pct_pend_400m_halte), "stasiun": r(100 * x.pct_pend_800m_stasiun),
            "halte_rendah": r(100 * x.pct_kebutuhan_400m_halte),
            "aset_ovt": int(x.n_aset_ovt), "dens_ovt": r(x.n_aset_ovt / x.luas_km2),
            "pangsa": r(100 * x.pangsa_nonkul_ovt), "ragam": x.status_ragam_ovt,
            "aset_osm": int(x.n_aset), "nonkul_osm": int(x.n_nonkul), "cakupan": r(x.kelengkapan_relatif, 2),
            "frek": r(100 * x.frek_top9, 0), "status": STATUS.get(x.status, "-"), "peringkat": int(x.peringkat_kebutuhan),
            "ikik": r(x.IKIK_revisi, 3),
        })

    sub = pd.read_csv(T / "tabel_osm_vs_overture_subsektor.csv").rename(columns={"Unnamed: 0": "sub"})
    subsektor = [{"nama": NAMA_SUB.get(s.sub, s.sub), "kat": "Kuliner" if s.sub.startswith("kuliner") else "Non-kuliner",
                  "osm": int(s.osm_juli), "ovt": int(s.overture)} for s in sub.itertuples()]
    subsektor.sort(key=lambda s: -s["ovt"])

    mo = pd.read_csv(T / "tabel_moran_revisi.csv")
    sens = [{"skenario": LABEL_MORAN.get(m.skenario, m.skenario), "I": r(m.I, 3), "p": float(m.p),
             "hh": int(m.HH_fdr), "ll": int(m.LL_fdr), "n": int(m.n_sel)} for m in mo.itertuples()]

    kl = pd.read_csv(T / "tabel_klaster_dbscan_revisi.csv")
    klaster = [{"id": int(k.klaster), "poi": int(k.n_aset), "nonkul": int(k.n_nonkul), "pangsa": r(100 * k.pangsa_nonkul),
                "nsub": int(k.n_kategori), "ent": r(k.entropi_pooled, 3), "luas": r(k.luas_hull_km2, 2),
                "kec": k.kecamatan_utama} for k in kl.itertuples()]

    lo = pd.read_csv(T / "tabel_lokasi_simpul_mclp.csv")
    lokasi = []
    for z in lo.itertuples():
        jenis = JENIS.get(str(z.jenis), str(z.jenis))
        nama = str(z.nama)
        if not any(w in nama.lower() for w in KATA_WAJAR):
            nama = f"{jenis} (perlu verifikasi lapangan)"
        lokasi.append({"no": int(z.urutan), "kec": z.kecamatan, "nama": nama, "jenis": jenis,
                       "warga": int(round(z.tambahan_terlayani)), "kumulatif": r(100 * z.pct_kebutuhan_kumulatif),
                       "halte": int(round(z.jarak_halte_m)), "stasiun": int(round(z.jarak_stasiun_m)),
                       "lon": r(z.lon, 5), "lat": r(z.lat, 5)})

    dv = pd.read_csv(T / "tabel_diversitas_kecamatan.csv")
    pop = ak.penduduk.sum()
    rendah = ak.akses_rendah.sum()
    imax, imin = ak.akses_per100rb.idxmax(), ak.akses_per100rb.idxmin()
    moran = {m.skenario: m for m in mo.itertuples()}
    m8, mo8 = moran.get("seluruh aset, res 8"), moran.get("Overture non-kuliner, res 8")
    status = [STATUS.get(s, "-") for s in ak.status]
    nk = ~sub["sub"].str.startswith("kuliner")
    meta = {
        "n_kec": int(len(ak)), "luas": r(ak.luas_km2.sum(), 1), "pop": int(round(pop)),
        "aset_osm": int(sub.osm_juli.sum()), "nonkul_osm": int(sub[nk].osm_juli.sum()),
        "aset_ovt": int(sub.overture.sum()), "nonkul_ovt": int(sub[nk].overture.sum()),
        "rendah": int(round(rendah)), "pct_rendah": r(100 * rendah / pop),
        "a_ref": r(c["a_ref_per100rb"]), "akses_max": r(ak.akses_per100rb[imax]), "kec_max": ak.kecamatan[imax],
        "akses_min": r(ak.akses_per100rb[imin]), "kec_min": ak.kecamatan[imin],
        "halte_rendah": r(100 * (ak.pct_kebutuhan_400m_halte * ak.akses_rendah).sum() / rendah),
        "halte_semua": r(100 * (ak.pct_pend_400m_halte * ak.penduduk).sum() / pop),
        "utama": [k for k, s in zip(ak.kecamatan, status) if s == "Prioritas utama"],
        "lanjutan": [k for k, s in zip(ak.kecamatan, status) if s == "Prioritas lanjutan"],
        "moran_osm": r(m8.I, 3) if m8 else None, "moran_ovt": r(mo8.I, 3) if mo8 else None,
        "hh": int(m8.HH_fdr) if m8 else None, "ll": int(m8.LL_fdr) if m8 else None,
        "n_klaster": int(len(kl)), "mclp_cakupan": r(lokasi[-1]["kumulatif"]) if lokasi else None,
        "mclp_warga": int(sum(z["warga"] for z in lokasi)),
        "pangsa_kota_ovt": r(100 * dv.n_nonkul_ovt.sum() / dv.n_aset_ovt.sum()),
        **{k: c[k] for k in ("pct_tanpa_literasi", "pct_tanpa_perpustakaan", "pangsa_literasi_pusel",
                              "pangsa_penduduk_pusel", "elastisitas", "moran_pangsa", "tanpa_nonkul_gabungan", "diakses")},
        "diperbarui": date.today().isoformat(),
    }
    meta["rasio_akses"] = r(meta["akses_max"] / meta["akses_min"], 0)
    meta["rasio_osm_ovt"] = r(100 * meta["aset_osm"] / meta["aset_ovt"], 0)
    meta["pct_kuliner_ovt"] = r(100 * (1 - meta["nonkul_ovt"] / meta["aset_ovt"]), 0)
    meta["pct_kuliner_osm"] = r(100 * (1 - meta["nonkul_osm"] / meta["aset_osm"]), 0)

    data = {"kecamatan": kec, "subsektor": subsektor, "sensitivitas": sens, "klaster": klaster, "lokasi": lokasi, "meta": meta}
    out = Path(a.keluaran)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("// Data Atlas Ekonomi Kreatif Jakarta, dibuat otomatis oleh scripts/export_web_data.py\n"
                   "// dari tabel keluaran notebook Tahap 3. Jangan disunting manual.\n"
                   "const DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{out}: {len(kec)} kecamatan, {len(klaster)} klaster, {len(lokasi)} lokasi usulan")


if __name__ == "__main__":
    main()
