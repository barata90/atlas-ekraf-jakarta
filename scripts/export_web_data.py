"""Ekspor data dashboard Atlas Ekonomi Kreatif Jakarta.

Membaca tabel keluaran notebook Tahap 3 (outputs/tahap3/tables) dan
data/processed/hasil_tahap3.json dari run yang sama, lalu menulis assets/js/data.js.

Semua angka diambil dari kedua berkas itu. Tidak ada angka cadangan yang ditulis
tangan: bila sebuah angka tidak ditemukan, atau tabel dan JSON berasal dari run
yang berbeda, skrip berhenti dengan pesan galat.

Pemakaian (dari root repositori):
    python scripts/export_web_data.py --tabel outputs/tahap3/tables \
        --hasil data/processed/hasil_tahap3.json --keluaran assets/js/data.js
"""
import argparse
import json
import math
import re
from pathlib import Path

import pandas as pd

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
# Angka yang di hasil_tahap3.json hanya ada di kalimat interpretasi (bagian "akses")
POLA_CATATAN = {
    "pct_tanpa_perpustakaan": r"Khusus perpustakaan, ([\d.,]+)% penduduk",
    "pangsa_literasi_pusel": r"menampung ([\d.,]+)% aset literasi",
    "pangsa_penduduk_pusel": r"sementara penduduknya ([\d.,]+)% dari total",
}


def r(x, d=1):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), d)


def angka_id(s):
    # "1.766.634" -> 1766634 ; "36,9" -> 36.9
    return float(s.replace(".", "").replace(",", "."))


