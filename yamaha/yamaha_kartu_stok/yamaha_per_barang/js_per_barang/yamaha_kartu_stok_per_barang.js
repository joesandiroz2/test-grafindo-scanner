const pb = new PocketBase(pocketbaseUrl);

document.addEventListener("DOMContentLoaded", function () {

    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14); // 14 hari ke belakang

    const formatDate = (date) => date.toISOString().split("T")[0];

    document.getElementById("start-date").value = formatDate(twoWeeksAgo);
    document.getElementById("end-date").value = formatDate(today);
      const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const tgldariSpan = document.getElementById("tgldari");
    const tglsampaiSpan = document.getElementById("tglsampai");

      // Fungsi untuk memformat tanggal ke format '22 January 2025'
    function formatDateIndo(dateString) {
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    // Fungsi untuk mengupdate teks pada span
    function updateDateDisplay() {
        if (startDateInput.value) {
            tgldariSpan.textContent = formatDateIndo(startDateInput.value);
        }
        if (endDateInput.value) {
            tglsampaiSpan.textContent = formatDateIndo(endDateInput.value);
        }
    }
        startDateInput.value = twoWeeksAgo.toISOString().split("T")[0];
    endDateInput.value = today.toISOString().split("T")[0];

    updateDateDisplay(); // Perbarui tampilan span saat halaman dimuat

    // Tambahkan event listener saat input tanggal berubah
    startDateInput.addEventListener("change", updateDateDisplay);
    endDateInput.addEventListener("change", updateDateDisplay);
});


async function authenticate() {
    try {
        const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
        return authData;
    } catch (error) {
        console.error("Authentication failed:", error);
    }
}

async function fetchData(query, startDate, endDate,fetchsemua) {
    Swal.fire({
        title: 'Sedang mengecek Stok...',
        didOpen: () => {
            Swal.showLoading();
        }
    });
    let resultList = [];
    try {
        if (fetchsemua) {
            const resultList = await pb.collection('yamaha_kartu_stok').getFullList({
                filter: `(part_number ~ "${query}" ) && created >= "${startDate}" && created <= "${endDate}"`,
            });
             document.getElementById("keteranganstok").textContent = "Semua Stok detail";
            Swal.close();
            return resultList
        }else {
            // Fetch only the last entry
            resultList = await pb.collection('yamaha_kartu_stok').getList(1, 1, {
                filter: `(part_number ~ "${query}" )`,
                sort: '-created', // Sort by most recent
            });
            document.getElementById("keteranganstok").textContent = "Stok terakhir Saja Barang itu";
             Swal.close();
            return resultList.items
        }
    } catch (error) {
        console.error("Failed to fetch data:", error);
        Swal.close();
    }
}



function convertToTimestamp(dateString, isEndDate = false) {
    const date = new Date(dateString);
    
    // Jika endDate, set waktu ke 23:59:59 agar mencakup seluruh hari
    if (isEndDate) {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }

    return date.toISOString(); // Mengubah ke format ISO 8601
}



document.getElementById('filter-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    const query = document.getElementById('part-number').value; // Bisa Part Number atau Nama Barang
    const startDate = convertToTimestamp(document.getElementById('start-date').value);
    const endDate = convertToTimestamp(document.getElementById('end-date').value, true);

    await authenticate(); // Authenticate user
    const data = await fetchData(query, startDate, endDate,true); // Fetch data berdasarkan query

    renderTable(data); // Render hasil ke tabel
       renderDetailBarang(query); // Render detail barang
});


document.getElementById('tampilkan-stok-terakhir').addEventListener('click', async function(event) {
    const query = document.getElementById('part-number').value; // Bisa Part Number atau Nama Barang
    const startDate = convertToTimestamp(document.getElementById('start-date').value);
    const endDate = convertToTimestamp(document.getElementById('end-date').value, true);

    // Tampilkan Stok Terakhir saja (fetch satu data terakhir)
    const data = await fetchData(query, startDate, endDate, false);
    renderTable(data); // Render hasil ke tabel
    renderDetailBarang(query); // Render detail barang
});


