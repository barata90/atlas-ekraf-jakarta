/* ============================================================
   MESIN NARASI PROFIL KECAMATAN
   Menyusun paragraf berbahasa Indonesia dari angka tiap kecamatan.
   Kalimat dipilih berdasarkan profil wilayah, lalu dibandingkan
   dengan angka kota.
   ============================================================ */

const NARASI = (function () {
  "use strict";

  const n = (x, d = 0) =>
    Number(x).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

  const ribuan = (x) => (x >= 1e6 ? n(x / 1e6, 2) + " juta" : n(x));

  function kuantil(arr, q) {
    const s = [...arr].sort((a, b) => a - b);
    const pos = (s.length - 1) * q;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }

  function statistikKota(daftar) {
    const akses = daftar.map((k) => k.akses);
    return {
      aref: DATA.meta.a_ref,
      q75: kuantil(akses, 0.75),
      pangsa: DATA.meta.pangsa_kota_ovt,
    };
  }

  function profil(k, s) {
    if (k.status === "Prioritas utama") return "utama";
    if (k.status === "Prioritas lanjutan") return "lanjutan";
    if (k.akses >= s.q75) return "pusat";
    if (k.pct_rendah >= 30) return "rendah";
    if (k.ragam === "di bawah pangsa kota") return "kuliner";
    return "menengah";
  }

  const LABEL = {
    utama: { tag: "Prioritas utama", warna: "prioritas" },
    lanjutan: { tag: "Prioritas lanjutan", warna: "prioritas" },
    pusat: { tag: "Pusat ruang kreatif", warna: "matang" },
    rendah: { tag: "Akses rendah", warna: "kritis" },
    kuliner: { tag: "Didominasi kuliner", warna: "monokultur" },
    menengah: { tag: "Akses sedang", warna: "netral" },
  };

  function kalimatAkses(k, s) {
    const rasio = k.akses / s.aref;
    let banding;
    if (rasio >= 1.5) banding = `sekitar ${n(rasio, 1)} kali median kota (${n(s.aref, 1)})`;
    else if (rasio >= 1.0) banding = `di atas median kota (${n(s.aref, 1)})`;
    else if (rasio >= 0.5) banding = `di bawah median kota (${n(s.aref, 1)})`;
    else banding = `kurang dari separuh median kota (${n(s.aref, 1)})`;
    let t = `Setiap 100 ribu penduduk ${k.nama} dapat menjangkau sekitar <b>${n(k.akses, 1)} ruang kreatif publik</b> ` +
      `dalam radius 1,5 km, ${banding}. `;
    if (k.pct_rendah >= 1) {
      t += `Sebanyak ${ribuan(k.rendah)} penduduk (${n(k.pct_rendah, 0)} persen) memiliki akses rendah.`;
    } else {
      t += "Hampir seluruh penduduknya memiliki akses yang memadai.";
    }
    return t;
  }

  function kalimatAset(k, s) {
    let t = `Overture Maps mencatat ${n(k.aset_ovt)} aset kreatif di kecamatan ini, ${n(k.pangsa, 1)} persen di antaranya ` +
      `non-kuliner (rata-rata kota ${n(s.pangsa, 1)} persen). `;
    if (k.ragam === "di bawah pangsa kota") {
      t += "Pangsa ini lebih rendah secara signifikan daripada rata-rata kota, sehingga kegiatan kreatifnya didominasi kuliner. ";
    } else if (k.ragam === "di atas pangsa kota") {
      t += "Keragaman subsektornya lebih tinggi daripada rata-rata kota. ";
    }
    if (k.cakupan !== null && k.cakupan < 0.5) {
      t += `OpenStreetMap hanya mencatat ${n(k.aset_osm)} aset, kurang dari separuh cakupan rata-rata kota, ` +
        "sehingga data OSM di wilayah ini perlu dilengkapi.";
    } else if (k.cakupan !== null && k.cakupan > 1.5) {
      t += `Cakupan OpenStreetMap di wilayah ini termasuk baik (${n(k.aset_osm)} aset).`;
    } else {
      t += `OpenStreetMap mencatat ${n(k.aset_osm)} aset, dengan cakupan mendekati rata-rata kota.`;
    }
    return t;
  }

  function kalimatTransit(k) {
    if (k.pct_rendah < 5) return "";
    if (k.halte_rendah < 40) {
      return ` Hanya ${n(k.halte_rendah, 0)} persen penduduk dengan akses rendah tinggal dalam 400 m dari halte, ` +
        "sehingga Simpul Kreatif di sini perlu didukung layanan pengumpan (feeder).";
    }
    return ` Sebanyak ${n(k.halte_rendah, 0)} persen penduduk dengan akses rendah tinggal dalam 400 m dari halte, ` +
      "sehingga simpul baru relatif mudah dicapai dengan transportasi umum.";
  }

  function kalimatKebijakan(k, p) {
    switch (p) {
      case "utama":
        return `Kecamatan ini termasuk <b>prioritas utama</b>: masuk sembilan besar pada ${n(k.frek, 0)} persen skenario. ` +
          `Kekurangannya setara sekitar ${n(k.kurang, 0)} ruang kreatif publik.` + kalimatTransit(k);
      case "lanjutan":
        return `Kecamatan ini termasuk <b>prioritas lanjutan</b> (masuk sembilan besar pada ${n(k.frek, 0)} persen skenario) ` +
          "dan sebaiknya ditangani setelah verifikasi lapangan." + kalimatTransit(k);
      case "pusat":
        return "Kecamatan ini termasuk pusat ruang kreatif Jakarta. Fokusnya adalah menjaga keragaman dan membuka akses " +
          "bagi penduduk dari kecamatan sekitar.";
      case "rendah":
        return "Kecamatan ini tidak termasuk prioritas utama, tetapi porsi penduduk dengan akses rendah cukup besar, " +
          "sehingga dapat menjadi sasaran tahap berikutnya." + kalimatTransit(k);
      case "kuliner":
        return "Ruang kreatif publiknya relatif cukup, tetapi aset kreatifnya didominasi kuliner. Program pengembangan " +
          "subsektor lain lebih relevan daripada penambahan ruang baru.";
      default:
        return "Aksesnya berada di tengah sebaran kota. Kebutuhan utamanya adalah memanfaatkan dan merawat ruang yang sudah ada.";
    }
  }

  function tulis(k, daftar) {
    const s = statistikKota(daftar);
    const p = profil(k, s);
    return {
      tag: LABEL[p].tag,
      warna: LABEL[p].warna,
      paragraf: [kalimatAkses(k, s), kalimatAset(k, s), kalimatKebijakan(k, p)],
    };
  }

  return { n, ribuan, tulis };
})();
