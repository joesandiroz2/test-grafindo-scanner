const pb = new PocketBase(pocketbaseUrl);

document.addEventListener("DOMContentLoaded", function () {

    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    document.getElementById("start-date").value = formatDate(oneMonthAgo);
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
        startDateInput.value = oneMonthAgo.toISOString().split("T")[0];
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

async function fetchData(query, startDate, endDate) {
    Swal.fire({
        title: 'Sedang memuat data...',
        didOpen: () => {
            Swal.showLoading();
        }
    });
    try {
        const resultList = await pb.collection('kartu_stok').getList(1, 100, {
            filter: `(part_number ~ "${query}" || nama_barang ~ "${query}") && created >= "${startDate}" && created <= "${endDate}"`,
        });
        Swal.close();
        return resultList;
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
    const data = await fetchData(query, startDate, endDate); // Fetch data berdasarkan query

    renderTable(data); // Render hasil ke tabel
       renderDetailBarang(query); // Render detail barang
});



function renderTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Hapus data sebelumnya

    if (data.items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data ditemukan</td></tr>';
        return;
    }

    data.items.forEach((item,index) => {
        // Menentukan warna background berdasarkan status
        const bgColor = item.status.toLowerCase() === "keluar" ? "red" : "green";
        
        const row = `<tr style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">
            <td>${index + 1}</td> 
            <td>${item.qty_masuk}</td>
            <td>${item.balance}</td>
            <td>${item.qty_ambil}</td>
            <td>${item.lot}</td>
            <td>${item.no_dn.toUpperCase()}</td>
            <td>${item.dn_date}</td>
            <td>${item.nama_barang}</td>
            <td>${item.tgl_pb}</td>
            <td>${item.status}</td>
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
    try {
        await authenticate(); // Pastikan user sudah login
        const result = await pb.collection('kartu_stok').getFullList({
            fields: 'part_number, nama_barang'
        });

        // Buat array unik dari part_number dan nama_barang
        const uniqueData = [];
        const seenItems = new Set();

        result.forEach(item => {
            const key = `${item.part_number}-${item.nama_barang}`;
            if (!seenItems.has(key)) {
                seenItems.add(key);
                uniqueData.push({
                    id: item.part_number, // Gunakan part_number sebagai ID
                    text: `${item.part_number} - ${item.nama_barang}` // Tampilkan kedua-duanya
                });
            }
        });

        // Inisialisasi Select2 dengan fitur pencarian bebas
        $('#part-number').select2({
            data: uniqueData,
            placeholder: 'Cari Part Number atau Nama Barang...',
            allowClear: true
        });

    } catch (error) {
        console.error("Error loading part numbers:", error);
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

        detailDiv.innerHTML = `
            <div class="p-3">
                ${imageHtml}
                <h5>${item.nama_barang}</h5>
                <p><strong>Part Number:</strong> ${item.part_number}</p>
                <p><strong>Dari Tanggal:</strong> ${formatDate(startDate)}</p>
                <p><strong>Sampai Tanggal:</strong> ${formatDate(endDate)}</p>
            </div>
        `;
    } catch (error) {
        console.error("Error fetching item details:", error);
        document.getElementById("detail_barang").innerHTML = "<p class='text-danger'>Gagal mengambil data</p>";
    }
}
