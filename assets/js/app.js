/* ============================================================
   Atlas Ekonomi Kreatif Jakarta: logika antarmuka
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const n = NARASI.n;
  const M = DATA.meta;
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------
     TATA LETAK TILEGRAM
     ------------------------------------------------------------ */
  const TATA = {
    "Penjaringan": [0, 2], "Pademangan": [0, 3], "Tanjung Priok": [0, 4], "Koja": [0, 5], "Cilincing": [0, 6],
    "Kalideres": [1, 0], "Cengkareng": [1, 1], "Tambora": [1, 2], "Taman Sari": [1, 3],
    "Sawah Besar": [1, 4], "Kemayoran": [1, 5], "Kelapa Gading": [1, 6], "Cakung": [1, 7],
    "Kembangan": [2, 0], "Kebon Jeruk": [2, 1], "Grogol Petamburan": [2, 2], "Palmerah": [2, 3],
    "Gambir": [2, 4], "Senen": [2, 5], "Johar Baru": [2, 6], "Cempaka Putih": [2, 7], "Pulo Gadung": [2, 8],
    "Pesanggrahan": [3, 1], "Kebayoran Lama": [3, 2], "Tanah Abang": [3, 3], "Menteng": [3, 4],
    "Matraman": [3, 5], "Jatinegara": [3, 6], "Duren Sawit": [3, 7],
    "Cilandak": [4, 1], "Kebayoran Baru": [4, 2], "Setiabudi": [4, 3], "Mampang Prapatan": [4, 4],
    "Tebet": [4, 5], "Kramat Jati": [4, 6], "Makasar": [4, 7],
    "Jagakarsa": [5, 2], "Pasar Minggu": [5, 3], "Pancoran": [5, 4], "Pasar Rebo": [5, 5],
    "Ciracas": [5, 6], "Cipayung": [5, 7],
  };

  function singkat(nama) {
    const kata = nama.split(" ");
    if (kata.length === 1) return nama.length > 9 ? nama.slice(0, 8) + "." : nama;
    return kata.map((w) => w.slice(0, 4)).join(" ");
  }

  /* ------------------------------------------------------------
     INDIKATOR PETA
     ------------------------------------------------------------ */
  const METRIK = [
    { id: "akses", label: "Akses ruang kreatif publik", satuan: "per 100 ribu penduduk", desimal: 1,
      ket: "Ruang kreatif publik yang terjangkau dalam radius 1,5 km per 100 ribu penduduk, dihitung dengan 2SFCA (two-step floating catchment area)." },
    { id: "pct_rendah", label: "Penduduk dengan akses rendah", satuan: "persen", desimal: 0,
      ket: "Porsi penduduk tanpa ruang kreatif publik dalam 1,5 km, atau dengan akses kurang dari separuh median kota." },
    { id: "kurang", label: "Kekurangan ruang kreatif", satuan: "ruang", desimal: 0,
      ket: "Perkiraan jumlah ruang kreatif publik tambahan agar akses setiap penduduk mencapai median kota." },
    { id: "dens_ovt", label: "Kepadatan aset kreatif", satuan: "per km²", desimal: 1,
      ket: "Jumlah aset kreatif (Overture Maps) per kilometer persegi." },
    { id: "pangsa", label: "Pangsa non-kuliner", satuan: "persen", desimal: 1,
      ket: "Porsi aset kreatif di luar kafe dan restoran (Overture Maps)." },
    { id: "cakupan", label: "Cakupan data OSM", satuan: "(1 = rata-rata kota)", desimal: 2,
      ket: "Jumlah kafe dan restoran di OpenStreetMap dibanding Overture Maps, relatif terhadap rata-rata kota." },
  ];

  const RAMPA = ["#12262C", "#3B2B2D", "#6E3730", "#B24A2F", "#FF6B47"];

  function hex2rgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function warnaDari(t) {
    t = Math.max(0, Math.min(1, t));
    const seg = (RAMPA.length - 1) * t;
    const i = Math.min(Math.floor(seg), RAMPA.length - 2);
    const f = seg - i;
    const a = hex2rgb(RAMPA[i]), b = hex2rgb(RAMPA[i + 1]);
    const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  const KEC = DATA.kecamatan;
  const PETA_KEC = Object.fromEntries(KEC.map((k) => [k.nama, k]));

  function rentang(id) {
    const v = KEC.map((k) => k[id]).filter((x) => x !== null && !isNaN(x));
    return { min: Math.min(...v), max: Math.max(...v) };
  }
  function normal(k, m) {
    const r = rentang(m.id);
    const t = (k[m.id] - r.min) / (r.max - r.min || 1);
    return Math.sqrt(Math.max(0, t));
  }

  /* ------------------------------------------------------------
     TILEGRAM
     ------------------------------------------------------------ */
  const R = 20.5;
  const LEBAR = Math.sqrt(3) * R;
  const TINGGI_BARIS = 1.5 * R;

  function titikHex(cx, cy, r) {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      p.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
    }
    return p.join(" ");
  }

  function gambarTilegram(svg, metrik, onPilih) {
    svg.textContent = "";
    const gsemua = document.createElementNS(SVGNS, "g");
    Object.entries(TATA).forEach(([nama, [baris, kol]]) => {
      const k = PETA_KEC[nama];
      if (!k) return;
      const cx = 26 + kol * LEBAR + (baris % 2 === 1 ? LEBAR / 2 : 0);
      const cy = 26 + baris * TINGGI_BARIS;
      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "hexcell");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.dataset.nama = nama;
      const t = k[metrik.id] === null ? 0 : normal(k, metrik);
      if (t > 0.72) g.classList.add("terang");
      const poly = document.createElementNS(SVGNS, "polygon");
      poly.setAttribute("points", titikHex(cx, cy, R - 1.2));
      poly.setAttribute("fill", warnaDari(t));
      g.appendChild(poly);
      const txt = document.createElementNS(SVGNS, "text");
      txt.setAttribute("x", cx);
      txt.setAttribute("y", cy + 1.8);
      txt.textContent = singkat(nama);
      g.appendChild(txt);
      const judul = document.createElementNS(SVGNS, "title");
      judul.textContent = `${nama}: ${metrik.label} ${n(k[metrik.id], metrik.desimal)} ${metrik.satuan}`;
      g.appendChild(judul);
      const aktif = () => onPilih(nama, g);
      g.addEventListener("click", aktif);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aktif(); }
      });
      gsemua.appendChild(g);
    });
    svg.appendChild(gsemua);
  }

  function tandaiTerpilih(svg, nama) {
    $$(".hexcell", svg).forEach((g) => g.classList.toggle("terpilih", g.dataset.nama === nama));
  }

  function isiLegenda(prefix, metrik) {
    const skala = $(prefix + "-skala");
    skala.textContent = "";
    for (let i = 0; i < 24; i++) {
      const el = document.createElement("i");
      el.style.background = warnaDari(i / 23);
      skala.appendChild(el);
    }
    const r = rentang(metrik.id);
    $(prefix + "-min").textContent = n(r.min, metrik.desimal);
    $(prefix + "-max").textContent = n(r.max, metrik.desimal) + " " + metrik.satuan;
    const ket = $(prefix + "-ket");
    if (ket) ket.textContent = metrik.ket;
  }

  function bangunTombolMetrik(wadah, aktifId, onGanti) {
    wadah.textContent = "";
    METRIK.forEach((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = m.label;
      b.title = m.ket;
      b.setAttribute("aria-pressed", String(m.id === aktifId));
      b.addEventListener("click", () => onGanti(m.id));
      wadah.appendChild(b);
    });
  }

  /* ------------------------------------------------------------
     PROFIL KECAMATAN
     ------------------------------------------------------------ */
  let terpilih = "Kalideres";

  function tampilkanNarasi(nama) {
    const k = PETA_KEC[nama];
    if (!k) return;
    terpilih = nama;
    const r = NARASI.tulis(k, KEC);
    $("#k-nama").textContent = k.nama;
    $("#k-kota").textContent = k.kota;
    const tag = $("#k-tag");
    tag.textContent = r.tag;
    tag.className = "tag " + r.warna;
    const stat = [
      ["Penduduk", NARASI.ribuan(k.pop)],
      ["Akses per 100 ribu", n(k.akses, 1)],
      ["Akses rendah", n(k.pct_rendah, 0) + "%"],
      ["Dekat halte", n(k.halte, 0) + "%"],
    ];
    $("#k-stat").innerHTML = stat.map(([l, v]) => `<div><b class="mono">${v}</b><span>${l}</span></div>`).join("");
    $("#k-narasi").innerHTML = r.paragraf.map((p) => `<p>${p}</p>`).join("");
    tandaiTerpilih($("#tilegram2"), nama);
    tandaiTerpilih($("#tilegram"), nama);
  }

  // Heksagon hero: perbarui kartu profil + tampilkan interpretasi cepat sebagai modal.
  function pilihDariHero(nama, node) {
    tampilkanNarasi(nama);
    INTERP.kecamatan(PETA_KEC[nama], node);
  }

  function pasangPencarian() {
    const input = $("#cari"), kotak = $("#saran");
    const semua = KEC.map((k) => k.nama).sort();
    function render(daftar) {
      if (!daftar.length) { kotak.hidden = true; return; }
      kotak.innerHTML = daftar.slice(0, 8).map((nm) => `<button type="button" data-nm="${nm}">${nm}</button>`).join("");
      kotak.hidden = false;
    }
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { kotak.hidden = true; return; }
      render(semua.filter((nm) => nm.toLowerCase().includes(q)));
    });
    kotak.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      tampilkanNarasi(b.dataset.nm);
      input.value = ""; kotak.hidden = true;
      document.getElementById("jelajah").scrollIntoView({ block: "start" });
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const b = kotak.querySelector("button"); if (b) b.click(); }
      if (e.key === "Escape") { kotak.hidden = true; input.blur(); }
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".cari")) kotak.hidden = true; });
  }

  /* ------------------------------------------------------------
     ANGKA DI TEKS
     ------------------------------------------------------------ */
  function isiMeta() {
    const f = {
      rendah_jt: () => n(M.rendah / 1e6, 2),
      rendah_jt_label: () => n(M.rendah / 1e6, 2) + " jt",
      rasio_akses_x: () => n(M.rasio_akses, 0) + "×",
      pct_rendah: () => n(M.pct_rendah, 1),
      rasio_akses: () => n(M.rasio_akses, 0),
      akses_max: () => n(M.akses_max, 1),
      akses_min: () => n(M.akses_min, 1),
      kec_max: () => M.kec_max,
      kec_min: () => M.kec_min,
      a_ref: () => n(M.a_ref, 1),
      n_utama: () => n(M.utama.length),
      utama: () => M.utama.join(", "),
      lanjutan: () => M.lanjutan.join(" dan "),
      aset_osm: () => n(M.aset_osm),
      aset_ovt: () => n(M.aset_ovt),
      rasio_osm_ovt: () => n(M.rasio_osm_ovt, 0),
      pct_kuliner_ovt: () => n(M.pct_kuliner_ovt, 0),
      pct_kuliner_osm: () => n(M.pct_kuliner_osm, 0),
      moran_osm: () => n(M.moran_osm, 3),
      moran_ovt: () => n(M.moran_ovt, 3),
      hh: () => n(M.hh), ll: () => n(M.ll),
      n_klaster: () => n(M.n_klaster),
      mclp_cakupan: () => n(M.mclp_cakupan, 1),
      mclp_warga: () => n(M.mclp_warga / 1e3, 0),
      halte_rendah: () => n(M.halte_rendah, 0),
      halte_semua: () => n(M.halte_semua, 0),
      pop_jt: () => n(M.pop / 1e6, 2),
      elastisitas: () => n(M.elastisitas, 2),
      moran_pangsa: () => n(M.moran_pangsa, 3),
      pangsa_kota: () => n(M.pangsa_kota_ovt, 1),
      tanpa_nk: () => n(M.tanpa_nonkul_gabungan),
      lit_pusel: () => n(M.pangsa_literasi_pusel, 1),
      pop_pusel: () => n(M.pangsa_penduduk_pusel, 1),
      tanpa_perpus: () => n(M.pct_tanpa_perpustakaan, 1),
      luas: () => n(M.luas, 0),
    };
    $$("[data-meta]").forEach((el) => { const g = f[el.dataset.meta]; if (g) el.textContent = g(); });
  }

  /* ------------------------------------------------------------
     BATANG SUBSEKTOR
     ------------------------------------------------------------ */
  function batangSubsektor() {
    const maks = Math.max(...DATA.subsektor.map((s) => s.ovt));
    $("#batang-subsektor").innerHTML = DATA.subsektor.map((s, i) => {
      const w = Math.sqrt(s.ovt / maks) * 100;
      const warna = s.kat === "Kuliner" ? "var(--kabut-2)" : "var(--coral)";
      return `<div class="baris baris-3 dapat-klik" data-i="${i}" tabindex="0" role="button"
                   aria-label="Interpretasi subsektor ${s.nama}" data-testid="bar-subsektor-${i}">
        <span>${s.nama}</span>
        <span class="rel"><i style="width:0;background:${warna}" data-w="${w}"></i></span>
        <span class="nilai">${n(s.ovt)}</span>
        <span class="nilai osm">${n(s.osm)}</span>
      </div>`;
    }).join("");
  }

  function tabelSensitivitas() {
    $("#tabel-sensitivitas").innerHTML = DATA.sensitivitas.map((s, i) => `
      <tr class="dapat-klik" data-i="${i}" tabindex="0" role="button"
          aria-label="Interpretasi skenario ${s.skenario}" data-testid="row-sensitivitas-${i}">
        <td>${s.skenario}</td>
        <td class="mono">${n(s.I, 3)}</td>
        <td><span class="pil">${s.p <= 0.00011 ? "≤ 0,0001" : n(s.p, 4)}</span></td>
      </tr>`).join("");
  }

  let klasterUrut = [];
  function kartuKlaster() {
    klasterUrut = [...DATA.klaster].sort((a, b) => b.poi - a.poi).slice(0, 12);
    $("#grid-klaster").innerHTML = klasterUrut.map((c, i) => {
      const ragam = c.pangsa >= 15 ? "beragam" : c.pangsa >= 10 ? "cukup beragam" : "didominasi kuliner";
      return `<article class="kartu-klaster dapat-klik muncul" data-i="${i}" tabindex="0" role="button"
                       aria-label="Interpretasi klaster ${i + 1} ${c.kec}" data-testid="kartu-klaster-${i}">
        <span class="klik-hint">＋ interpretasi</span>
        <div class="hexbadge"></div>
        <h4>${c.kec}</h4>
        <p class="meta">Klaster ${i + 1} · ${ragam}</p>
        <dl>
          <dt>Aset</dt><dd>${n(c.poi)}</dd>
          <dt>Non-kuliner</dt><dd>${n(c.nonkul)} (${n(c.pangsa, 0)}%)</dd>
          <dt>Subsektor</dt><dd>${c.nsub}</dd>
          <dt>Luas</dt><dd>${n(c.luas, 2)} km²</dd>
        </dl>
      </article>`;
    }).join("");
  }

  function kartuPrioritas() {
    const urut = KEC.filter((k) => k.status === "Prioritas utama" || k.status === "Prioritas lanjutan")
      .sort((a, b) => b.rendah - a.rendah);
    $("#grid-prioritas").innerHTML = urut.map((k) => {
      const aksi = k.halte_rendah < 40
        ? "Simpul Kreatif perlu didukung layanan pengumpan (feeder) karena sebagian besar penduduk yang membutuhkan jauh dari halte."
        : "Simpul Kreatif dapat ditempatkan di fasilitas publik yang sudah dekat dengan halte.";
      return `<article class="kartu-klaster dapat-klik muncul" data-nama="${k.nama}" tabindex="0" role="button"
                       aria-label="Interpretasi ${k.nama}" data-testid="kartu-prioritas-${k.nama}">
        <span class="klik-hint">＋ interpretasi</span>
        <div class="hexbadge"></div>
        <p class="meta">${k.status} · ${k.kota}</p>
        <h4>${k.nama}</h4>
        <dl style="margin-top:12px">
          <dt>Penduduk</dt><dd>${NARASI.ribuan(k.pop)}</dd>
          <dt>Akses per 100 ribu</dt><dd>${n(k.akses, 1)}</dd>
          <dt>Akses rendah</dt><dd>${NARASI.ribuan(k.rendah)}</dd>
          <dt>Kekurangan ruang</dt><dd>±${n(k.kurang, 0)}</dd>
          <dt>Dekat halte</dt><dd>${n(k.halte_rendah, 0)}%</dd>
        </dl>
        <p style="font-size:14px;margin:14px 0 0;color:var(--kabut)">${aksi}</p>
      </article>`;
    }).join("");
  }

  function tabelLokasi() {
    $("#tabel-lokasi").innerHTML = DATA.lokasi.map((z, i) => `
      <tr class="dapat-klik" data-i="${i}" tabindex="0" role="button"
          aria-label="Interpretasi lokasi ${z.nama}" data-testid="row-lokasi-${i}">
        <td class="mono">${z.no}</td>
        <td class="kiri">${z.kec}</td>
        <td class="kiri">${z.nama}</td>
        <td class="mono kanan">${n(z.warga / 1e3, 1)} ribu</td>
        <td class="mono kanan${z.halte > 850 ? " jauh" : ""}">${n(z.halte)} m</td>
        <td class="mono kanan">${n(z.stasiun)} m</td>
      </tr>`).join("");
  }

  /* ------------------------------------------------------------
     PENYAMBUNG KLIK → INTERPRETASI OTOMATIS
     ------------------------------------------------------------ */
  function delegasi(sel, handler) {
    const c = $(sel);
    if (!c) return;
    const cari = (t) => t.closest("[data-i],[data-nama]");
    c.addEventListener("click", (e) => { const el = cari(e.target); if (el && c.contains(el)) handler(el); });
    c.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = cari(e.target);
      if (el && c.contains(el)) { e.preventDefault(); handler(el); }
    });
  }

  function pasangInterpretasi() {
    INTERP.pasang();
    delegasi("#batang-subsektor", (el) => INTERP.subsektor(DATA.subsektor[+el.dataset.i], el));
    delegasi("#grid-klaster", (el) => INTERP.klaster(klasterUrut[+el.dataset.i], +el.dataset.i + 1, el));
    delegasi("#grid-prioritas", (el) => INTERP.kecamatan(PETA_KEC[el.dataset.nama], el));
    delegasi("#tabel-sensitivitas", (el) => INTERP.sensitivitas(DATA.sensitivitas[+el.dataset.i], el));
    delegasi("#tabel-lokasi", (el) => INTERP.lokasi(DATA.lokasi[+el.dataset.i], el));
    $$(".galeri figure[data-peta]").forEach((fig) => {
      const buka = () => INTERP.peta(fig.dataset.peta, fig);
      fig.addEventListener("click", buka);
      fig.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); buka(); }
      });
    });
  }

  /* ------------------------------------------------------------
     ANIMASI & PROGRES
     ------------------------------------------------------------ */
  function pasangReveal() {
    const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = $$("section > .wrap > *, .kartu-klaster");
    target.forEach((el) => el.classList.add("muncul"));
    if (kurangGerak) {
      target.forEach((el) => el.classList.add("tampil"));
      $$("i[data-w]").forEach((i) => { i.style.width = i.dataset.w + "%"; });
      return;
    }
    const io = new IntersectionObserver((ent) => {
      ent.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("tampil");
          $$("i[data-w]", e.target).forEach((i) => { i.style.width = i.dataset.w + "%"; });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    target.forEach((el) => io.observe(el));
  }

  function pasangProgres() {
    const bar = $("#progres");
    if (!bar) return;
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
    };
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  let metrikHero = "akses";
  let metrikJelajah = "pct_rendah";

  function gambarUlangHero() {
    const m = METRIK.find((x) => x.id === metrikHero);
    gambarTilegram($("#tilegram"), m, pilihDariHero);
    isiLegenda("#leg", m);
    bangunTombolMetrik($("#metrik-hero"), metrikHero, (id) => { metrikHero = id; gambarUlangHero(); });
    tandaiTerpilih($("#tilegram"), terpilih);
  }
  function gambarUlangJelajah() {
    const m = METRIK.find((x) => x.id === metrikJelajah);
    gambarTilegram($("#tilegram2"), m, tampilkanNarasi);
    isiLegenda("#leg2", m);
    bangunTombolMetrik($("#metrik-jelajah"), metrikJelajah, (id) => { metrikJelajah = id; gambarUlangJelajah(); });
    tandaiTerpilih($("#tilegram2"), terpilih);
  }

  document.addEventListener("DOMContentLoaded", () => {
    isiMeta();
    gambarUlangHero();
    gambarUlangJelajah();
    tampilkanNarasi(terpilih);
    pasangPencarian();
    batangSubsektor();
    tabelSensitivitas();
    kartuKlaster();
    kartuPrioritas();
    tabelLokasi();
    pasangInterpretasi();
    pasangReveal();
    pasangProgres();
  });
})();
