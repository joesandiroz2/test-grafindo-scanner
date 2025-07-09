const cacheByNoDo = {};


async function searchDO(partNoValue, forceRefresh = false) {
  showLoading();

   // ✅ Reset UI terlebih dahulu, apapun hasilnya nanti
  document.getElementById("doTerkunci").style.display = "none";
  document.getElementById("tabelscanner").style.display = "block";


  try {
    // ⛔ Lewati cache jika forceRefresh = true
    if (!forceRefresh && cacheByNoDo[partNoValue]) {
      console.log(`Menggunakan cache untuk no_do = ${partNoValue}`);
      const cachedData = cacheByNoDo[partNoValue];

      const currentNoDo = cachedData.length > 0 ? cachedData[0].no_do : null;

      const adaKunci = cachedData.some(item => item.is_lock == "terkunci" );
      if (adaKunci) {
        document.getElementById("doTerkunci").style.display = "block";
        document.getElementById("tabelscanner").style.display = "none";
        hideLoading();
        return;
      }

      if (noDoTerakhir && currentNoDo && noDoTerakhir !== currentNoDo) {
        kartuDO = [];
        doFulfilled = {};
        renderKartuDO();
        console.log("no_do berubah dari cache, data sementara direset.");
      }
      noDoTerakhir = currentNoDo;

      await prosesSetelahData(cachedData);
      hideLoading();
      return;
    }

    // ⬇️ Fetch fresh data dari PocketBase
    const records = await pb.collection('yamaha_do').getFullList({
      filter: `no_do = "${partNoValue}"`,
    });

    const currentNoDo = records.length > 0 ? records[0].no_do : null;

    const adaKunci = records.some(item => item.is_lock == "terkunci");
    if (adaKunci) {
      
      playSound('../../../suara/yamaha_do_dikunci.mp3');

      document.getElementById("doTerkunci").style.display = "block";
      document.getElementById("tabelscanner").style.display = "none";
      hideLoading();
      return;
    }

    if (noDoTerakhir && currentNoDo && noDoTerakhir !== currentNoDo) {
      kartuDO = [];
      doFulfilled = {};
      renderKartuDO();
      console.log("no_do berubah, data sementara direset.");
    }
    noDoTerakhir = currentNoDo;

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

    // 🧠 Update cache dengan data terbaru
    cacheByNoDo[partNoValue] = uniqueFiltered;

    doData = uniqueFiltered;
    await tabel_barang_sudah_scan(doData);
    hideLoading();
    renderTable(uniqueFiltered);

    document.getElementById("scannerInput").value = "";

  } catch (err) {
    hideLoading();
    showStatus("Terjadi error koneksi ke database, coba lagi");
    document.getElementById("scannerInput").value = "";
    console.error("Database error:", err);
  }
}


// Fungsi bantu untuk proses setelah cache/fetch
async function prosesSetelahData(filtered) {
  doData = filtered;
  await tabel_barang_sudah_scan(doData);
  renderTable(filtered);
  document.getElementById("scannerInput").value = "";
}
