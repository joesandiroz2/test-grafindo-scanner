let kartuDO = [];
let doFulfilled = {}; // penanda DO partno yang sudah penuh
let noDoTerakhir = null;


function simpanKeKartuDO(partno, qty) {
  const qtyInt = parseInt(qty);
  if (isNaN(qtyInt) || qtyInt <= 0) {
    showStatus("❌ Qty tidak valid!");
    resetInputan();
    return;
  }

  const doItem = doData.find(item => item.part_number === partno);
  if (!doItem) {
    showStatus("❌ Part number tidak ada di DO!");
    playSound('../../../suara/yamaha_barang_ga_ada_di_do_ini.mp3');
    resetInputan();
    return;
  }

  const qtyDo = parseInt(doItem.qty);

  // Hitung total qty saat ini untuk partno
  const totalQty = kartuDO
    .filter(item => item.partno === partno)
    .reduce((sum, item) => sum + item.qty, 0);

  // Jika DO sudah terpenuhi, input berikutnya langsung proses
  if (doFulfilled[partno]) {
    proses_cek_scan(partno, qtyInt, doData); // hanya kirim qty terbaru
    showStatus(`✅ KARTU DO OK : ${partno} qty ${qtyInt}`);
    return;
  }

  // Simpan ke kartuDO
  kartuDO.push({ partno, qty: qtyInt });

  const newTotalQty = totalQty + qtyInt;

  if (newTotalQty < qtyDo) {
    showStatus(`✅ Mengecek  KARTU DO (${partno} total: ${newTotalQty}/${qtyDo})`);
    playSound('../../../suara/yamaha_cek_kartu_do.mp3');
  } else if (newTotalQty === qtyDo) {
    showStatus(`✅ Lanjut scan barang ${partno} `);
    playSound('../../../suara/yamaha_lanjut_scan_barang.mp3');
    
    doFulfilled[partno] = true; // tandai DO-nya sudah terpenuhi
  } else {
    // Melebihi DO
    showStatus(`❌ Qty melebihi DO! Sudah scan ${newTotalQty} dari ${qtyDo}`);
    playSound('../../../suara/yamaha_scan_full.mp3');
    
    // Bersihkan partno dari kartuDO jika melebihi
    kartuDO = kartuDO.filter(item => item.partno !== partno);
  }
  renderKartuDO(); // Tambahkan ini
  resetInputan();
}


function renderKartuDO() {
  const div = document.getElementById('kartu_do_sementara');

  // Kelompokkan data berdasarkan partno dan hitung total qty
  const grouped = {};

  kartuDO.forEach(item => {
    if (!grouped[item.partno]) {
      grouped[item.partno] = 0;
    }
    grouped[item.partno] += item.qty;
  });

  // Buat HTML list
  if (Object.keys(grouped).length === 0) {
    div.innerHTML = "<p>Tidak ada data KARTU DO.</p>";
    return;
  }

  let html = "<ul class='browser-default'>";
  for (const [partno, totalQty] of Object.entries(grouped)) {
    const doItem = doData.find(item => item.part_number === partno);
    const qtyDo = doItem ? parseInt(doItem.qty) : 0;
    const isFull = totalQty === qtyDo;
    const emoji = isFull ? " ✅" : "";
    html += `<li style="font-size:20px"><strong>${partno}</strong>: Total Qty kartu <strong>${totalQty} dari Qty Do ${qtyDo}</strong>${emoji}</li>`;
  }
  html += "</ul>";

  div.innerHTML = html;
}
