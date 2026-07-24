#!/usr/bin/env python3
"""
Regenerasi assets/js/data.js dari tabel keluaran notebook Tahap 2.

Pakai script ini setiap kali analisis dijalankan ulang, agar angka di
aplikasi web selalu sinkron dengan hasil notebook — tidak ada penyuntingan
manual yang bisa membuat keduanya berbeda diam-diam.

Contoh:
    python3 scripts/export_web_data.py \
        --tables "../BI Jakarta/outputs/tables" \
        --hasil  "../BI Jakarta/data/processed/hasil_tahap2.json" \
        --out    assets/js/data.js
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    sys.exit("Butuh pandas:  pip install pandas")


def baca(tables: Path, nama: str) -> pd.DataFrame:
    f = tables / nama
    if not f.exists():
        sys.exit(f"Tidak menemukan {f}\nPastikan --tables menunjuk ke folder outputs/tables.")
    return pd.read_csv(f)


def nihil(x):
    return None if pd.isna(x) else x


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tables", required=True, type=Path, help="folder outputs/tables")
    ap.add_argument("--hasil", type=Path, default=None, help="berkas hasil_tahap2.json (opsional)")
    ap.add_argument("--out", type=Path, default=Path("assets/js/data.js"))
    a = ap.parse_args()

    kec_df = baca(a.tables, "tabel_profil_kecamatan.csv").round(4)
    kl_df = baca(a.tables, "tabel_klaster_dbscan.csv")
    sen_df = baca(a.tables, "tabel_sensitivitas_moran.csv")
    sub_df = baca(a.tables, "tabel_deskriptif_subsektor.csv")

    kecamatan = [{
        "nama": r["kecamatan"],
        "kota": nihil(r["kabkota"]),
        "pop": round(float(r["populasi"])),
        "poi": int(r["n_poi"]),
        "nonkul": int(r["n_nonkuliner"]),
        "luas": float(r["luas_km2"]),
        "ikik": float(r["IKIK"]),
        "ent": float(r["entropi"]),
        "gap": float(r["gap"]),
        "prio": float(r["prioritas"]),
        "transit": round(float(r["jarak_transit_m"])),
        "poikm2": float(r["poi_per_km2"]),
        "poi10k": nihil(r["poi_per_10k_jiwa"]),
    } for _, r in kec_df.iterrows()]

    klaster = [{
        "id": int(r["klaster"]), "poi": int(r["n_poi"]), "luas": float(r["luas_km2"]),
        "dens": float(r["kepadatan_poi_km2"]), "nsub": int(r["n_subsektor"]),
        "ent": float(r["entropi"]), "dom": r["subsektor_dominan"],
        "domp": float(r["pangsa_dominan_%"]), "nonkul": int(r["n_nonkuliner"]),
        "kec": r["kecamatan_utama"],
    } for _, r in kl_df.iterrows()]

    sensitivitas = [{
        "skenario": r["Skenario"], "I": float(r["Moran's I"]), "z": float(r["z"]),
        "p": float(r["p"]), "hh": int(r["Sel HH"]), "ll": int(r["Sel LL"]), "n": int(r["n sel"]),
    } for _, r in sen_df.iterrows()]

    subsektor = [{
        "nama": r["subsektor"], "kat": r["kategori"],
        "n": int(r["jumlah"]), "pct": float(r["pangsa_%"]),
    } for _, r in sub_df.iterrows() if str(r["subsektor"]).lower() != "total"]

    # ---- meta: ambil dari hasil_tahap2.json bila tersedia ----
    darat = [k for k in kecamatan if k["kota"]]
    meta = {
        "poi_total": int(sum(s["n"] for s in subsektor)),
        "poi_nonkul": int(sum(s["n"] for s in subsektor if s["kat"] != "Kuliner")),
        "pop_total": int(sum(k["pop"] for k in kecamatan)),
        "luas": round(sum(k["luas"] for k in kecamatan), 1),
        "n_kec": len(kecamatan),
        "n_kec_darat": len(darat),
        "sumber": "OpenStreetMap (ODbL), WorldPop (CC-BY 4.0)",
    }
    if a.hasil and a.hasil.exists():
        h = json.loads(a.hasil.read_text(encoding="utf-8"))
        m = h.get("moran_all_res8", {})
        meta.update({
            "sel_h3": m.get("n"), "moran_I": round(m.get("moran_I", 0), 4),
            "moran_z": round(m.get("moran_z", m.get("z", 0)), 2), "moran_p": m.get("p"),
            "hh": m.get("HH"), "ll": m.get("LL"), "hot": m.get("hot"),
            "n_klaster": h.get("dbscan", {}).get("n_clusters"),
            "sel_kurang": h.get("ikik", {}).get("n_gap_positif"),
            "diakses": h.get("run_utc", "")[:10],
        })
    else:
        print("Catatan: --hasil tidak diberikan, sebagian meta dihitung dari tabel saja.")

    keluaran = {"kecamatan": kecamatan, "klaster": klaster,
                "sensitivitas": sensitivitas, "subsektor": subsektor, "meta": meta}

    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(
        "// Data hasil analisis spasial ekonomi kreatif Jakarta.\n"
        "// Dihasilkan otomatis oleh scripts/export_web_data.py — jangan sunting manual.\n"
        "const DATA = " + json.dumps(keluaran, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8")

    print(f"Ditulis: {a.out}")
    print(f"  {len(kecamatan)} kecamatan ({len(darat)} daratan), {len(klaster)} klaster, "
          f"{len(subsektor)} subsektor, {len(sensitivitas)} skenario")


if __name__ == "__main__":
    main()
