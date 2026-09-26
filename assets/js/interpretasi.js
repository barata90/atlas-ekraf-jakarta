/* ============================================================
   MESIN INTERPRETASI OTOMATIS (berbasis aturan/rumus)
   Menyusun interpretasi berbahasa Indonesia dari angka tiap
   elemen (batang subsektor, klaster, kecamatan, tabel, peta)
   lalu menampilkannya pada modal. Tanpa server / tanpa AI.
   ============================================================ */

const INTERP = (function () {
  "use strict";

  const n = NARASI.n;
  const ribuan = NARASI.ribuan;
  const M = DATA.meta;

  const WARNA = {
    coral: "#FF6B47", teal: "#3E9BB5", emas: "#E9B44C",
    sukses: "#5FBF8B", ungu: "#9B6DB5", kabut: "#A9B6B8",
    // pemetaan dari label tag kecamatan
    kritis: "#FF6B47", prioritas: "#E9B44C", matang: "#5FBF8B",
    monokultur: "#9B6DB5", netral: "#A9B6B8",
  };

  let overlay, dialog, elKat, elJudul, elSub, elStat, elTeks, btnTutup;
  let pemicuTerakhir = null;

  function pasang() {
    overlay = document.getElementById("interp-overlay");
    if (!overlay || dialog) return;
    dialog = overlay.querySelector(".interp");
    elKat = document.getElementById("interp-kategori");
    elJudul = document.getElementById("interp-judul");
    elSub = document.getElementById("interp-sub");
    elStat = document.getElementById("interp-stat");
    elTeks = document.getElementById("interp-teks");
    btnTutup = overlay.querySelector(".interp-tutup");
    overlay.addEventListener("click", (e) => { if (e.target === overlay) tutup(); });
    btnTutup.addEventListener("click", tutup);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) tutup(); });
  }

  function buka(d, pemicu) {
    pasang();
    if (!overlay) return;
    pemicuTerakhir = pemicu || null;
    dialog.style.setProperty("--aksen", WARNA[d.warna] || d.warna || WARNA.coral);
    elKat.textContent = d.kategori || "Interpretasi";
    elJudul.textContent = d.judul || "";
    elSub.textContent = d.sub || "";
    elSub.style.display = d.sub ? "" : "none";
    elStat.innerHTML = (d.stat || [])
      .map(([l, v]) => `<div><b class="mono">${v}</b><span>${l}</span></div>`).join("");
    elTeks.innerHTML = (d.paragraf || []).map((p) => `<p>${p}</p>`).join("");
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("tampil"));
    document.body.style.overflow = "hidden";
    dialog.scrollTop = 0;
    btnTutup.focus();
  }

  function tutup() {
    if (!overlay || overlay.hidden) return;
    overlay.classList.remove("tampil");
    document.body.style.overflow = "";
    setTimeout(() => { overlay.hidden = true; }, 320);
    if (pemicuTerakhir && pemicuTerakhir.focus) pemicuTerakhir.focus();
  }

  /* ---------- BATANG SUBSEKTOR ---------- */
  function subsektor(s, pemicu) {
    const totalOvt = DATA.subsektor.reduce((a, b) => a + b.ovt, 0);
    const pctOvt = (s.ovt / totalOvt) * 100;
    const cakupan = s.ovt ? (s.osm / s.ovt) * 100 : 0;
    const urut = [...DATA.subsektor].sort((a, b) => b.ovt - a.ovt);
    const rank = urut.findIndex((x) => x.nama === s.nama) + 1;

    const p1 = `<b>${s.nama}</b> adalah subsektor ${s.kat.toLowerCase()} dan menempati peringkat ${rank} dari ${DATA.subsektor.length} subsektor menurut jumlah aset. Overture Maps mencatat <b>${n(s.ovt)} aset</b>, sekitar ${n(pctOvt, 1)} persen dari seluruh aset kreatif kota.`;

    let p2 = `OpenStreetMap hanya mencatat ${n(s.osm)} aset pada subsektor ini, atau ${n(cakupan, 1)} persen dari jumlah Overture. `;
    p2 += cakupan < 10
      ? "Selisih yang besar ini menunjukkan OSM belum bisa diandalkan untuk memetakan subsektor tersebut, sehingga atlas memakai gabungan kedua sumber."
      : cakupan < 30
        ? "Cakupan OSM masih tipis, sehingga penggabungan kedua sumber tetap diperlukan."
        : "Cakupan OSM pada subsektor ini termasuk relatif lengkap dibanding subsektor lain.";

    const p3 = s.kat === "Kuliner"
      ? `Sebagai subsektor kuliner, ${s.nama.toLowerCase()} ikut menegaskan dominasi kuliner yang mencapai sekitar ${n(M.pct_kuliner_ovt, 0)} persen dari seluruh aset kreatif Jakarta.`
      : `Sebagai subsektor non-kuliner, jumlahnya jauh lebih kecil dibanding kuliner — cerminan ruang kreatif non-kuliner yang masih terbatas dan menjadi fokus penguatan.`;

    buka({
      kategori: "Interpretasi · Subsektor",
      judul: s.nama,
      sub: s.kat,
      warna: s.kat === "Kuliner" ? "coral" : "teal",
      stat: [
        ["Overture", n(s.ovt)],
        ["OpenStreetMap", n(s.osm)],
        ["Pangsa kota", n(pctOvt, 1) + "%"],
        ["Tercatat OSM", n(cakupan, 1) + "%"],
      ],
      paragraf: [p1, p2, p3],
    }, pemicu);
  }

  /* ---------- KARTU KLASTER ---------- */
  function klaster(c, rank, pemicu) {
    const dens = c.luas ? c.poi / c.luas : 0;
    const ragam = c.pangsa >= 15 ? "beragam" : c.pangsa >= 10 ? "cukup beragam" : "didominasi kuliner";

    const p1 = `Klaster ke-${rank} berpusat di <b>${c.kec}</b>, memuat <b>${n(c.poi)} aset kreatif</b> dalam ${n(c.luas, 2)} km² (kepadatan sekitar ${n(dens, 0)} aset per km²). DBSCAN menggabungkan aset yang berjarak kurang dari 400 m, tanpa mengikuti batas administrasi.`;

    const p2 = `Sebanyak ${n(c.nonkul)} aset (${n(c.pangsa, 1)} persen) berada di luar kuliner, tersebar pada ${c.nsub} subsektor (indeks keragaman ${n(c.ent, 2)}). Karena itu klaster ini tergolong <b>${ragam}</b>.`;

    const p3 = c.pangsa < 10
      ? "Karena hampir seluruhnya kuliner, potensi terbesar klaster ini ada pada diversifikasi ke subsektor lain seperti desain, musik, atau kriya."
      : c.pangsa >= 15
        ? "Keragaman subsektornya relatif tinggi, sehingga klaster ini dapat menjadi rujukan ekosistem kreatif yang campuran dan lebih tahan guncangan."
        : "Keragamannya sedang; menambah satu atau dua subsektor non-kuliner sudah cukup memperkuat ekosistemnya.";

    buka({
      kategori: "Interpretasi · Klaster",
      judul: `Klaster ${rank} — ${c.kec}`,
      sub: `${n(c.poi)} aset · ${ragam}`,
      warna: "teal",
      stat: [
        ["Aset", n(c.poi)],
        ["Non-kuliner", `${n(c.nonkul)} (${n(c.pangsa, 0)}%)`],
        ["Subsektor", c.nsub],
        ["Luas", n(c.luas, 2) + " km²"],
      ],
      paragraf: [p1, p2, p3],
    }, pemicu);
  }

  /* ---------- KECAMATAN (kartu prioritas / heksagon) ---------- */
  function kecamatan(k, pemicu) {
    if (!k) return;
    const r = NARASI.tulis(k, DATA.kecamatan);
    buka({
      kategori: "Profil kecamatan",
      judul: k.nama,
      sub: `${k.kota} · ${r.tag}`,
      warna: r.warna,
      stat: [
        ["Penduduk", ribuan(k.pop)],
        ["Akses / 100 rb", n(k.akses, 1)],
        ["Akses rendah", n(k.pct_rendah, 0) + "%"],
        ["Dekat halte", n(k.halte, 0) + "%"],
      ],
      paragraf: r.paragraf,
    }, pemicu);
  }

  /* ---------- BARIS TABEL SENSITIVITAS ---------- */
  function sensitivitas(s, pemicu) {
    const dasar = DATA.sensitivitas[0];
    const kuat = s.I >= 0.4
      ? "autokorelasi spasial yang kuat"
      : s.I >= 0.25
        ? "autokorelasi spasial sedang"
        : "autokorelasi spasial lemah namun tetap positif";
    const pTeks = s.p <= 0.00011 ? "≤ 0,0001" : n(s.p, 4);

    const p1 = `Pada skenario "<b>${s.skenario}</b>", Moran's I bernilai <b>${n(s.I, 3)}</b>. Nilai positif ini menandakan ${kuat}: sel yang padat aset cenderung berdekatan dengan sel padat lain, bukan tersebar acak.`;
    const p2 = `Nilai p sebesar ${pTeks} dari uji permutasi (9.999 kali) berarti pola ini hampir pasti bukan kebetulan.`;

    let p3 = `Uji LISA pada skenario ini menemukan ${n(s.hh)} sel klaster tinggi (High-High) dan ${n(s.ll)} sel klaster rendah (Low-Low) dari ${n(s.n)} sel.`;
    if (s.skenario !== dasar.skenario) {
      const arah = s.I >= dasar.I ? "lebih tinggi" : "lebih rendah";
      p3 += ` Dibanding skenario utama (Moran's I ${n(dasar.I, 3)}), nilainya ${arah}. Karena hasilnya tetap signifikan di semua skenario, kesimpulan bahwa aset kreatif mengelompok terbukti kokoh terhadap perubahan asumsi.`;
    } else {
      p3 += " Ini adalah skenario utama yang menjadi acuan pembanding bagi skenario lainnya.";
    }

    buka({
      kategori: "Interpretasi · Autokorelasi spasial",
      judul: "Moran's I " + n(s.I, 3),
      sub: s.skenario,
      warna: "emas",
      stat: [
        ["Moran's I", n(s.I, 3)],
        ["Nilai p", pTeks],
        ["High-High", n(s.hh)],
        ["Low-Low", n(s.ll)],
      ],
      paragraf: [p1, p2, p3],
    }, pemicu);
  }

  /* ---------- BARIS TABEL LOKASI USULAN ---------- */
  function lokasi(z, pemicu) {
    const p1 = `Lokasi usulan ke-${z.no} adalah <b>${z.nama}</b> (${z.jenis}) di Kecamatan ${z.kec}. Lokasi dipilih dengan MCLP (maximal covering location problem) sebagai fasilitas publik terdekat yang menjangkau penduduk akses rendah paling banyak.`;
    const p2 = `Simpul Kreatif di titik ini menjangkau sekitar <b>${ribuan(z.warga)} penduduk</b> berakses rendah dalam radius layanan 1,5 km. Bersama lokasi sebelumnya, cakupan kumulatifnya mencapai ${n(z.kumulatif, 1)} persen dari seluruh penduduk akses rendah.`;

    let p3 = z.halte > 850
      ? `Jaraknya ${n(z.halte)} m dari halte terdekat — lebih dari 850 m — sehingga simpul ini perlu didukung layanan pengumpan (feeder) agar mudah dijangkau.`
      : `Berada ${n(z.halte)} m dari halte terdekat, lokasi ini relatif mudah dicapai dengan transportasi umum.`;
    p3 += ` Stasiun terdekat berjarak ${n(z.stasiun)} m.`;

    buka({
      kategori: "Interpretasi · Lokasi usulan",
      judul: z.nama,
      sub: `${z.jenis} · ${z.kec}`,
      warna: "coral",
      stat: [
        ["Penduduk terjangkau", ribuan(z.warga)],
        ["Cakupan kumulatif", n(z.kumulatif, 1) + "%"],
        ["Ke halte", n(z.halte) + " m"],
        ["Ke stasiun", n(z.stasiun) + " m"],
      ],
      paragraf: [p1, p2, p3],
    }, pemicu);
  }

  /* ---------- GAMBAR PETA GEOGRAFIS ---------- */
  const PETA = {
    kepadatan: {
      judul: "Peta kepadatan aset kreatif",
      warna: "coral",
      stat: () => [
        ["Moran's I (OSM)", n(M.moran_osm, 3)],
        ["Aset OSM", n(M.aset_osm)],
        ["Aset Overture", n(M.aset_ovt)],
        ["Pangsa kuliner", n(M.pct_kuliner_ovt, 0) + "%"],
      ],
      paragraf: () => [
        "Peta ini menampilkan jumlah aset kreatif per km² pada grid heksagon H3. Warna makin gelap-merah menandakan konsentrasi yang makin tinggi.",
        `Konsentrasi tertinggi membentuk koridor di pusat dan selatan kota — Setiabudi, Kebayoran Baru, Tanah Abang, dan Menteng — sejalan dengan Moran's I <b>${n(M.moran_osm, 3)}</b> yang menegaskan adanya pengelompokan spasial.`,
        "Sementara itu pinggiran barat, utara, dan timur cenderung terang, menandakan aset kreatif yang jarang. Pola inilah yang mendasari analisis akses dan penetapan prioritas.",
      ],
    },
    lisa: {
      judul: "Peta klaster lokal (LISA)",
      warna: "teal",
      stat: () => [
        ["High-High", n(M.hh)],
        ["Low-Low", n(M.ll)],
        ["Koreksi", "FDR 5%"],
        ["Grid", "H3 res 8"],
      ],
      paragraf: () => [
        "LISA (Local Indicators of Spatial Association) memilah tiap sel menjadi klaster High-High, Low-Low, atau bukan klaster, dengan koreksi FDR (false discovery rate) 5 persen.",
        `Terdapat <b>${n(M.hh)} sel High-High</b>: sel padat aset yang dikelilingi sel padat — inti kawasan kreatif. Sebaliknya, <b>${n(M.ll)} sel Low-Low</b> menandai kawasan luas yang sama-sama sepi aset.`,
        "Dominannya sel Low-Low di pinggiran memperkuat temuan bahwa ketiadaan aset bersifat spasial, bukan acak, sehingga intervensi sebaiknya menyasar kawasan, bukan titik yang terpisah-pisah.",
      ],
    },
    akses: {
      judul: "Peta akses ruang kreatif publik",
      warna: "coral",
      stat: () => [
        ["Akses rendah", ribuan(M.rendah)],
        ["Porsi kota", n(M.pct_rendah, 1) + "%"],
        ["Tertinggi", n(M.akses_max, 1)],
        ["Terendah", n(M.akses_min, 1)],
      ],
      paragraf: () => [
        "Peta ini memakai 2SFCA (two-step floating catchment area) untuk mengukur porsi penduduk tiap sel yang berakses rendah ke ruang kreatif publik. Warna makin merah berarti makin banyak penduduk yang kekurangan akses.",
        `Sekitar <b>${ribuan(M.rendah)} penduduk</b> (${n(M.pct_rendah, 1)} persen) berakses rendah. Aksesnya sangat timpang: ${n(M.akses_max, 1)} per 100 ribu di ${M.kec_max}, tetapi hanya ${n(M.akses_min, 1)} di ${M.kec_min}.`,
        `Bintang menandai sembilan lokasi usulan Simpul Kreatif yang, dengan MCLP, menjangkau ${n(M.mclp_cakupan, 1)} persen penduduk akses rendah — sekitar ${n(M.mclp_warga / 1e3, 0)} ribu jiwa.`,
      ],
    },
  };

  function peta(key, pemicu) {
    const d = PETA[key];
    if (!d) return;
    buka({
      kategori: "Interpretasi · Peta",
      judul: d.judul,
      sub: "",
      warna: d.warna,
      stat: d.stat(),
      paragraf: d.paragraf(),
    }, pemicu);
  }

  return { pasang, buka, tutup, subsektor, klaster, kecamatan, sensitivitas, lokasi, peta };
})();
