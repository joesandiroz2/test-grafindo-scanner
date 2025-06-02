const cacheByNoDo = {};

async function searchDO(partNoValue) {
  showLoading();
  try {
    // Pakai cache jika sudah ada
    if (cacheByNoDo[partNoValue]) {
      console.log(`Menggunakan cache untuk no_do = ${partNoValue}`);
      const cachedData = cacheByNoDo[partNoValue];

      // Ambil no_do dari cache
      const currentNoDo = cachedData.length > 0 ? cachedData[0].no_do : null;

      // Reset data sementara jika no_do berubah
      if (noDoTerakhir && currentNoDo && noDoTerakhir !== currentNoDo) {
        kartuDO = [];
        doFulfilled = {};
        renderKartuDO(); // kosongkan tampilan
        console.log("no_do berubah dari cache, data sementara direset.");
      }
      noDoTerakhir = currentNoDo;

      await prosesSetelahData(cachedData);
      hideLoading();
      return;
    }

    // Ambil data dari PocketBase
    const records = await pb.collection('yamaha_do').getFullList({
      filter: `no_do = "${partNoValue}"`,
    });

    const currentNoDo = records.length > 0 ? records[0].no_do : null;

    // Reset data sementara jika no_do berubah
    if (noDoTerakhir && currentNoDo && noDoTerakhir !== currentNoDo) {
      kartuDO = [];
      doFulfilled = {};
      renderKartuDO(); // kosongkan tampilan
      console.log("no_do berubah, data sementara direset.");
    }
    noDoTerakhir = currentNoDo;

    // Buang duplikat part_number
    const partNumberCount = {};
    records.forEach(record => {
      partNumberCount[record.part_number] = (partNumberCount[record.part_number] || 0) + 1;
    });

    const uniquePartMap = new Map();
    for (const record of records) {
      if (!uniquePartMap.has(record.part_number)) {
        uniquePartMap.set(record.part_number, record);
      } else {
        try {
          await pb.collection('yamaha_do').delete(record.id);
        showStatus("Lagi Menghapus Upload DO Excel yg Dobel Upload");
          console.log(`Deleted duplicate part_number ${record.part_number} with id ${record.id}`);
          playSound('../../../suara/yamaha_part_number_sama_dihapus.mp3');
        } catch (delErr) {
          console.error(`Gagal hapus duplikat ${record.part_number} dengan id ${record.id}:`, delErr);
        }
      }
    }

    const uniqueFiltered = Array.from(uniquePartMap.values());

    // Simpan ke cache
    cacheByNoDo[partNoValue] = uniqueFiltered;

    doData = uniqueFiltered; // simpan untuk pengecekan nanti
    await tabel_barang_sudah_scan(doData);
    hideLoading();
    renderTable(uniqueFiltered);

    inputPartNo.value = "";
    document.getElementById("input-qty").value = "";
    inputPartNo.focus();

  } catch (err) {
    hideLoading();
    showStatus("Terjadi error koneksi ke database, coba lagi");
    inputPartNo.value = "";
    document.getElementById("input-qty").value = "";
    inputPartNo.focus();
    console.error("Database error:", err);
  }
}

// Fungsi bantu untuk proses setelah cache/fetch
async function prosesSetelahData(filtered) {
  doData = filtered;
  await tabel_barang_sudah_scan(doData);
  renderTable(filtered);
  inputPartNo.value = "";
  document.getElementById("input-qty").value = "";
  inputPartNo.focus();
}
