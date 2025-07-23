
let timeout = null;
let doData = []; // akan menyimpan hasil search DO
let buffer = '';
let typingTimer;
let doneTypingInterval = 700; // 0.7 detik setelah user berhenti ngetik

const spinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const tableBody = document.querySelector("#table-do-list tbody");

let inputPartNo 
let inputQty 
let inputPo 


window.onload = () => {
  const input = document.getElementById('scannerInput');
  if (!input) {
    console.error("scannerInput tidak ditemukan!");
    return;
  }

  let timeoutId;

  function startTimer() {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      const value = input.value.trim();
      if (value) {
        const illegalCharRegex = /[^a-zA-Z0-9\s\-#]/;

        if (illegalCharRegex.test(value)) {
          Swal.fire({
            icon: 'warning',
            title: '⚠️ Input tidak standar',
            html: `Mengandung karakter ilegal<br><br><strong>Input:</strong> ${value}`,
            timer: 1000,
            showConfirmButton: false,
            timerProgressBar: true
          });
          playSound('../../../suara/yamaha_partnumber_ga_standar.mp3');

             input.value = '';        // kosongkan input
            input.focus();           // kembalikan fokus
          return;
        }

        const parts = value.split(/\s+/);

        // ❌ Jumlah blok tidak boleh 2 atau lebih dari 3
        if (parts.length === 2 || parts.length > 3) {
        Swal.fire({
          icon: 'warning',
          title: '⚠️ Input tidak standar',
          html: `Jumlah blok harus 1 atau 3, bukan <strong>${parts.length}</strong><br><br><strong>Input:</strong> ${value}`,
          timer: 1000,
          showConfirmButton: false,
          timerProgressBar: true
        });
          playSound('../../../suara/yamaha_partnumber_ga_standar.mp3');
        

          resetInputan()
          return;
        }

        // ✅ Jika 1 blok → jalankan searchDO
        if (parts.length === 1) {
          const doVal = parts[0];
          searchDO(doVal);
          playSound('../../../suara/yamaha_scan_do.mp3');
          input.value = '';        // kosongkan input
          input.focus();           // kembalikan fokus
          return;
        }

        // ✅ Jika 3 blok → tampilkan alert nilai1, nilai2, nilai3
        if (parts.length === 3) {
          inputPartNo = parts[0];
          inputQty = parts[1];
          let poRaw = parts[2].toUpperCase().trim();

          if (poRaw.startsWith('#')) {
            inputPo = poRaw; // Sudah pakai #, biarkan
          }
            else if (/^\d+$/.test(poRaw)) {
            inputPo = poRaw; // Angka murni → jangan pakai #
          } else {
            inputPo = poRaw; // Default, tetap tambahkan #
          }


          submitData()
        }
      }
    }, 200); // 5 menit
  }

  startTimer();
  input.addEventListener('input', startTimer);
};



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
        <td ${rowStyle}>${item.remarks}</td>
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











function submitData() {

  // Tampilkan alert atau kirim ke server
     simpanKeKartuDO(inputPartNo, inputQty,inputPo);
    document.getElementById('scannerInput').value = '';
  document.getElementById('scannerInput').focus();
}





