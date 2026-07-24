/* ============================================================
   MESIN NARASI INTERPRETATIF
   Menyusun paragraf berbahasa Indonesia dari angka mentah tiap
   kecamatan. Bukan template isian: kalimat dipilih berdasarkan
   profil statistik wilayah, lalu dirangkai dengan pembanding
   berskala manusia.
   ============================================================ */

const NARASI = (function () {
  "use strict";

  /* ---------- utilitas angka ---------- */
  const n = (x, d = 0) =>
    Number(x).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

  const ribuan = (x) => {
    if (x >= 1e6) return n(x / 1e6, 2) + " juta";
    if (x >= 1e3) return n(x);
    return n(x);
  };

  // pengacak deterministik: varian kalimat tetap sama untuk wilayah yang sama
  const benih = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  const pilih = (arr, kunci, geser = 0) => arr[(benih(kunci) + geser) % arr.length];

  /* ---------- statistik kota sebagai pembanding ---------- */
  function statistikKota(daftar) {
    const darat = daftar.filter((k) => k.kota);
    const kuantil = (arr, q) => {
      const s = [...arr].sort((a, b) => a - b);
      const pos = (s.length - 1) * q;
      const lo = Math.floor(pos), hi = Math.ceil(pos);
      return s[lo] + (s[hi] - s[lo]) * (pos - lo);
    };
    const kol = (f) => darat.map(f);
    return {
      n: darat.length,
      medPoi: kuantil(kol((k) => k.poi), 0.5),
      medIkik: kuantil(kol((k) => k.ikik), 0.5),
      medEnt: kuantil(kol((k) => k.ent), 0.5),
      medPop: kuantil(kol((k) => k.pop), 0.5),
      p75Ikik: kuantil(kol((k) => k.ikik), 0.75),
      p25Ent: kuantil(kol((k) => k.ent), 0.25),
      p75Ent: kuantil(kol((k) => k.ent), 0.75),
      p75Prio: kuantil(kol((k) => k.prio), 0.75),
      medTransit: kuantil(kol((k) => k.transit), 0.5),
      totalPoi: kol((k) => k.poi).reduce((a, b) => a + b, 0),
      pangsaNonkulKota:
        (kol((k) => k.nonkul).reduce((a, b) => a + b, 0) /
          kol((k) => k.poi).reduce((a, b) => a + b, 0)) * 100,
    };
  }

  /* ---------- peringkat ---------- */
  function peringkat(daftar, k, kunci, menurun = true) {
    const darat = daftar.filter((x) => x.kota);
    const urut = [...darat].sort((a, b) => (menurun ? b[kunci] - a[kunci] : a[kunci] - b[kunci]));
    return { pos: urut.findIndex((x) => x.nama === k.nama) + 1, dari: urut.length };
  }

  /* ---------- klasifikasi profil ---------- */
  function profil(k, S) {
    if (!k.kota) return "kepulauan";
    if (k.nonkul === 0) return "kosong";
    if (k.prio >= S.p75Prio) return "prioritas";
    if (k.ikik >= S.p75Ikik && k.ent >= S.medEnt) return "matang";
    if (k.poi >= S.medPoi && k.ent < S.p25Ent) return "monokultur";
    if (k.pop >= S.medPop && k.ikik < S.medIkik) return "tertinggal";
    if (k.pop < S.medPop && k.poi < S.medPoi) return "tenang";
    return "menengah";
  }

  const LABEL = {
    kosong: { tag: "Titik buta", warna: "kritis" },
    prioritas: { tag: "Prioritas intervensi", warna: "prioritas" },
    matang: { tag: "Klaster matang", warna: "matang" },
    monokultur: { tag: "Ramai tapi seragam", warna: "monokultur" },
    tertinggal: { tag: "Padat, kurang terlayani", warna: "prioritas" },
    tenang: { tag: "Tenang di pinggiran", warna: "netral" },
    menengah: { tag: "Di tengah spektrum", warna: "netral" },
    kepulauan: { tag: "Wilayah kepulauan", warna: "netral" },
  };

  /* ---------- pembanding berskala manusia ---------- */
  function skalaManusia(k) {
    if (k.poi === 0) return null;
    const orangPerAset = Math.round(k.pop / k.poi);
    return orangPerAset;
  }

  function bahasaJarak(m) {
    if (m < 300) return "beberapa menit berjalan kaki";
    if (m < 600) return "sekitar sepuluh menit berjalan kaki";
    if (m < 1200) return "masih terjangkau jalan kaki, meski agak jauh";
    return "terlalu jauh untuk berjalan kaki";
  }

  // Membaca pangsa non-kuliner secara jujur terhadap rata-rata kota (12,9%),
  // dengan kehati-hatian bila basis jumlahnya terlalu kecil untuk disimpulkan.
  function bacaPangsa(k, S) {
    if (k.poi === 0) return "Belum ada aset kreatif yang terpetakan sama sekali.";
    const pangsa = (k.nonkul / k.poi) * 100;
    const kota = S.pangsaNonkulKota;
    const angka = `${n(k.nonkul)} dari ${n(k.poi)} aset (${n(pangsa, 1)}%) bukan kuliner`;
    if (k.poi < 20) {
      return `Sebanyak ${angka}. Jumlah totalnya terlalu kecil untuk menyimpulkan pola — ` +
             `satu atau dua titik saja sudah mengubah persentasenya drastis.`;
    }
    if (pangsa >= kota + 6)
      return `Sebanyak ${angka} — di atas rata-rata Jakarta yang hanya ${n(kota, 1)}%. ` +
             `Wilayah ini termasuk yang paling tidak bergantung pada kafe dan restoran.`;
    if (pangsa >= kota - 3)
      return `Sebanyak ${angka}, kurang lebih setara rata-rata Jakarta (${n(kota, 1)}%).`;
    return `Hanya ${angka} — di bawah rata-rata Jakarta yang ${n(kota, 1)}%. ` +
           `Kepadatannya nyata, tetapi sebagian besar berupa tempat makan.`;
  }

  function bahasaDiversitas(e, S) {
    if (e === 0) return "hanya satu jenis usaha kreatif yang tercatat";
    if (e < S.p25Ent) return "komposisinya sangat timpang — satu subsektor mendominasi hampir seluruhnya";
    if (e < S.medEnt) return "ragam subsektornya masih tipis";
    if (e < 0.30)
      return "ragamnya relatif lebih baik dibanding kebanyakan kecamatan, meski secara absolut masih terbatas";
    return "ragam subsektornya termasuk paling lengkap yang ada di Jakarta — sebuah ukuran yang perlu dibaca relatif, karena keragaman di seluruh kota memang rendah";
  }

  /* ============================================================
     PENYUSUN NARASI
     ============================================================ */
  function tulis(k, daftar) {
    const S = statistikKota(daftar);
    const p = profil(k, S);
    const rPoi = peringkat(daftar, k, "poi");
    const rIkik = peringkat(daftar, k, "ikik");
    const rPop = peringkat(daftar, k, "pop");
    const orangPerAset = skalaManusia(k);
    const par = [];

    /* ---------- PARAGRAF 1: pembuka + skala ---------- */
    if (p === "kepulauan") {
      par.push(
        `${k.nama} berada di gugusan Kepulauan Seribu dengan ${ribuan(k.pop)} penduduk. ` +
        `Karakter kepulauannya membuat wilayah ini tidak sebanding dengan konteks perkotaan, ` +
        `sehingga dikeluarkan dari analisis kebijakan meski tetap tercatat dalam basis data.`
      );
      return { tag: LABEL[p].tag, warna: LABEL[p].warna, paragraf: par };
    }

    if (p === "kosong") {
      par.push(
        pilih([
          `Ada ${ribuan(k.pop)} orang tinggal di ${k.nama}. Tidak satu pun galeri, ruang musik, panggung pertunjukan, studio desain, atau creative hub yang terpetakan di antara mereka.`,
          `${k.nama} menampung ${ribuan(k.pop)} penduduk. Jumlah ruang kreatif non-kuliner yang tercatat di sana: nol.`,
        ], k.nama)
      );
      par.push(
        `Yang ada hanya ${k.poi} titik, dan seluruhnya kuliner. ` +
        `Warga di sini bukan tidak punya minat kreatif — mereka tidak punya tempatnya.`
      );
    } else if (p === "matang") {
      par.push(
        pilih([
          `${k.nama} adalah salah satu simpul kreatif paling padat di Jakarta: ${n(k.poi)} aset di atas ${n(k.luas, 1)} km², atau ${n(k.poikm2, 1)} per kilometer persegi.`,
          `Di ${k.nama}, ${n(k.poi)} aset kreatif berdesakan dalam ${n(k.luas, 1)} km². Kepadatannya ${n(k.poikm2, 1)} per kilometer persegi — peringkat ${rIkik.pos} dari ${rIkik.dari} kecamatan.`,
        ], k.nama)
      );
      par.push(bacaPangsa(k, S));
    } else if (p === "monokultur") {
      par.push(
        `Sekilas ${k.nama} terlihat hidup: ${n(k.poi)} aset kreatif, peringkat ${rPoi.pos} dari ${rPoi.dari} se-Jakarta. ` +
        `Tapi angka itu menipu.`
      );
      par.push(
        `Hanya ${n(k.nonkul)} yang bukan kuliner. Sisanya kafe dan restoran. ` +
        `Ini bukan ekosistem kreatif — ini koridor kuliner yang kebetulan padat.`
      );
    } else if (p === "prioritas" || p === "tertinggal") {
      par.push(
        pilih([
          `${k.nama} menampung ${ribuan(k.pop)} orang, tapi hanya punya ${n(k.poi)} aset kreatif — ${n(k.nonkul)} di antaranya non-kuliner.`,
          `Dengan ${ribuan(k.pop)} penduduk, ${k.nama} termasuk wilayah padat. Aset kreatifnya: ${n(k.poi)} titik, dan hanya ${n(k.nonkul)} yang bukan kuliner.`,
        ], k.nama)
      );
      if (orangPerAset) {
        par.push(
          `Artinya satu aset kreatif dipakai bersama oleh sekitar ${ribuan(orangPerAset)} orang. ` +
          `Sebagai pembanding, di kecamatan-kecamatan pusat angkanya bisa di bawah seribu.`
        );
      }
    } else if (p === "tenang") {
      par.push(
        `${k.nama} relatif lengang: ${ribuan(k.pop)} penduduk di atas ${n(k.luas, 1)} km², dengan ${n(k.poi)} aset kreatif. ` +
        `Tekanan kepadatan tidak sebesar wilayah pusat.`
      );
    } else {
      par.push(
        `${k.nama} berada di tengah sebaran Jakarta: ${ribuan(k.pop)} penduduk, ${n(k.poi)} aset kreatif, ` +
        `${n(k.nonkul)} di antaranya non-kuliner.`
      );
    }

    /* ---------- PARAGRAF 2: diagnosis ---------- */
    const bagian2 = [];
    if (p === "kosong") {
      bagian2.push(
        k.poi > 0
          ? "Seluruh asetnya terbagi hanya antara kafe dan restoran."
          : "Tidak ada satu pun aset kreatif yang terpetakan."
      );
    } else {
      bagian2.push(bahasaDiversitas(k.ent, S).replace(/^./, (c) => c.toUpperCase()) + ".");
    }

    if (k.transit <= 400) {
      bagian2.push(
        `Simpul transit terdekat hanya ${n(k.transit)} meter dari titik tengah wilayah — ${bahasaJarak(k.transit)}.`
      );
    } else if (k.transit <= 1200) {
      bagian2.push(`Simpul transit terdekat berjarak ${n(k.transit)} meter, ${bahasaJarak(k.transit)}.`);
    } else {
      bagian2.push(
        `Simpul transit terdekat berjarak ${ribuan(k.transit)} meter — ${bahasaJarak(k.transit)}, ` +
        `sehingga akses menjadi kendala tersendiri.`
      );
    }
    par.push(bagian2.join(" "));

    /* ---------- PARAGRAF 3: tafsir kebijakan ---------- */
    if (p === "kosong") {
      par.push(
        `Kombinasi ini justru membuat ${k.nama} menjadi sasaran intervensi paling masuk akal: ` +
        `infrastruktur transportasi sudah ada, penduduknya banyak, dan belum ada apa pun yang perlu ditata ulang. ` +
        `Yang dibutuhkan bukan revitalisasi, melainkan fasilitas pertama.`
      );
    } else if (p === "prioritas" || p === "tertinggal") {
      par.push(
        k.transit <= 600
          ? `Karena transit sudah tersedia, hambatan utamanya bukan akses melainkan ketiadaan fasilitas itu sendiri. ` +
            `Inilah kondisi ideal untuk intervensi berbiaya rendah — memanfaatkan gedung milik daerah yang sudah ada, ` +
            `bukan membangun dari nol.`
          : `Jarak ke transit menambah lapisan persoalan: penyediaan fasilitas kreatif di sini perlu dibarengi ` +
            `perbaikan konektivitas, atau ia akan berdiri tanpa pengunjung.`
      );
    } else if (p === "matang") {
      par.push(
        k.ent >= 0.30
          ? `Wilayah seperti ini tidak butuh tambahan fasilitas. Yang dibutuhkan adalah penjagaan: ` +
            `melindungi pelaku kreatif kecil dari tekanan harga sewa, dan menjaga agar keragamannya tidak tergerus jadi kuliner semata.`
          : `Kepadatannya tinggi, tapi keragamannya belum sepadan. Ruang perbaikannya ada pada diversifikasi — ` +
            `mendorong subsektor yang belum hadir, bukan menambah yang sudah berlimpah.`
      );
    } else if (p === "monokultur") {
      par.push(
        `Kebijakan yang mengukur keberhasilan dari jumlah aset akan salah membaca wilayah ini. ` +
        `Yang perlu didorong adalah subsektor yang absen — ruang produksi, panggung, studio — bukan tambahan tempat makan.`
      );
    } else if (p === "tenang") {
      par.push(
        `Prioritasnya lebih rendah dibanding wilayah padat yang kekurangan fasilitas, ` +
        `namun ruang terbuka yang masih tersedia di sini bisa menjadi keunggulan jangka panjang bila direncanakan sejak awal.`
      );
    } else {
      par.push(
        `Posisinya di tengah membuat ${k.nama} bisa bergerak ke dua arah: menguat menjadi simpul kreatif ` +
        `bila didukung fasilitas, atau tertinggal bila perhatian kebijakan hanya tertuju pada kawasan yang sudah mapan.`
      );
    }

    return {
      tag: LABEL[p].tag,
      warna: LABEL[p].warna,
      paragraf: par,
      peringkat: { poi: rPoi, ikik: rIkik, pop: rPop },
    };
  }

  /* ---------- narasi pembanding dua wilayah ---------- */
  function banding(a, b) {
    const rasioPoi = b.poi === 0 ? null : a.poi / b.poi;
    const t = [];
    t.push(
      `${a.nama} dan ${b.nama} menampung penduduk yang ${
        Math.abs(a.pop - b.pop) / Math.max(a.pop, b.pop) < 0.2 ? "hampir sama banyak" : "berbeda jauh"
      } — ${ribuan(a.pop)} berbanding ${ribuan(b.pop)} jiwa.`
    );
    if (rasioPoi && rasioPoi >= 1.5) {
      t.push(
        `Namun ${a.nama} punya ${n(a.poi)} aset kreatif, sekitar ${n(rasioPoi, 1)} kali lipat ${b.nama} yang hanya ${n(b.poi)}.`
      );
    } else if (rasioPoi && rasioPoi <= 0.67) {
      t.push(
        `Namun ${b.nama} justru unggul: ${n(b.poi)} aset berbanding ${n(a.poi)} di ${a.nama}.`
      );
    } else {
      t.push(`Jumlah aset kreatifnya relatif berdekatan: ${n(a.poi)} berbanding ${n(b.poi)}.`);
    }
    const dEnt = a.ent - b.ent;
    if (Math.abs(dEnt) > 0.08) {
      const unggul = dEnt > 0 ? a : b;
      const kalah = dEnt > 0 ? b : a;
      t.push(
        `Perbedaan yang lebih penting ada pada keragaman: ekosistem ${unggul.nama} jauh lebih lengkap ` +
        `dibanding ${kalah.nama}, yang komposisinya lebih terpusat pada sedikit subsektor.`
      );
    }
    return t.join(" ");
  }

  return { tulis, banding, statistikKota, profil, LABEL, n, ribuan };
})();
