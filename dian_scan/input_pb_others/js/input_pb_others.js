$(document).ready(function () {
  const pb = new PocketBase(pocketbaseUrl);

  $("#penyerahanForm").on("submit", async function (e) {
    e.preventDefault();


     const $btn = $(this).find("button[type=submit]");
    const originalHtml = $btn.html();


    const partNumber = $("#partNumber").val().trim();
    const nama_barang = $("#nama_barang").val().trim();
    const no_pb = $("#no_pb").val().trim();
    const lot = $("#lot").val().trim();
    const qtyMasuk = parseInt($("#qtyMasuk").val());

    if (!partNumber || !lot || isNaN(qtyMasuk)) {
      $("#resultMessage").html(`<div class="alert alert-danger">Input tidak valid.</div>`);
      return;
    }

    try {
       // 🔒 disable tombol
      $btn.prop("disabled", true).html('<i class="bi bi-hourglass-split"></i> Sedang menyimpan...');

      // cari data terakhir untuk partNumber ini
      const lastRecord = await pb.collection("others_kartu_stok").getList(1, 1, {
        filter: `part_number="${partNumber}"`,
        sort: "-created" // ambil paling baru
      });

      let lastBalance = 0;
      if (lastRecord.totalItems > 0) {
        lastBalance = parseFloat(lastRecord.items[0].balance) || 0;
      }

      let newBalance;
      if (lastRecord.totalItems > 0) {
        // sudah ada sebelumnya
        newBalance = lastBalance + qtyMasuk;
      } else {
        // belum ada sebelumnya
        newBalance =  qtyMasuk;
      }

      // buat data baru
      const newData = {
        part_number: partNumber,
        lot: lot,
        qty_masuk: qtyMasuk,
        balance: newBalance,
        status: "Masuk", // default status Masuk
        nama_barang: nama_barang, // bisa diisi manual kalau ada
        no_do: "-",
          no_do: no_pb, // ✅ simpan No PB ke field no_do
        kode_depan: "-",
        qty_minta: "0",
        no_po: "-",
        status:"masuk"
      };

      const created = await pb.collection("others_kartu_stok").create(newData);

      $("#resultMessage").html(`
        <div class="alert alert-success">
          Data berhasil disimpan!<br>
          Part: <b>${created.part_number}</b>
        </div>
      `);
      $("#penyerahanForm")[0].reset();
      // 🔄 reload tabel kalau fungsi tersedia
    if (typeof loadDataMasuk === "function") {
      await loadDataMasuk();
    }
    } catch (err) {
      console.error("Error:", err);
      $("#resultMessage").html(`<div class="alert alert-danger">Terjadi kesalahan saat menyimpan data.</div>`);
    }finally {
      // 🔓 balikin tombol
      $btn.prop("disabled", false).html(originalHtml);
    }
  });

  // === FUNGSI KELUAR BARANG ===
  $("#btnKeluar").on("click", async function () {
    const $btn = $(this);
    const originalHtml = $btn.html();

    const partNumber = $("#partNumber").val().trim();
    const nama_barang = $("#nama_barang").val().trim();
    const no_pb = $("#no_pb").val().trim();
    
    const lot = $("#lot").val().trim();
    const qtyKeluar = parseInt($("#qtyMasuk").val());

    if (!partNumber || !lot || isNaN(qtyKeluar)) {
      $("#resultMessage").html(`<div class="alert alert-danger">Input tidak valid.</div>`);
      return;
    }

    try {
      $btn.prop("disabled", true).html('<i class="bi bi-hourglass-split"></i> Sedang menyimpan...');

      const lastRecord = await pb.collection("others_kartu_stok").getList(1, 1, {
        filter: `part_number="${partNumber}"`,
        sort: "-created"
      });

      let lastBalance = 0;
      if (lastRecord.totalItems > 0) {
        lastBalance = parseFloat(lastRecord.items[0].balance) || 0;
      }

      const newBalance = lastBalance - qtyKeluar;
      

      const newData = {
        part_number: partNumber,
        lot: lot,
        qty: qtyKeluar,
        qty_keluar: qtyKeluar,
        balance: newBalance,
        status: "Keluar",
        nama_barang,
         no_do: no_pb, // ✅ simpan No PB ke field no_do
        kode_depan: "-",
        qty_minta: "0",
        no_po: "-",
      };

      await pb.collection("others_kartu_stok").create(newData);

      $("#resultMessage").html(`<div class="alert alert-success">Barang keluar berhasil disimpan.</div>`);
      $("#penyerahanForm")[0].reset();

      if (typeof loadDataMasuk === "function") await loadDataMasuk();

    } catch (err) {
      console.error(err);
      $("#resultMessage").html(`<div class="alert alert-danger">Gagal menyimpan data.</div>`);
    } finally {
      $btn.prop("disabled", false).html(originalHtml);
    }
  });

});
