const pb = new PocketBase(pocketbaseUrl);

document.addEventListener("DOMContentLoaded", function () {

    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    document.getElementById("start-date").value = formatDate(oneMonthAgo);
    document.getElementById("end-date").value = formatDate(today);
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
});



function renderTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Hapus data sebelumnya

    if (data.items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data ditemukan</td></tr>';
        return;
    }

    data.items.forEach(item => {
        // Menentukan warna background berdasarkan status
        const bgColor = item.status.toLowerCase() === "keluar" ? "red" : "green";
        
        const row = `<tr style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">
            <td>${item.qty_masuk}</td>
            <td>${item.balance}</td>
            <td>${item.qty_ambil}</td>
            <td>${item.lot}</td>
            <td>${item.no_dn.toUpperCase()}</td>
            <td>${item.dn_date}</td>
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
