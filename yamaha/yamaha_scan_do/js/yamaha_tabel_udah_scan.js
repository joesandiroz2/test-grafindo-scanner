let scanData = []; // menyimpan data hasil scan

async function tabel_barang_sudah_scan(doData) {
  if (!doData || doData.length === 0) return;
  const noDO = doData[0].no_do;
  
  try {
    // Auth ke PocketBase
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // Ambil data dari yamaha_kartu_stok berdasarkan no_do
    const res = await pb.collection("yamaha_kartu_stok").getFullList({
      filter: `no_do = "${noDO}"`,
      sort:"-created"
    });

    scanData = res; // ⬅️ Tambahkan baris ini
    console.log("ss",scanData)
    if (!res || res.length === 0) {
      document.getElementById("tbl_udah_scan").innerHTML = "<p class='text-center'>Belum ada barang yang di-scan.</p>";
      return;
    }

    // Buat list tanpa tabel
    let html = `<ul class="list-group list-group-flush">`;

    res.forEach((item, index) => {
      html += `
        <li class="list-group-item">
          <strong>${index + 1}.</strong> 
          ${item.kode_depan}${item.no_do} - 
          <strong>${item.part_number}</strong> - 
          ${item.nama_barang} - 
          <strong>Qty: ${item.qty_scan}</strong> - 
          ✅
        </li>
      `;
    });

    html += `</ul>`;

    document.getElementById("tbl_udah_scan").innerHTML = html;
  } catch (error) {
    console.error("Gagal menampilkan barang yang sudah di scan:", error);
    document.getElementById("tbl_udah_scan").innerHTML = `<p class='text-danger text-center'>Gagal memuat data scan.</p>`;
  }
}
