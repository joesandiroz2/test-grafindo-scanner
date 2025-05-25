const cacheByNoDo = {};

// Ambil data dari PocketBase dan filter
async function searchDO(partNoValue) {
  showLoading();
  try {
    
     if (cacheByNoDo[partNoValue]) {
      // Pakai cache jika sudah ada
      console.log(`Menggunakan cache untuk no_do = ${partNoValue}`);
      const cachedData = cacheByNoDo[partNoValue];
      await prosesSetelahData(cachedData);
      hideLoading();
      return;
    }

    const records = await pb.collection('yamaha_do').getFullList({
      sort: '-created',
       filter: `no_do ~ "${partNoValue}"`,
    });

    

    const filtered = records

    // Cari duplikat part_number
    const partNumberCount = {};
    filtered.forEach(record => {
      partNumberCount[record.part_number] = (partNumberCount[record.part_number] || 0) + 1;
    });

    // Map untuk simpan satu record per part_number yang akan dipertahankan
    const uniquePartMap = new Map();

    for (const record of filtered) {
      if (!uniquePartMap.has(record.part_number)) {
        uniquePartMap.set(record.part_number, record);
      } else {
        // Ini duplikat, hapus dari PocketBase
        try {
          await pb.collection('yamaha_do').delete(record.id);
          console.log(`Deleted duplicate part_number ${record.part_number} with id ${record.id}`);
          playSound('../../../suara/yamaha_part_number_sama_dihapus.mp3');
          
        } catch (delErr) {
          console.error(`Gagal hapus duplikat ${record.part_number} dengan id ${record.id}:`, delErr);
        }
      }
    }

    const uniqueFiltered = Array.from(uniquePartMap.values());

    // simpan data biar ga panggil nodo lagi
    cacheByNoDo[partNoValue] = uniqueFiltered;

    doData = uniqueFiltered; // simpan untuk pengecekan nanti
    await tabel_barang_sudah_scan(doData)
    hideLoading();
    renderTable(uniqueFiltered);

    inputPartNo.value = "";  
    document.getElementById("input-qty").value = "";
    inputPartNo.focus();

  } catch (err) {
    hideLoading();
    showStatus("Terjadi error koneksi ke database, coba lagi atau hubungi Edi");
    console.error("Database error:", err);
  }
}

// ga perlu manggil lagi kalo nodo udah di panggil
async function prosesSetelahData(filtered) {
  doData = filtered; // simpan untuk pengecekan nanti
  await tabel_barang_sudah_scan(doData);
  renderTable(filtered);

  inputPartNo.value = "";
  document.getElementById("input-qty").value = "";
  inputPartNo.focus();
}