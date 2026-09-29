# Memotong bidang peta dari gambar R1, R2, R5 (run final) menjadi figures/peta_*.png untuk aplikasi web.
import sys
from pathlib import Path
import numpy as np
from PIL import Image

REPO = str(Path(__file__).resolve().parent.parent)
PASANGAN = {'R1_kepadatan_aset.png': 'peta_kepadatan.png', 'R2_lisa_fdr.png': 'peta_lisa.png',
            'R5_akses_dan_simpul.png': 'peta_akses.png'}
LEBAR = 1300


def potong(path):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    isi = (np.abs(a - 255).sum(axis=2) > 30)          # piksel bukan putih
    H, W = isi.shape
    baris = isi.sum(axis=1)
    # judul di atas & sumber di bawah dipisahkan dari peta oleh pita putih; cari pita terpanjang
    def pita_kosong(prof, mulai, akhir):
        runs, cur = [], None
        for i in range(mulai, akhir):
            if prof[i] == 0:
                cur = [i, i] if cur is None else [cur[0], i]
            else:
                if cur: runs.append(cur); cur = None
        if cur: runs.append(cur)
        return runs
    atas = max(pita_kosong(baris, 0, H // 4), key=lambda r: r[1] - r[0])[1] + 1
    bawah = max(pita_kosong(baris, 3 * H // 4, H), key=lambda r: r[1] - r[0])[0]
    kol = isi[atas:bawah].sum(axis=0)
    # legenda di kanan dipisahkan dari peta oleh pita kolom putih terpanjang di separuh kanan
    kanan = max(pita_kosong(kol, W // 2, W), key=lambda r: r[1] - r[0])[0]
    blok = isi[atas:bawah, :kanan]
    ys, xs = np.where(blok)
    y0, y1, x0, x1 = ys.min() + atas, ys.max() + atas + 1, xs.min(), xs.max() + 1
    pad = 6
    kotak = tuple(int(v) for v in (max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)))
    return im.crop(kotak), kotak


for sumber, tujuan in PASANGAN.items():
    peta, kotak = potong(f'{REPO}/outputs/tahap3/figures/{sumber}')
    tinggi = round(peta.height * LEBAR / peta.width)
    peta = peta.resize((LEBAR, tinggi), Image.LANCZOS)
    keluar = sys.argv[1] if len(sys.argv) > 1 else f'{REPO}/figures'
    peta.save(f'{keluar}/{tujuan}', optimize=True)
    print(sumber, '->', tujuan, 'kotak', kotak, 'ukuran', peta.size)
