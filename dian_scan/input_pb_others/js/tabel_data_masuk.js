$(document).ready(async function () {
  const pb = new PocketBase(pocketbaseUrl);

  async function loadDataMasuk() {
     $("#preloader").show(); // ⏳ tampilkan preloader sebelum fetch
   
    try {
      const records = await pb.collection("others_kartu_stok").getList(1, 50, {
        sort: "-created",
      });

      renderTable(records.items);
    } catch (err) {
      console.error("Error load data masuk:", err);
      $("#tbl_data_masuk").html(`<tr><td colspan="8" class="text-danger">Gagal load data.</td></tr>`);
    } finally {
      $("#preloader").hide(); // ✅ sembunyikan preloader setelah selesai
      $("#tbl_data_masuk").show(); // tampilkan tabel
    }
  }

  function renderTable(items) {
    if (!items || items.length === 0) {
      $("#tbl_data_masuk").html(`
        <thead class="table-dark">
          <tr>
            <th>No</th>
            <th>Part Number</th>
            <th>Nama Barang</th>
            <th>Lot</th>
            <th>Qty </th>
            <th>Tanggal</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="6" class="text-center text-muted">Belum ada data</td></tr>
        </tbody>
      `);
      return;
    }

    let html = `
      <thead class="table-dark">
        <tr>
          <th>No</th>
          <th>Part Number</th>
          <th>Nama Barang</th>
          <th>Lot</th>
          <th>Qty </th>
          <th>Tanggal</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
    `;

    items.forEach((rec, i) => {
       // Normalisasi status biar aman (huruf kecil)
    const status = (rec.status || "").toLowerCase();

    // Warna background sesuai status
    let bgColor = "";
    let textColor = "white";
    if (status === "masuk") {
      bgColor = "green";
    } else if (status === "keluar") {
      bgColor = "red";
    }
      html += `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight:bold">${rec.part_number} <br/> 
          <span style="font-weight:bold;color:green">${rec.no_do}</span>
          </td>
          <td style="font-weight:bold">${rec.nama_barang || "-"}</td>
          <td>${rec.lot || "-"}</td>
     <td style="font-weight:bold; background-color:${bgColor}; color:${textColor}; text-align:center;">
          ${rec.qty_masuk || rec.qty} ${rec.status}
        </td>
          <td>${new Date(rec.created).toLocaleString("id-ID")}</td>
         <td>
          <button class="btn btn-sm btn-warning edit-btn" 
            data-id="${rec.id}" 
            data-pb="${rec.no_do || ''}" 
            data-lot="${rec.lot || ''}">
            <i class="bi bi-pencil-square"></i> Edit
          </button>
        </td>
        </tr>
      `;
    });

    html += `</tbody>`;
    $("#tbl_data_masuk").html(html);
  }

 // edit
    $(document).on("click", ".edit-btn", function () {
      const id = $(this).data("id");
      const pb = $(this).data("pb");
      const lot = $(this).data("lot");

      // isi data ke form modal
      $("#editId").val(id);
      $("#editPb").val(pb);
      $("#editLot").val(lot);

      // tampilkan modal edit
      const modal = new bootstrap.Modal(document.getElementById("editModal"));
      modal.show();
    });

    // tombol simpan edit ditekan
    $(document).on("click", "#saveEditBtn", async function () {
      const id = $("#editId").val();
      const newPb = $("#editPb").val().trim();
      const newLot = $("#editLot").val().trim();

       const $btn = $(this); // simpan referensi tombol

      if (!newPb || !newLot) {
        alert("No PB dan Lot tidak boleh kosong!");
        return;
      }

       // Ubah tombol jadi disable + ganti teks
  $btn.prop("disabled", true).text("Sedang mengupdate...");


      try {
        const pbClient = new PocketBase(pocketbaseUrl);
        await pbClient.collection("others_kartu_stok").update(id, {
          no_do: newPb,
          lot: newLot
        });

        // Tutup modal
        const modalEl = document.getElementById("editModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Notifikasi sukses
        const toast = document.createElement("div");
        toast.className = "alert alert-success text-center mt-2";
        toast.textContent = "✅ Data berhasil diperbarui!";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        // Refresh tabel
        if (typeof loadDataMasuk === "function") {
          await loadDataMasuk();
        }
      } catch (err) {
        console.error("Gagal update:", err);
        alert("❌ Gagal menyimpan perubahan. Lihat console untuk detail.");
      }finally {
          // Aktifkan lagi tombol dan kembalikan teks semula
          $btn.prop("disabled", false).text("Simpan Perubahan");
        }
    });

  // ⬅️ simpan fungsi ke global supaya bisa dipanggil dari file lain
  window.loadDataMasuk = loadDataMasuk;

  // pertama kali load
  await loadDataMasuk();
});