def cek(kondisi, pesan):
    if not kondisi:
        raise SystemExit("GALAT: " + pesan + "\nPastikan tabel dan hasil_tahap3.json berasal dari run yang sama.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tabel", default="outputs/tahap3/tables")
    ap.add_argument("--hasil", default="data/processed/hasil_tahap3.json")
    ap.add_argument("--keluaran", default="assets/js/data.js")
    a = ap.parse_args()
    T = Path(a.tabel)
    hp = Path(a.hasil)
    cek(hp.exists(), f"{hp} tidak ditemukan")
    h = json.loads(hp.read_text(encoding="utf-8"))
    akh, ovt, ktr = h["akses"], h["overture"], h["kontrol"]["per_sumber"]["Overture"]

    ak = pd.read_csv(T / "tabel_prioritas_kecamatan.csv")
    lk = pd.read_csv(T / "tabel_kelengkapan_osm_vs_overture_kecamatan.csv")
    ak = ak.merge(lk[["kecamatan", "kelengkapan_relatif"]], on="kecamatan", how="left")
    fs = T / "tabel_cakupan_simpul_per_kecamatan.csv"
    if fs.exists():
        ak = ak.merge(pd.read_csv(fs)[["kecamatan", "pct_terjangkau"]], on="kecamatan", how="left")
    else:
        ak["pct_terjangkau"] = float("nan")
    kec = []
    for _, x in ak.iterrows():
        kec.append({
            "nama": x.kecamatan, "kota": x.kabkota, "pop": int(round(x.penduduk)), "luas": r(x.luas_km2, 2),
            "akses": r(x.akses_per100rb, 4), "akses_nk": r(x.akses_nonkul_per100rb), "rendah": int(round(x.akses_rendah)),
            "pct_rendah": r(100 * x.pct_akses_rendah), "kurang": r(x.defisit_aset, 0),
            "tanpa_nk": int(round(x.tanpa_nonkul_sama_sekali)), "jarak": r(x.jarak_aset_median_m, 0),
            "halte": r(100 * x.pct_pend_400m_halte), "stasiun": r(100 * x.pct_pend_800m_stasiun),
            "halte_rendah": r(100 * x.pct_kebutuhan_400m_halte),
            "aset_ovt": int(x.n_aset_ovt), "dens_ovt": r(x.n_aset_ovt / x.luas_km2),
            "pangsa": r(100 * x.pangsa_nonkul_ovt), "ragam": x.status_ragam_ovt,
            "aset_osm": int(x.n_aset), "nonkul_osm": int(x.n_nonkul), "cakupan": r(x.kelengkapan_relatif, 2),
            "frek": r(100 * x.frek_top9, 0), "status": STATUS.get(x.status, "-"), "peringkat": int(x.peringkat_kebutuhan),
            "simpul": r(100 * x.pct_terjangkau, 0), "ikik": r(x.IKIK, 3),
        })

    sub = pd.read_csv(T / "tabel_osm_vs_overture_subsektor.csv").rename(columns={"Unnamed: 0": "sub"})
    subsektor = [{"nama": NAMA_SUB.get(s.sub, s.sub), "kat": "Kuliner" if s.sub.startswith("kuliner") else "Non-kuliner",
                  "osm": int(s.osm_juli), "ovt": int(s.overture)} for s in sub.itertuples()]
    subsektor.sort(key=lambda s: -s["ovt"])

    mo = pd.read_csv(T / "tabel_moran.csv")
    sens = [{"skenario": LABEL_MORAN.get(m.skenario, m.skenario), "I": r(m.I, 3), "p": float(m.p),
             "hh": int(m.HH_fdr), "ll": int(m.LL_fdr), "n": int(m.n_sel)} for m in mo.itertuples()]

    kl = pd.read_csv(T / "tabel_klaster_dbscan.csv")
    klaster = [{"id": int(k.klaster), "poi": int(k.n_aset), "nonkul": int(k.n_nonkul), "pangsa": r(100 * k.pangsa_nonkul),
                "nsub": int(k.n_kategori), "ent": r(k.entropi_pooled, 3), "luas": r(k.luas_hull_km2, 2),
                "kec": k.kecamatan_utama} for k in kl.itertuples()]

    lo = pd.read_csv(T / "tabel_lokasi_simpul_mclp.csv")
    cek("nama_tampil" in lo.columns, "kolom nama_tampil tidak ada di tabel_lokasi_simpul_mclp.csv (jalankan SEL 9b)")
    lokasi = [{"no": int(z.urutan), "kec": z.kecamatan, "nama": z.nama_tampil, "jenis": JENIS.get(str(z.jenis), str(z.jenis)),
               "verifikasi": bool(z.nama_perlu_verifikasi),
               "warga": int(round(z.tambahan_terlayani)), "kumulatif": r(100 * z.pct_kebutuhan_kumulatif),
               "halte": int(round(z.jarak_halte_m)), "stasiun": int(round(z.jarak_stasiun_m)),
               "lon": r(z.lon, 5), "lat": r(z.lat, 5)} for z in lo.itertuples()]

    dv = pd.read_csv(T / "tabel_diversitas_kecamatan.csv")
    pop = ak.penduduk.sum()
    rendah = ak.akses_rendah.sum()
    imax, imin = ak.akses_per100rb.idxmax(), ak.akses_per100rb.idxmin()
    moran = {m.skenario: m for m in mo.itertuples()}
    m8, mo8 = moran["seluruh aset, res 8"], moran["Overture non-kuliner, res 8"]
    status = [STATUS.get(s, "-") for s in ak.status]
    nk = ~sub["sub"].str.startswith("kuliner")
    radius = {int(c["d0"]): c for c in h["angka_final"]["cakupan_per_radius"]}
    musik, cm = h.get("kepekaan_musik", {}), h.get("cek_manual_musik", {})
    cm_longgar = next((p for p in cm.get("pembacaan", []) if p["ukuran"].startswith("longgar")), None)
    catatan_akses = " ".join(c["teks"] for c in h["catatan"] if c["bagian"] == "akses")
    dari_catatan = {}
    for k, pola in POLA_CATATAN.items():
        m = re.search(pola, catatan_akses)
        cek(m is not None, f"angka '{k}' tidak ditemukan di catatan hasil_tahap3.json")
        dari_catatan[k] = angka_id(m.group(1))
    cs = pd.read_csv(fs) if fs.exists() else pd.DataFrame(columns=["kecamatan", "terjangkau", "status"])
    tak_terjangkau = cs[cs.status.isin(["Prioritas utama", "Prioritas lanjutan"]) & (cs.terjangkau <= 0)].kecamatan.tolist()

    meta = {
        "n_kec": int(len(ak)), "luas": r(ak.luas_km2.sum(), 1), "pop": int(round(pop)),
        "aset_osm": int(sub.osm_juli.sum()), "nonkul_osm": int(sub[nk].osm_juli.sum()),
        "aset_ovt": int(sub.overture.sum()), "nonkul_ovt": int(sub[nk].overture.sum()),
        "rendah": int(round(rendah)), "pct_rendah": r(100 * rendah / pop),
        "a_ref": r(akh["median_per100rb"], 2), "ambang": r(akh["ambang_per100rb"], 2),
        "akses_max": r(ak.akses_per100rb[imax]), "kec_max": ak.kecamatan[imax],
        "akses_min": r(ak.akses_per100rb[imin]), "kec_min": ak.kecamatan[imin],
        "halte_rendah": r(100 * (ak.pct_kebutuhan_400m_halte * ak.akses_rendah).sum() / rendah),
        "halte_semua": r(100 * (ak.pct_pend_400m_halte * ak.penduduk).sum() / pop),
        "utama": [k for k, s in zip(ak.kecamatan, status) if s == "Prioritas utama"],
        "lanjutan": [k for k, s in zip(ak.kecamatan, status) if s == "Prioritas lanjutan"],
        "n_skenario": int(akh["n_skenario_stabil"]),
        "moran_osm": r(m8.I, 3), "moran_osm_nk": r(moran["tanpa kuliner, res 8"].I, 3), "moran_ovt": r(mo8.I, 3),
        "hh": int(m8.HH_fdr), "ll": int(m8.LL_fdr),
        "n_klaster": int(len(kl)),
        "mclp_cakupan": r(100 * akh["cakupan_mclp_penyebut_memadai"]),
        "mclp_cakupan_semua": r(100 * akh["cakupan_mclp_penyebut_semua"]),
        "mclp_warga": int(round(lo.tambahan_terlayani.sum())),
        "mclp_r1000": r(100 * radius[1000]["median"], 0), "mclp_r2500": r(100 * radius[2500]["median"], 0),
        "prioritas_tak_terjangkau": tak_terjangkau,
        "pangsa_kota_ovt": r(100 * dv.n_nonkul_ovt.sum() / dv.n_aset_ovt.sum()),
        "pct_tanpa_literasi": r(100 * akh["pct_tanpa_literasi"]),
        **dari_catatan,
        "elastisitas": r(ktr["elastisitas"], 2),
        "moran_pangsa": r(ktr["moran_rate"], 3), "p_moran_pangsa": r(ktr["p_rate"], 4),
        "tanpa_nonkul_gabungan": int(round(akh["tanpa_nonkul"])),
        "rendah_tanpa_musik": int(round(musik["akses_rendah"])) if musik else None,
        "mclp_tanpa_musik": r(100 * musik["cakupan_mclp"]) if musik else None,
        "musik_keliru": r(100 * cm_longgar["porsi"], 0) if cm_longgar else None,
        "musik_keliru_bawah": r(100 * cm_longgar["bawah_95"]) if cm_longgar else None,
        "musik_keliru_atas": r(100 * cm_longgar["atas_95"]) if cm_longgar else None,
        "musik_sampel": int(cm["n_sampel"]) if cm else None,
        "musik_venue_ovt": int(musik["n_venue_musik_ovt"]) if musik else None,
        "snapshot_osm": str(h["snapshot"]["accessed_utc"])[:10],
        "run": str(h["run_utc"])[:10],
    }
    meta["rasio_akses"] = r(meta["akses_max"] / meta["akses_min"], 0)
    meta["rasio_osm_ovt"] = r(100 * meta["aset_osm"] / meta["aset_ovt"])
    meta["pct_kuliner_ovt"] = r(100 * (1 - meta["nonkul_ovt"] / meta["aset_ovt"]), 0)
    meta["pct_kuliner_osm"] = r(100 * (1 - meta["nonkul_osm"] / meta["aset_osm"]), 0)

    # tabel dan JSON harus berasal dari run yang sama
    cek(meta["aset_ovt"] == int(ovt["n_kreatif"]),
        f"aset Overture di tabel ({meta['aset_ovt']}) berbeda dengan JSON ({ovt['n_kreatif']})")
    cek(meta["aset_osm"] == int(h["wilayah"]["n_poi"]),
        f"aset OSM di tabel ({meta['aset_osm']}) berbeda dengan JSON ({h['wilayah']['n_poi']})")
    cek(abs(mo8.I - next(m["I"] for m in h["moran"] if m["skenario"] == "Overture non-kuliner, res 8")) < 1e-9,
        "Moran's I Overture di tabel berbeda dengan JSON")
    cek(set(meta["utama"]) == set(akh["prioritas_stabil"]), "daftar prioritas utama berbeda dengan JSON")
    cek(set(meta["lanjutan"]) == set(akh["prioritas_bersyarat"]), "daftar prioritas lanjutan berbeda dengan JSON")
    cek(abs(lo.pct_kebutuhan_kumulatif.iloc[-1] - akh["cakupan_mclp_penyebut_memadai"]) < 1e-4,
        "cakupan simpul di tabel lokasi berbeda dengan JSON")
    cek(abs(rendah - akh["akses_rendah"]) < 1, "penduduk akses rendah di tabel berbeda dengan JSON")

    data = {"kecamatan": kec, "subsektor": subsektor, "sensitivitas": sens, "klaster": klaster, "lokasi": lokasi, "meta": meta}
    out = Path(a.keluaran)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("// Data Atlas Ekonomi Kreatif Jakarta, dibuat otomatis oleh scripts/export_web_data.py\n"
                   f"// dari tabel keluaran notebook Tahap 3 (run {h['run_utc']}). Jangan disunting manual.\n"
                   "const DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"{out}: {len(kec)} kecamatan, {len(klaster)} klaster, {len(lokasi)} lokasi usulan | run {meta['run']}")
    print(f"  median akses {meta['a_ref']} | ambang {meta['ambang']} | aset Overture {meta['aset_ovt']} | "
          f"Moran Overture {meta['moran_ovt']} | cakupan simpul {meta['mclp_cakupan']}% / {meta['mclp_cakupan_semua']}%")


if __name__ == "__main__":
    main()
