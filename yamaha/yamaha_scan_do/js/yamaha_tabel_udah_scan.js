let scanData = []; // menyimpan data hasil scan

async function tabel_barang_sudah_scan(doData) {
  if (!doData || doData.length === 0) return;
  const noDO = doData[0].no_do;
  
  try {

    // Ambil data dari yamaha_kartu_stok berdasarkan no_do
    const res = await pb.collection("yamaha_kartu_stok").getFullList({
      filter: `no_do = "${noDO}"`,
      sort:"-created"
    });

    scanData = res; // ⬅️ Tambahkan baris ini
    if (!res || res.length === 0) {
      document.getElementById("tbl_udah_scan").innerHTML = "<p class='text-center'>Belum ada barang yang di-scan.</p>";
      return;
    }

   
  } catch (error) {
    console.error("Gagal menampilkan barang yang sudah di scan:", error);
    document.getElementById("tbl_udah_scan").innerHTML = `<p class='text-danger text-center'>Gagal memuat data scan.</p>`;
  }
}
