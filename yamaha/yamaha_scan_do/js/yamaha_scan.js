
let timeout = null;
let doData = []; // akan menyimpan hasil search DO
let buffer = '';
let typingTimer;
let doneTypingInterval = 700; // 0.7 detik setelah user berhenti ngetik

const spinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const tableBody = document.querySelector("#table-do-list tbody");

const inputPartNo = document.getElementById('input-partno');
const inputQty = document.getElementById('input-qty');







// Tampilkan pesan status
function showStatus(text) {
  statusMessage.innerHTML = text;
  statusMessage.className = `mt-3 white-text text-center fw-bold`;
}

// Tampilkan loading
function showLoading() {
  spinner.style.display = 'block';
  showStatus("Sedang mencari DO ini...");
}

// Sembunyikan loading
function hideLoading() {
  spinner.style.display = 'none';
}

// Render tabel dari hasil pencarian
function renderTable(data) {
  tableBody.innerHTML = '';
  if (data.length === 0) {
    showStatus("DO  belum di Upload ");
    playSound('../../../suara/yamaha_do_belum_ada_di_sistem.mp3');
    
    return;
  }

  statusMessage.innerHTML = ''; // Hapus pesan status kalau ada data

  data.forEach((item, index) => {
     const totalScanned = scanData
  .filter(scan => scan.part_number === item.part_number && scan.no_do === item.no_do)
  .reduce((sum, s) => sum + parseInt(s.qty_scan || 0), 0);


     const isFull = parseInt(item.qty) === totalScanned;
    const checkIcon = isFull ? "✅" : "";

    const rowStyle = totalScanned === 0
      ? ''
      : isFull
        ? 'style="background-color: green; font-weight: bold; color: white;"'
        : 'style="background-color: orange; font-weight: bold; color: black;"';


    tableBody.innerHTML += `
       <tr >
       <td ${rowStyle}>${index + 1}</td>
        <td ${rowStyle}>${item.kode_depan + item.no_do}</td>
        <td ${rowStyle}>${item.part_number}</td>
        <td ${rowStyle}>${item.nama_barang}</td>
          <td ${rowStyle}>
        ${item.qty} (scan: ${totalScanned}) ${checkIcon}
      </td>

      </tr>
    `;
  });
  cekSemuaBarangSudahSelesai(data)
}




// check sudah beres semua scan nya
function cekSemuaBarangSudahSelesai(data) {
  const semuaSelesai = data.every(item => {
    const totalScanned = scanData
      .filter(scan => scan.part_number === item.part_number && scan.no_do === item.no_do)
      .reduce((sum, s) => sum + parseInt(s.qty_scan || 0), 0);
    return totalScanned >= parseInt(item.qty);
  });

  if (semuaSelesai && data.length > 0) {
    
    playSound('../../../suara/yamaha_udah_di_scan_semua.mp3'); // (opsional: tambahkan file audio ini)
  }
}






document.getElementById('input-partno').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();

    // Ambil value dan bersihkan enter atau newline
    const rawVal = this.value;
    const doVal = rawVal.replace(/[\n\r]/g, '').trim(); // buang \n dan \r
    const qtyVal = document.getElementById('input-qty').value.trim();

    if (doVal && !qtyVal) {
      searchDO(doVal);
      playSound('../../../suara/yamaha_scan_do.mp3');
      this.value = ''; // reset kalau perlu
      this.focus();    // tetap fokus di input
    }
  }
});




function submitData() {
  let kode = document.getElementById('input-partno').value;
  const qty = document.getElementById('input-qty').value;

  kode = kode.toUpperCase().replace(/\s+/g, '');

  // Tampilkan alert atau kirim ke server
     simpanKeKartuDO(kode, qty);
  
  // Kosongkan dan fokus kembali ke input DO
  document.getElementById('input-partno').value = '';
  document.getElementById('input-qty').value = '';
  document.getElementById('input-partno').focus();
}

// Autofocus ke input DO saat pertama kali
window.onload = () => {
  document.getElementById('input-partno').focus();
};