//update cek tanda stok 
// update cek tanda stok 
async function updatePenandaStok(recordId) {
  try {
    await authenticate(); // pastikan user login
    await pb.collection('yamaha_kartu_stok').update(recordId, {
      penanda_stok: "ok"
    });

    // ambil ulang data dari database biar real
    const updatedRecord = await pb.collection('yamaha_kartu_stok').getOne(recordId);

    // Ambil user untuk cek apakah yang login pika
    const userGrafindo = localStorage.getItem("user-grafindo");

    // Cari baris tabel yang sesuai dengan recordId
    const row = document.querySelector(`#data-table-body tr td[onclick*="${recordId}"]`)?.parentElement;

    if (row && updatedRecord) {
      // Ambil sel balance (kolom ke-3 dari tabel kamu)
      const balanceCell = row.children[2];

      // Update nilainya langsung dari database
      balanceCell.textContent = updatedRecord.balance;

      // Jika penanda_stok "ok", tampilkan emoji bulat centang hijau 🟢✅
      if (updatedRecord.penanda_stok === "ok") {
        balanceCell.innerHTML += " ✔️";
        balanceCell.style.backgroundColor = "#81c784"; // hijau lembut
        balanceCell.style.borderRadius = "8px";
      }
    }

    Swal.fire({
      title: "Berhasil!",
      text: "Penanda stok telah diset menjadi OK.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Gagal update penanda_stok:", error);
    Swal.fire("Gagal!", "Tidak bisa mengupdate penanda_stok.", "error");
  }
}



// fungsi modal untuk konfirmasi penanda stok
function showPenandaModal(recordId, balanceValue) {
  Swal.fire({
    title: "Beri Penanda Stok",
    html: `
      <p><strong>Balance:</strong> ${balanceValue}</p>
      <label><input type="checkbox" id="cekOperator"> Sudah cek by operator</label>
    `,
    confirmButtonText: "Simpan",
    showCancelButton: true,
    cancelButtonText: "Batal",
    preConfirm: () => {
      const checked = document.getElementById('cekOperator').checked;
      if (!checked) {
        Swal.showValidationMessage("Harap centang terlebih dahulu");
        return false;
      }
      return checked;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await updatePenandaStok(recordId);
    }
  });
}


function renderTable(data) {
  
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Hapus data sebelumnya

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data ditemukan</td></tr>';
        return;
    }

    data.forEach((item,index) => {
        // Menentukan warna background berdasarkan status
     const userGrafindo = localStorage.getItem("user-grafindo");
        const bgColor = item.status.toLowerCase() === "keluar" ? "red" : "green";
        const balanceColor = Number(item.balance) < 0 ? 'red' : 'black';
      const penandaOk = item.penanda_stok === "ok";

    // hanya tampilkan emoji dan highlight kalau user-nya pika@gmail.com
        const showHighlight = userGrafindo === "pika@gmail.com" && penandaOk;

        // gaya background hanya untuk pika + penanda ok
        const highlightStyle = showHighlight ? "background-color:#81c784" : "";

         // kalau user pika@gmail.com, kolom balance bisa diklik
        const balanceEmoji = showHighlight  ? " ✔️" : "";

        const balanceCell = userGrafindo === "pika@gmail.com"
          ? `<td style="font-weight:bold;text-align:center;color:${balanceColor};cursor:pointer;${highlightStyle}" 
               onclick="showPenandaModal('${item.id}', '${item.balance}')">
               ${item.balance}${balanceEmoji}
             </td>`
          : `<td style="font-weight:bold;text-align:center;color:${balanceColor};${highlightStyle}">
               ${item.balance}${balanceEmoji}
             </td>`;

        const row = `<tr >
            <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">${index + 1}</td> 
            <td style="font-weight:bold;text-align:center;color:blue">${item.qty_masuk}</td>
           ${balanceCell}
            <td style="font-weight:bold;text-align:center;color:red">${item.qty_scan}</td>
            <td>${item.lot}</td>
            <td style="font-weight:bold;text-align:center">${item.kode_depan} ${item.no_do.toUpperCase()}</td>
            <td>${item.tgl_do}</td>
            <td style="font-weight:bold;text-align:center">${item.nama_barang}</td>
            <td>${item.tgl_pb}</td>
            <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">${item.status}</td>
            <td><i>${formatDate(item.created)}</i></td>
        </tr>`;
        
        tableBody.innerHTML += row;
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };
    return date.toLocaleString('id-ID', options).replace(',', '').replace(' ', ' '); // Format date
}

async function loadPartNumbers() {
    document.getElementById('loadpart').style.display = 'block';

    try {
         const res = await fetch(pocketbaseUrl + '/api/collections/yamaha_unik_part_number/records?page=1&perPage=2000&sort=-created');
        const data = await res.json();

        // Mapping data dari response API ke format Select2
        const uniqueData = data.items.map(item => ({
            id: item.part_number,
             text: `${item.part_number} - ${item.nama_barang}` 
        }));

        // Inisialisasi Select2 dengan data yang sudah diformat
        $('#part-number').select2({
            data: uniqueData,
            placeholder: 'Cari Part Number...',
            allowClear: true
        })
    } catch (error) {
        console.error("Error loading part numbers:", error);
    }finally {
        // Sembunyikan elemen loading
        document.getElementById('loadpart').style.display = 'none';
    }
}

async function fetchLastBalance(partNumber) {
    try {
        await authenticate(); // Pastikan user sudah login
        
        const result = await pb.collection('yamaha_kartu_stok').getList(1, 1, {
            filter: `part_number = "${partNumber}"`,
            sort: '-created' // Mengambil data terbaru
        });

        if (result.items.length > 0) {
            return result.items[0].balance; // Mengembalikan balance terakhir
        } else {
            return 'Data tidak ditemukan'; // Jika tidak ada data
        }
    } catch (error) {
        console.error("Error fetching last balance:", error);
        return 'Error fetching data'; // Mengembalikan pesan error
    }
}

async function renderDetailBarang(query) {
    try {
        await authenticate(); // Pastikan user sudah login
        const result = await pb.collection('yamaha_data_barang').getList(1, 1, {
            filter: `part_number = "${query}"`,
        });

        const detailDiv = document.getElementById("detail_barang");

        if (result.items.length === 0) {
            detailDiv.innerHTML = "<p class='text-center'>Data tidak ditemukan</p>";
            return;
        }

        const item = result.items[0];
        const imageHtml = item.gambar 
        ? `<img src="${pocketbaseUrl}/api/files/yamaha_data_barang/${item.id}/${item.gambar}" 
               alt="${item.nama_barang}" 
               class="img-fluid rounded mb-3" 
               style="max-width: 150px;">` 
        : `<p style="color: red; font-weight: bold;">Tidak ada gambar</p>`;

        // Ambil nilai tanggal dari input
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        // Format tanggal ke "22 January 2024"
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        };
         const lastBalance = await fetchLastBalance(item.part_number);

        detailDiv.innerHTML = `
            <div class="p-3">
                ${imageHtml}
                <h5>${item.nama_barang}</h5>
                <p><strong>Part Number:</strong> ${item.part_number}</p>
                <p><strong>Dari Tanggal:</strong> ${formatDate(startDate)}</p>
                <p><strong>Sampai Tanggal:</strong> ${formatDate(endDate)}</p>
                <p><strong>Stok Sekarang:</strong> ${lastBalance}</p> 

            </div>
        `;
    } catch (error) {
        console.error("Error fetching item details:", error);
        document.getElementById("detail_barang").innerHTML = "<p class='text-danger'>Gagal mengambil data</p>";
    }
}



