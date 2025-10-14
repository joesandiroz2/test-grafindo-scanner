const pb = new PocketBase(pocketbaseUrl);

document.addEventListener("DOMContentLoaded", function () {

    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 2); // 5 hari ke belakang

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
            const resultList = await pb.collection('kartu_stok').getFullList({
                filter: `(part_number ~ "${query}" ) && created >= "${startDate}" && created <= "${endDate}"`,
            });
             document.getElementById("keteranganstok").textContent = "Semua Stok detail";
            Swal.close();
            return resultList
        }else {
            // Fetch only the last entry
            resultList = await pb.collection('kartu_stok').getList(1, 1, {
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

function renderTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Hapus data sebelumnya

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data ditemukan</td></tr>';
        return;
    }

    data.forEach((item,index) => {
        // Menentukan warna background berdasarkan status
        const bgColor = item.status.toLowerCase() === "keluar" ? "red" : "green";
        const balanceColor = Number(item.balance) < 0 ? 'red' : 'black';
    
        const row = `<tr >
            <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">${index + 1}</td> 
            <td style="font-weight:bold;text-align:center;color:blue">${item.qty_masuk}</td>
            <td style="font-weight:bold;text-align:center;color:${balanceColor}">${item.balance}</td>
            <td style="font-weight:bold;text-align:center;color:red">${item.qty_ambil}</td>
            <td>${item.lot}</td>
            <td style="font-weight:bold;text-align:center">${item.no_dn.toUpperCase()}</td>
            <td>${item.dn_date}</td>
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
  const loadPart = document.getElementById('loadpart');
  const loadText = document.getElementById('loadtext');
  const progressBar = document.getElementById('progressbar');
  loadPart.style.display = 'block';

  try {
    await authenticate(); // kalau pakai login PocketBase

    let allItems = [];
    let page = 1;
    const perPage = 100;

    // 🔹 Ambil halaman pertama
    const firstRes = await fetch(`${pocketbaseUrl}/api/collections/unik_partnumber_kartu_stok/records?page=${page}&perPage=${perPage}&sort=-created`);
    const firstData = await firstRes.json();

    const totalPages = firstData.totalPages || 1;
    const totalItems = firstData.totalItems || firstData.items.length;

    allItems.push(...firstData.items);

    // 🔹 Update progress
    loadText.textContent = `Memuat data part AHM dari: 1 dari ${totalPages}`;
    progressBar.style.width = `${(1 / totalPages) * 100}%`;
    await new Promise(r => requestAnimationFrame(r)); // biar browser render dulu

    // 🔁 Loop ambil halaman berikutnya
    for (page = 2; page <= totalPages; page++) {
      const res = await fetch(`${pocketbaseUrl}/api/collections/unik_partnumber_kartu_stok/records?page=${page}&perPage=${perPage}&sort=-created`);
      const data = await res.json();

      allItems.push(...data.items);

      // 🔹 Update progress bar dan teks
      const percent = Math.min((page / totalPages) * 100, 100);
      loadText.textContent = `Memuat data part AHM dari: ${page} dari ${totalPages} (${percent.toFixed(0)}%)`;
      progressBar.style.width = `${percent}%`;

      // ⏸️ Force browser untuk update DOM sebelum lanjut
      await new Promise(r => requestAnimationFrame(r));
    }

    // 🧩 Format data ke Select2
    const formattedData = allItems.map(item => ({
      id: item.part_number,
      text: `${item.part_number} - ${item.nama_barang}`
    }));

    // 🚀 Inisialisasi Select2
    $('#part-number').select2({
      data: formattedData,
      placeholder: 'Cari Part Number...',
      allowClear: true
    });

    loadText.textContent = `✅ Selesai memuat ${totalItems} data part AHM`;
    progressBar.style.width = `100%`;
    progressBar.classList.remove('blue');
    progressBar.classList.add('green');

  } catch (err) {
    console.error('Error:', err);
    loadText.textContent = '❌ Gagal memuat data part number.';
    progressBar.classList.remove('blue');
    progressBar.classList.add('red');
    progressBar.style.width = '100%';
  }
}

async function fetchLastBalance(partNumber) {
    try {
        await authenticate(); // Pastikan user sudah login
        
        const result = await pb.collection('kartu_stok').getList(1, 1, {
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
        const result = await pb.collection('data_barang').getList(1, 1, {
            filter: `part_number = "${query}"`,
        });

        const detailDiv = document.getElementById("detail_barang");

        if (result.items.length === 0) {
            detailDiv.innerHTML = "<p class='text-center'>Data tidak ditemukan</p>";
            return;
        }

        const item = result.items[0];
        const imageHtml = item.gambar 
        ? `<img src="${pocketbaseUrl}/api/files/data_barang/${item.id}/${item.gambar}" 
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
    const records = await pb.collection('kartu_stok').getFullList({
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

    // Format data untuk worksheet
    const formattedData = data.map((item, index) => ({
        No: index + 1,
        qty_masuk: item.qty_masuk,
        balance: item.balance,
        qty_scan: item.qty_ambil,
        part_number: item.part_number,
        nama_barang: item.nama_barang,
        no_dn: item.no_dn,
        dn_date: formatDateExcel(item.dn_date), // Format tanggal
        tgl_pb: formatDateExcel(item.tgl_pb), // Format tanggal
        created: formatDateExcel(item.created) // Format tanggal
    }));

    // Buat workbook dan worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kartu Stok');

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
