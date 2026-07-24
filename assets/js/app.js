/* ============================================================
   Atlas Ekonomi Kreatif Jakarta — logika antarmuka
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const n = NARASI.n;
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ------------------------------------------------------------
     TATA LETAK TILEGRAM
     Tiap kecamatan ditempatkan pada grid heksagon (baris, kolom)
     mengikuti letak geografis relatifnya di Jakarta.
     Baris 0 = pesisir utara, baris 5 = perbatasan selatan.
     ------------------------------------------------------------ */
  const TATA = {
    // Kepulauan Seribu — dipisahkan di atas, di luar daratan
    "Kepulauan Seribu Utara": [-2, 3],
    "Kepulauan Seribu Selatan": [-2, 4],
    // Baris 0 — Jakarta Utara (pesisir)
    "Penjaringan": [0, 2], "Pademangan": [0, 3], "Tanjung Priok": [0, 4],
    "Koja": [0, 5], "Cilincing": [0, 6],
    // Baris 1
    "Kalideres": [1, 0], "Cengkareng": [1, 1], "Tambora": [1, 2], "Taman Sari": [1, 3],
    "Sawah Besar": [1, 4], "Kemayoran": [1, 5], "Kelapa Gading": [1, 6], "Cakung": [1, 7],
    // Baris 2
    "Kembangan": [2, 0], "Kebon Jeruk": [2, 1], "Grogol Petamburan": [2, 2], "Palmerah": [2, 3],
    "Gambir": [2, 4], "Senen": [2, 5], "Johar Baru": [2, 6], "Cempaka Putih": [2, 7],
    "Pulo Gadung": [2, 8],
    // Baris 3
    "Pesanggrahan": [3, 1], "Kebayoran Lama": [3, 2], "Tanah Abang": [3, 3], "Menteng": [3, 4],
    "Matraman": [3, 5], "Jatinegara": [3, 6], "Duren Sawit": [3, 7],
    // Baris 4
    "Cilandak": [4, 1], "Kebayoran Baru": [4, 2], "Setiabudi": [4, 3], "Mampang Prapatan": [4, 4],
    "Tebet": [4, 5], "Kramat Jati": [4, 6], "Makasar": [4, 7],
    // Baris 5
    "Jagakarsa": [5, 2], "Pasar Minggu": [5, 3], "Pancoran": [5, 4], "Pasar Rebo": [5, 5],
    "Ciracas": [5, 6], "Cipayung": [5, 7],
  };

  /* ---------- singkatan label heksagon ---------- */
  function singkat(nama) {
    if (nama.startsWith("Kepulauan Seribu")) return "K." + nama.split(" ").pop().slice(0, 3);
    const kata = nama.split(" ");
    if (kata.length === 1) return nama.length > 9 ? nama.slice(0, 8) + "." : nama;
    return kata.map((w) => w.slice(0, 4)).join(" ");
  }

  /* ------------------------------------------------------------
     METRIK
     ------------------------------------------------------------ */
  const METRIK = [
    { id: "poikm2", label: "Kepadatan aset", satuan: "per km²", jenis: "seq", desimal: 1,
      ket: "Jumlah aset kreatif per kilometer persegi." },
    { id: "nonkul", label: "Aset non-kuliner", satuan: "titik", jenis: "seq", desimal: 0,
      ket: "Aset di luar kafe dan restoran — inti ekonomi kreatif." },
    { id: "ikik", label: "Kecukupan (IKIK)", satuan: "indeks", jenis: "seq", desimal: 3,
      ket: "Gabungan kepadatan, ragam subsektor, dan akses transit." },
    { id: "ent", label: "Ragam subsektor", satuan: "entropi", jenis: "seq", desimal: 3,
      ket: "Entropi Shannon. Rendah = monokultur, tinggi = beragam." },
    { id: "gap", label: "Kesenjangan", satuan: "selisih peringkat", jenis: "div", desimal: 3,
      ket: "Permintaan (penduduk) dikurangi pasokan (fasilitas)." },
    { id: "prio", label: "Prioritas garap", satuan: "indeks", jenis: "div", desimal: 3,
      ket: "Kesenjangan tinggi yang sudah terlayani transit." },
  ];

  /* ---------- skala warna ---------- */
  const RAMPA_SEQ = ["#12262C", "#3B2B2D", "#6E3730", "#B24A2F", "#FF6B47"];
  const RAMPA_DIV = ["#2E7D93", "#3E6C78", "#2A3B40", "#B24A2F", "#FF6B47"];

  function hex2rgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function warnaDari(rampa, t) {
    t = Math.max(0, Math.min(1, t));
    const seg = (rampa.length - 1) * t;
    const i = Math.min(Math.floor(seg), rampa.length - 2);
    const f = seg - i;
    const a = hex2rgb(rampa[i]), b = hex2rgb(rampa[i + 1]);
    const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  // teks gelap jika latar terang
  function latarTerang(rampa, t) { return t > 0.72; }

  /* ---------- daratan saja untuk skala ---------- */
  const DARAT = DATA.kecamatan.filter((k) => k.kota);
  const PETA_KEC = Object.fromEntries(DATA.kecamatan.map((k) => [k.nama, k]));

  function rentang(id) {
    const v = DARAT.map((k) => k[id]).filter((x) => x !== null && !isNaN(x));
    return { min: Math.min(...v), max: Math.max(...v) };
  }
  function normal(k, m) {
    const r = rentang(m.id);
    if (m.jenis === "div") {
      const abs = Math.max(Math.abs(r.min), Math.abs(r.max));
      return (k[m.id] + abs) / (2 * abs);
    }
    // skala akar agar sebaran yang sangat miring tetap terbaca
    const t = (k[m.id] - r.min) / (r.max - r.min || 1);
    return Math.sqrt(Math.max(0, t));
  }

  /* ------------------------------------------------------------
     GAMBAR TILEGRAM
     ------------------------------------------------------------ */
  const R = 20.5;                       // jari-jari luar heksagon
  const LEBAR = Math.sqrt(3) * R;       // lebar heksagon (pointy-top)
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
    const rampa = metrik.jenis === "div" ? RAMPA_DIV : RAMPA_SEQ;

    Object.entries(TATA).forEach(([nama, [baris, kol]]) => {
      const k = PETA_KEC[nama];
      if (!k) return;
      const ganjil = ((baris % 2) + 2) % 2 === 1;
      const cx = 26 + kol * LEBAR + (ganjil ? LEBAR / 2 : 0);
      const cy = 30 + (baris + 2) * TINGGI_BARIS;

      const g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "hexcell");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.dataset.nama = nama;

      const t = k.kota ? normal(k, metrik) : 0;
      const isi = k.kota ? warnaDari(rampa, t) : "#16323A";
      if (k.kota && latarTerang(rampa, t)) g.classList.add("terang");

      const poly = document.createElementNS(SVGNS, "polygon");
      poly.setAttribute("points", titikHex(cx, cy, R - 1.2));
      poly.setAttribute("fill", isi);
      g.appendChild(poly);

      const txt = document.createElementNS(SVGNS, "text");
      txt.setAttribute("x", cx);
      txt.setAttribute("y", cy + 1.8);
      txt.textContent = singkat(nama);
      g.appendChild(txt);

      const judul = document.createElementNS(SVGNS, "title");
      const nilai = k[metrik.id];
      judul.textContent = k.kota
        ? `${nama} — ${metrik.label}: ${n(nilai, metrik.desimal)} ${metrik.satuan}`
        : `${nama} — di luar analisis kebijakan`;
      g.appendChild(judul);

      const aktif = () => onPilih(nama);
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
    const rampa = metrik.jenis === "div" ? RAMPA_DIV : RAMPA_SEQ;
    skala.textContent = "";
    for (let i = 0; i < 24; i++) {
      const el = document.createElement("i");
      el.style.background = warnaDari(rampa, i / 23);
      skala.appendChild(el);
    }
    const r = rentang(metrik.id);
    $(prefix + "-min").textContent = n(r.min, metrik.desimal);
    $(prefix + "-max").textContent = n(r.max, metrik.desimal) + " " + metrik.satuan;
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
     PANEL NARASI
     ------------------------------------------------------------ */
  let terpilih = "Duren Sawit";

  function tampilkanNarasi(nama) {
    const k = PETA_KEC[nama];
    if (!k) return;
    terpilih = nama;
    const r = NARASI.tulis(k, DATA.kecamatan);

    $("#k-nama").textContent = k.nama;
    $("#k-kota").textContent = k.kota || "Di luar analisis kebijakan";
    const tag = $("#k-tag");
    tag.textContent = r.tag;
    tag.className = "tag " + r.warna;

    const stat = [
      ["Penduduk", NARASI.ribuan(k.pop)],
      ["Aset kreatif", n(k.poi)],
      ["Non-kuliner", n(k.nonkul)],
      ["Ke transit", k.transit > 2000 ? n(k.transit / 1000, 1) + " km" : n(k.transit) + " m"],
    ];
    $("#k-stat").innerHTML = stat
      .map(([l, v]) => `<div><b class="mono">${v}</b><span>${l}</span></div>`)
      .join("");

    $("#k-narasi").innerHTML = r.paragraf.map((p) => `<p>${p}</p>`).join("");

    tandaiTerpilih($("#tilegram2"), nama);
    tandaiTerpilih($("#tilegram"), nama);
  }

  /* ------------------------------------------------------------
     PENCARIAN
     ------------------------------------------------------------ */
  function pasangPencarian() {
    const input = $("#cari"), kotak = $("#saran");
    const semua = DATA.kecamatan.map((k) => k.nama).sort();

    function render(daftar) {
      if (!daftar.length) { kotak.hidden = true; return; }
      kotak.innerHTML = daftar.slice(0, 8)
        .map((nm) => `<button type="button" data-nm="${nm}">${nm}</button>`).join("");
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
      if (e.key === "Enter") {
        const b = kotak.querySelector("button");
        if (b) b.click();
      }
      if (e.key === "Escape") { kotak.hidden = true; input.blur(); }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".cari")) kotak.hidden = true;
    });
  }

  /* ------------------------------------------------------------
     BATANG SUBSEKTOR
     ------------------------------------------------------------ */
  function batangSubsektor() {
    const wadah = $("#batang-subsektor");
    const maks = Math.max(...DATA.subsektor.map((s) => s.n));
    wadah.innerHTML = DATA.subsektor.map((s) => {
      const w = (s.n / maks) * 100;
      const warna = s.kat === "Kuliner" ? "var(--kabut-2)" : "var(--coral)";
      return `<div class="baris">
        <span>${s.nama}</span>
        <span class="rel"><i style="width:0;background:${warna}" data-w="${w}"></i></span>
        <span class="nilai">${n(s.n)}</span>
      </div>`;
    }).join("");
  }

  /* ------------------------------------------------------------
     TABEL SENSITIVITAS
     ------------------------------------------------------------ */
  function tabelSensitivitas() {
    $("#tabel-sensitivitas").innerHTML = DATA.sensitivitas.map((s) => `
      <tr>
        <td>${s.skenario}</td>
        <td class="mono">${n(s.I, 3)}</td>
        <td><span class="pil">${n(s.p, 3)}</span></td>
      </tr>`).join("");
  }

  /* ------------------------------------------------------------
     KARTU KLASTER
     ------------------------------------------------------------ */
  function kartuKlaster() {
    const urut = [...DATA.klaster].sort((a, b) => b.poi - a.poi).slice(0, 12);
    $("#grid-klaster").innerHTML = urut.map((c) => {
      const ragam = c.ent >= 0.45 ? "beragam" : c.ent >= 0.35 ? "cukup beragam" : "cenderung seragam";
      return `<article class="kartu-klaster">
        <div class="hexbadge"></div>
        <h4>${c.kec}</h4>
        <p class="meta">Klaster K-${c.id} · ${ragam}</p>
        <dl>
          <dt>Aset</dt><dd>${n(c.poi)}</dd>
          <dt>Non-kuliner</dt><dd>${n(c.nonkul)}</dd>
          <dt>Subsektor</dt><dd>${c.nsub}</dd>
          <dt>Ragam</dt><dd>${n(c.ent, 3)}</dd>
          <dt>Luas</dt><dd>${n(c.luas, 2)} km²</dd>
        </dl>
      </article>`;
    }).join("");
  }

  /* ------------------------------------------------------------
     KARTU PRIORITAS
     ------------------------------------------------------------ */
  function kartuPrioritas() {
    const urut = DARAT.slice().sort((a, b) => b.prio - a.prio).slice(0, 9);
    $("#grid-prioritas").innerHTML = urut.map((k, i) => {
      const aksi = k.nonkul === 0
        ? "Fasilitas serba guna — belum ada apa pun untuk diperkuat."
        : k.transit > 600
          ? "Fasilitas kreatif perlu dibarengi perbaikan konektivitas."
          : "Manfaatkan gedung milik daerah yang sudah ada di dekat transit.";
      return `<article class="kartu-klaster">
        <div class="hexbadge"></div>
        <p class="meta">Urutan ${i + 1} · ${k.kota}</p>
        <h4>${k.nama}</h4>
        <dl style="margin-top:12px">
          <dt>Penduduk</dt><dd>${NARASI.ribuan(k.pop)}</dd>
          <dt>Aset kreatif</dt><dd>${n(k.poi)}</dd>
          <dt>Non-kuliner</dt><dd>${n(k.nonkul)}</dd>
          <dt>Ke transit</dt><dd>${n(k.transit)} m</dd>
        </dl>
        <p style="font-size:14px;margin:14px 0 0;color:var(--kabut)">${aksi}</p>
      </article>`;
    }).join("");
  }

  /* ------------------------------------------------------------
     ANIMASI MASUK
     ------------------------------------------------------------ */
  function pasangReveal() {
    const kurangGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = $$("section > .wrap > *, .kartu-klaster");
    target.forEach((el) => el.classList.add("muncul"));
    if (kurangGerak) { target.forEach((el) => el.classList.add("tampil")); return; }
    const io = new IntersectionObserver((ent) => {
      ent.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("tampil");
          // isi batang saat terlihat
          $$("i[data-w]", e.target).forEach((i) => { i.style.width = i.dataset.w + "%"; });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    target.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------
     INISIALISASI
     ------------------------------------------------------------ */
  let metrikHero = "poikm2";
  let metrikJelajah = "prio";

  function gambarUlangHero() {
    const m = METRIK.find((x) => x.id === metrikHero);
    gambarTilegram($("#tilegram"), m, tampilkanNarasi);
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
    gambarUlangHero();
    gambarUlangJelajah();
    tampilkanNarasi(terpilih);
    pasangPencarian();
    batangSubsektor();
    tabelSensitivitas();
    kartuKlaster();
    kartuPrioritas();
    pasangReveal();
  });
})();