// Download Excel
// Event listener untuk tombol Download Excel
document.getElementById('excel-btn').addEventListener('click', async function() {
    const query = document.getElementById('part-number').value; // Ambil query dari input
    const startDate = convertToTimestamp(document.getElementById('start-date').value);
    const endDate = convertToTimestamp(document.getElementById('end-date').value, true);

    // Ambil data menggunakan getFullList
    const records = await pb.collection('yamaha_kartu_stok').getFullList({
        filter: `(part_number ~ "${query}" || nama_barang ~ "${query}") && created >= "${startDate}" && created <= "${endDate}"`
    });

    if (records.length === 0) {
        Swal.fire('Data Kosong', 'Anda belum klik tampilkan atau belum ada datanya.', 'warning');
        return;
    }

    // Panggil fungsi untuk mengunduh Excel
    downloadExcel(records, query); // Pass query as partNumber
});
// Fungsi untuk mengunduh data sebagai Excel
// Fungsi untuk mengunduh data sebagai Excel
function downloadExcel(data) {
    // Ambil partNumber dan namaBarang dari data
    const partNumber = data[0].part_number; // Ambil part_number dari item pertama
    const namaBarang = data[0].nama_barang; // Ambil nama_barang dari item pertama

    const userGrafindo = localStorage.getItem("user-grafindo");

    let a1Value = ""; // default kosong
    if (userGrafindo === "kamto@gmail.com") {
        a1Value = "FRM-INV-06";
    } else if (userGrafindo === "pika@gmail.com") {
        a1Value = "FRM-DEPO-02";
    }


    // Format data untuk worksheet
    const formattedData = data.map((item, index) => ({
        No: index + 1,
        qty_masuk: item.qty_masuk,
        balance: item.balance,
        qty_scan: item.qty_scan,
        part_number: item.part_number,
        nama_barang: item.nama_barang,
        no_do: item.no_do,
        tgl_do: item.tgl_do, // Format tanggal
        tgl_pb: formatDateExcel(item.tgl_pb), // Format tanggal
        created: formatDateExcel(item.created) // Format tanggal
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]); // Buat worksheet kosong

    // Tulis data mulai dari A3 agar tidak tabrakan dengan A1 & C1
    XLSX.utils.sheet_add_json(ws, formattedData, { origin: "A3", skipHeader: false });


    // Tambahkan header manual di baris 1 sesuai permintaan
    // A1 : formFormat (merge A1:B1)
        ws['A1'] = { t: 's', v: a1Value };

        ws['C1'] = { t: 's', v: 'KARTU STOK' };

        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
        ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 9 } });

        ws['C1'].s = { font: { bold: true, sz: 30 }, alignment: { horizontal: "center" } };
        ws['A1'].s = { alignment: { horizontal: "center" } };

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(workbook, ws, 'Kartu Stok');

    // Buat nama file dengan format yang diinginkan
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate); // Format tanggal saat ini
    const fileName = `${partNumber}_${namaBarang}_${formattedDate}.xlsx`;

    // Buat file Excel dan unduh
    XLSX.writeFile(workbook, fileName);

    // Tampilkan notifikasi bahwa file telah berhasil diunduh
    Swal.fire({
        title: 'Berhasil!',
        text: 'File Excel telah berhasil diunduh.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
}

// Fu
// Fungsi untuk memformat tanggal
function formatDateExcel(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };
    return date.toLocaleString('id-ID', options).replace(',', '').replace(' ', ' '); // Format date
}
