
async function proses_cek_scan(partno, qty, dataDo) {

  partno = partno.replace(/\s+/g, "").toUpperCase();


  

  // qty harus angka positif (integer), cek dengan regex atau Number.isInteger + parseInt
  const qtyInt = parseInt(qty);
  if (isNaN(qtyInt) || qtyInt <= 0) {
    showStatus("❌ Scan Input Tidak sesuai: Qty bukan angka valid!");
    resetInputan();
    return;
  }

  // lanjut proses semula dengan qtyInt (integer) yang sudah valid
  qty = qtyInt;

  if (!Array.isArray(dataDo) || dataDo.length === 0) {
    showStatus("Scan Do Dulu !!");
    
    resetInputan()
    playSound('../../../suara/yamaha_scan_do_dulu.mp3');
    return;
  }

  const found = dataDo.find(item => item.part_number === partno);

  if (found) {
  
    // Cari data dari DO untuk partno ini
    const remarks = found.remarks || "";
    const nama_barang = found.nama_barang || "";
    const qty_do = found.qty || "";
    const kode_depan = found.kode_depan || "";
    const no_do = found.no_do || "";

    // Ambil balance terakhir dari yamaha_kartu_stok
    let balance = 0;

    const qty_scan = parseInt(qty); // pastikan integer

    // Step 1: Hitung total qty yang sudah discan
    let totalQtyScanned = 0;
    try {
      await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
      const scannedItems = await pb.collection("yamaha_kartu_stok").getFullList({
        filter: `part_number = "${partno}" && no_do = "${no_do}"`
      });

      totalQtyScanned = scannedItems.reduce((sum, item) => sum + parseInt(item.qty_scan || 0), 0);
    } catch (err) {
      console.error("Gagal mengambil data scan sebelumnya:", err);
      showStatus("❌ Gagal ambil data scan sebelumnya!");
      return;
    }

    // Step 2: Cek apakah melebihi DO
    if (totalQtyScanned + qty_scan > qty_do) {
       showStatus(`❌ Part number "${partno}" sudah full scan! (Qty DO: ${qty_do}, sudah discan: ${totalQtyScanned})`);
      playSound('../../../suara/yamaha_scan_full.mp3');
      resetInputan();
      return;
    }


    try {
      await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

      const result = await pb.collection('yamaha_kartu_stok').getList(1, 1, {
        filter: `part_number = "${partno}"`,
        sort: "-created"
      });
      if (result.items.length > 0) {
        const lastBalance = parseInt(result.items[0].balance || 0);
        balance = lastBalance - parseInt(qty);
      } else {
        balance = 0 - parseInt(qty);
      }
    } catch (error) {
      console.error("Gagal ambil balance terakhir:", error);
      showStatus("Gagal ambil saldo terakhir!");
      return;
    }
    // ambil tgl do
    const found_tgl_do = dataDo.find(item => item.part_number === partno);

     // Siapkan data baru
    const newData = {
      kode_depan,
      no_do,
      part_number: partno,
      nama_barang,
      qty_scan: qty,
      qty_do,
      status: "keluar",
      remarks,
      balance,
      qty_masuk: "",
      tgl_pb: "",
      tgl_do:found_tgl_do.tgl_do || "",
      jumlah_barang: dataDo.length.toString()
    };

    // Buat record baru
    try {
      await pb.collection("yamaha_kartu_stok").create(newData);
      showStatus("✅ Stok berhasil diperbarui!");
      playSound('../../../suara/yamaha_ok_berhasil.mp3');
      await searchDO(no_do)
    } catch (err) {
      console.error("Gagal create data baru:", err);
      showStatus("❌ Gagal menyimpan data stok!");
    }

  } else {
    showStatus("Part number ini tidak ada di DO ini ");
    playSound('../../../suara/yamaha_barang_ga_ada_di_do_ini.mp3');
  }

  resetInputan()
}


function resetInputan(){
  document.getElementById('input-partno').value = '';
  document.getElementById('input-qty').value = '';
  document.getElementById('input-partno').focus();
}