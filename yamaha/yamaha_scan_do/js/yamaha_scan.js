let pb = new PocketBase(pocketbaseUrl);
let timeout = null;

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
  statusMessage.className = `mt-3 text-center fw-bold`;
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
    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.kode_depan + item.no_do}</td>
        <td>${item.part_number}</td>
        <td>${item.nama_barang}</td>
        <td>${item.qty}</td>
      </tr>
    `;
  });
}

// Ambil data dari PocketBase dan filter
async function searchDO(partNoValue) {
  showLoading();
  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    const records = await pb.collection('yamaha_do').getFullList({
      sort: '-created',
    });

    // Filter berdasarkan no_do
    const filtered = records.filter(record =>
      record.no_do.toLowerCase().includes(partNoValue.toLowerCase())
    );

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

// Input listener dengan delay 2 detik
let lastPartNo = "";
let searchDone = false;

const handleInput = () => {
  clearTimeout(timeout);
  const val = inputPartNo.value.trim();
  const qty = inputQty.value.trim();

  if (val === "") return; // Tidak lanjut jika kosong

  timeout = setTimeout(async () => {
    // CASE 1: Hanya partno terisi
    if (qty === "") {
      window.cachedDOList = await searchDO(val);
      lastPartNo = val;
      searchDone = true;
      playSound('../../../suara/yamaha_scan_do.mp3');
      return;
    }

    // CASE 2: Partno dan qty terisi
    if (qty !== "" && !isNaN(qty)) {
      // Jika searchDO belum dilakukan sebelumnya
      if (!searchDone || lastPartNo !== val) {
        window.cachedDOList = await searchDO(val);
        playSound('../../../suara/yamaha_scan_do.mp3');
        lastPartNo = val;
        searchDone = true;
      }

      const match = window.cachedDOList.find(item => item.part_number === val);
      if (match) {
        try {
          const existing = await pb.collection("yamaha_kartu_stok").getFullList({
            filter: `part_number = '${val}'`,
            sort: '-created',
            limit: 1
          });

          const lastBalance = existing.length > 0 ? parseInt(existing[0].balance) || 0 : 0;
          const newBalance = lastBalance - parseInt(qty);

          const data = {
            kode_depan: match.kode_depan,
            no_do: match.no_do,
            part_number: val,
            nama_barang: match.nama_barang,
            qty_scan: qty,
            qty_do: match.qty,
            status: "keluar",
            remarks: match.remarks,
            balance: newBalance
          };

          await pb.collection("yamaha_kartu_stok").create(data);

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Data berhasil ditambahkan',
            showConfirmButton: false,
            timer: 1500
          });

          inputQty.value = "";
          inputPartNo.value = "";
          inputPartNo.focus();
          searchDone = false;
        } catch (error) {
          console.error("Gagal simpan:", error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal menyimpan',
            text: 'Terjadi kesalahan saat menyimpan data!'
          });
        }
      }
    }
  }, 3000);
};

// Pasang ke dua input
inputPartNo.addEventListener('input', handleInput);
inputQty.addEventListener('input', handleInput);

// document.addEventListener("DOMContentLoaded", keepAutofocus);
