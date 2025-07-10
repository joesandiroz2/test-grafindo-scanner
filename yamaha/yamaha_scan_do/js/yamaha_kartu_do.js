let kartuDO = [];
let doFulfilled = {}; // penanda DO partno yang sudah penuh
let noDoTerakhir = null;
let partnoYangHarusDiproses = null; // ⬅️ Tambahan penting!

let isTerkunci = false;

function simpanKeKartuDO(partno, qty,nopo) {
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

    // ✅ Cek jika sedang proses partno yang sudah FULL sebelumnya
  // Jika sedang proses partno lain, jangan lanjut sebelum full scan
if (partnoYangHarusDiproses && partno !== partnoYangHarusDiproses) {
  const partnoSebelumnya = partnoYangHarusDiproses;
  const doItemSebelumnya = doData.find(item => item.part_number === partnoSebelumnya);
  const qtyDoSebelumnya = parseInt(doItemSebelumnya.qty);

  // Hitung total scan dari scanData
  const totalQtyScanSebelumnya = scanData
    .filter(item => item.part_number === partnoSebelumnya)
    .reduce((sum, item) => sum + parseInt(item.qty_scan || 0), 0);

  if (totalQtyScanSebelumnya >= qtyDoSebelumnya) {
    // Sudah scan penuh, partno bisa diganti
    partnoYangHarusDiproses = null;
  } else {
    showStatus("❌ Barang Ga sesuai dengan partnumber Kartu DO");
    playSound('../../../suara/yamaha_kartu_do_ga_sesuai_barang.mp3');
isTerkunci = true;
document.getElementById("tabelscanner").setAttribute("style", "display: none !important;");

   document.getElementById("doTerkunci").style.display = "block";


// 🔒 Kunci DO ke PocketBase
updateDoTerkunci(doItem.no_do);

delete cacheByNoDo[doItem.no_do]; // <– Tambahkan ini
    resetInputan();
    return;
  }
}

  // Jika DO sudah terpenuhi, input berikutnya langsung proses
   if (doFulfilled[partno]) {
    proses_cek_scan(partno, qtyInt, doData,nopo);
    showStatus(`✅ Sedang Menginput data Scan....`);
    return;
  }

  // ✅ Cek apakah noPo sesuai dengan remarks dari DO
  if (doItem.remarks && nopo !== doItem.remarks) {
    showStatus(`❌ No PO / Remarks Kagak sesuai dengan remarks di Do!\n\nInput anda: ${nopo}\n  Dari  ${doItem.no_do} harusnya : ${doItem.remarks}`);
    playSound('../../../suara/yamaha_nomor_po_ga_sesuai.mp3'); // opsional
    resetInputan();
    return;
  }

  // Simpan ke kartuDO
  kartuDO.push({ partno, qty: qtyInt });
  partnoYangHarusDiproses = partno; // kunci sampai benar-benar scan

  const newTotalQty = totalQty + qtyInt;

  if (newTotalQty < qtyDo) {
    showStatus(`✅ Mengecek  KARTU DO (${partno} total: ${newTotalQty}/${qtyDo})`);
    
    playSound('../../../suara/yamaha_cek_kartu_do.mp3');
  } else if (newTotalQty === qtyDo) {
    showStatus(`🔥 BARANG NYA ${partno} 🔥`);
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
    const bgColor = isFull ? 'green' : 'red';

    const label = isFull
      ? `<span style="background-color: white; color: green; font-weight: bold; padding: 3px;">FULL</span> OK ✅`
      : `<span style="background-color: white; color: red; font-weight: bold; padding: 3px;">TIDAK FULL</span>`;


     const text = isFull
      ? `${partno}: Qty ${totalQty} / ${qtyDo} ${label}`
      : `${partno}: Qty ${totalQty} dari ${qtyDo} ${label}`;


    html += `<li style="
     background-color: ${bgColor};
        color: white;
        font-weight: bold;
        padding: 8px;
        margin-bottom: 5px;
        border-radius: 5px;
    font-size:20px">
     ${text}
    </li>`;
  }
  html += "</ul>";

  div.innerHTML = html;
}


async function updateDoTerkunci(noDo) {
  try {
    // Ambil semua DO yang punya no_do sama
    const records = await pb.collection('yamaha_do').getFullList({
      filter: `no_do="${noDo}"`
    });

    if (records.length === 0) {
      console.warn(`Tidak ada DO ditemukan dengan no_do = ${noDo}`);
      return;
    }

    console.log(`Jumlah DO yang akan dikunci: ${records.length}`);

    // Loop dan update semua record
    for (const record of records) {
      await pb.collection('yamaha_do').update(record.id, {
        is_lock: "terkunci",
        is_lock_msg: "Scan barang ga sesuai dengan kartu DO"
      });
      console.log(`Berhasil mengunci record ID: ${record.id}`);
    }

    console.log(`Semua DO dengan no_do ${noDo} berhasil dikunci`);
  } catch (error) {
    console.error('Gagal mengupdate yamaha_do:', error);
  }
}

