



let pb = new PocketBase(pocketbaseUrl);
let timeout = null;

let doData = []; // akan menyimpan hasil search DO


const inputPartNo = document.getElementById('input-partno');
const inputQty = document.getElementById('input-qty');

const spinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const tableBody = document.querySelector("#table-do-list tbody");

function keepAutofocus() {
  inputPartNo.focus();
  inputPartNo.addEventListener('blur', () => {
    setTimeout(() => {
      inputPartNo.focus()
    },100);
  });

}


function playSound(filePath) {
  const audio = document.getElementById("notif-sound");
  audio.src = filePath;
  audio.currentTime = 0;  // mulai dari awal
  audio.play().catch(e => console.warn("Audio play failed:", e));
}

// Tampilkan pesan status
function showStatus(text) {
  statusMessage.innerHTML = text;
  statusMessage.className = `mt-3 bg-warning text-center fw-bold`;
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
    showStatus("DO ini belum di Upload di sistem ini");
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

    tableBody.innerHTML += `
       <tr >
       <td>${index + 1}</td>
        <td>${item.kode_depan + item.no_do}</td>
        <td>${item.part_number}</td>
        <td>${item.nama_barang}</td>
          <td 
        ${
          totalScanned === 0
            ? ''
            : totalScanned === parseInt(item.qty)
              ? 'style="background-color: green; font-weight: bold; color: white;"'
              : 'style="background-color: orange; font-weight: bold; color: black;"'
        }
      >
        ${item.qty} (scan: ${totalScanned}) ${checkIcon}
      </td>

      </tr>
    `;
  });
}


// proses cek scan
let timer = null;
document.getElementById('input-partno').addEventListener('input', function () {
  if (this.value.trim() !== '' && !timer) {
    timer = setTimeout(() => {
      const partno = document.getElementById('input-partno').value.trim();
      const qty = document.getElementById('input-qty').value.trim();
      playSound('../../../suara/yamaha_scan_do.mp3');

      if (qty === '') {
        searchDO(partno);

      } else {
        // Kalau qty ada isinya, tampilkan alert
    proses_cek_scan(partno, qty, doData);
    
        }

      timer = null; // Reset timer
    }, 3000);
  }
});




// document.addEventListener("DOMContentLoaded", keepAutofocus);
