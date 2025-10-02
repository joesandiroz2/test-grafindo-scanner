$(document).ready(async function () {
  const pb = new PocketBase(pocketbaseUrl);

  async function loadDataMasuk() {
    try {
      const records = await pb.collection("others_kartu_stok").getList(1, 50, {
        filter: `status="masuk"`,
        sort: "-created",
      });

      renderTable(records.items);
    } catch (err) {
      console.error("Error load data masuk:", err);
      $("#tbl_data_masuk").html(`<tr><td colspan="8" class="text-danger">Gagal load data.</td></tr>`);
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
            <th>Qty Masuk</th>
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
          <th>Qty Masuk</th>
          <th>Tanggal</th>
        </tr>
      </thead>
      <tbody>
    `;

    items.forEach((rec, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight:bold">${rec.part_number}</td>
          <td>${rec.nama_barang || "-"}</td>
          <td>${rec.lot || "-"}</td>
          <td style="font-weight:bold">${rec.qty_masuk || rec.qty}</td>
          <td>${new Date(rec.created).toLocaleString("id-ID")}</td>
        </tr>
      `;
    });

    html += `</tbody>`;
    $("#tbl_data_masuk").html(html);
  }

  // ⬅️ simpan fungsi ke global supaya bisa dipanggil dari file lain
  window.loadDataMasuk = loadDataMasuk;

  // pertama kali load
  await loadDataMasuk();
});
