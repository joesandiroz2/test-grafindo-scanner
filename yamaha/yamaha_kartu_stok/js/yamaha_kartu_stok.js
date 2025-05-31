const pb = new PocketBase(pocketbaseUrl);
let currentPage = 1;
let totalPages = 0;

// Function to format the date
function formatDate(dateString) {
const date = new Date(dateString);

// Ambil bagian tanggal
const day = date.getDate().toString().padStart(2, '0'); // Pastikan selalu 2 digit
const month = date.toLocaleString('id-ID', { month: 'long' }); // Nama bulan dalam bahasa Indonesia
const year = date.getFullYear();

// Ambil bagian jam & menit
const hours = date.getHours().toString().padStart(2, '0'); // Pastikan selalu 2 digit
const minutes = date.getMinutes().toString().padStart(2, '0');

// Gabungkan tanpa "pukul"
return `${day} ${month} ${year} ${hours}:${minutes}`;
}


async function authenticate() {
try {
    const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
    return authData;
} catch (error) {
    console.error("Authentication failed:", error);
}
}

async function fetchData(page) {
  // Buat preloader secara dinamis
const loadingElement = document.createElement("div");
loadingElement.innerHTML = `
    <div class="text-center my-3" id="loading">
        <div class="spinner-border text-primary" role="status">
        </div>
    </div>
    <p style="text-align:center">Sedang mengambil kartu stok...</p>
`;
document.body.appendChild(loadingElement); // Tambahkan ke body


try {
    const resultList = await pb.collection('yamaha_kartu_stok').getList(page, 500, {
        sort: '-created' // Mengurutkan berdasarkan field 'created' secara menurun
    });
     document.body.removeChild(loadingElement);
    return resultList;
} catch (error) {
    console.error("Failed to fetch data:", error);
    document.body.removeChild(loadingElement);
}
}

function renderTable(data) {
const tableBody = document.getElementById('data-table-body');
tableBody.innerHTML = '';

// Mengelompokkan data berdasarkan part_number dan lot
const groupedData = {};

data.items.forEach(item => {
    const key = `${item.part_number}-${item.lot}`;
    
    // Pastikan qty_scan diubah menjadi Number
    const qtyAmbil = Number(item.qty_scan); // Mengonversi qty_scan menjadi Number

    if (!groupedData[key]) {
        // Jika belum ada, simpan item dan inisialisasi qty_scan
        groupedData[key] = {
            ...item,
            qty_scan: qtyAmbil, // Simpan qty_scan sebagai Number
            balance: item.balance, // Simpan balance dari item pertama
            qty_masuk: item.qty_masuk,
            count: 1 // Untuk menghitung jumlah item yang sama
        };
    } else {
        // Menjumlahkan qty_scan
        groupedData[key].qty_scan += qtyAmbil; // Menjumlahkan qty_scan
        // Tidak mengubah balance, tetap menggunakan balance dari item pertama
        groupedData[key].count += 1; // Menambah hitungan
    }
});

// Mengubah objek menjadi array untuk ditampilkan
const finalData = Object.values(groupedData);

finalData.forEach((item, index) => {
    const formattedDate = formatDate(item.created);
    const nomorUrut = (currentPage - 1) * 60 + index + 1;

    // Menentukan gaya dan ikon status
    let statusStyle = '';
    let statusIcon = '';
    let statusText = '';
    
    if (item.status === 'keluar') {
        statusStyle = 'color: red; font-weight: bold;';
        statusIcon = '❌';
         statusText = 'Barang Keluar'; 
    } else if (item.status === 'masuk') {
        statusStyle = 'color: green; font-weight: bold;';
        statusIcon = '✅';
         statusText = item.status;
    } else {
        statusStyle = 'color: black;';
        statusIcon = '';
    }

    let balanceStyle = 'font-weight: bold; text-align: center; color: black;';

    if (item.balance < 0) {
        balanceStyle = 'font-weight: bold; text-align: center; color: red;';
    }
    const row = `<tr>
        <td>${nomorUrut}</td>
        <td >${item.part_number}</td>
        <td style="font-weight:bold">${item.nama_barang}</td>
        <td >${item.lot}</td>
        <td style="color:purple;font-weight:bold">${item.qty_masuk}</td>
        <td style="${balanceStyle}">${item.balance}</td>
        <td style="color:red;font-weight:bold">${item.qty_scan}</td>
        <td style="font-weight:bold">${item.kode_depan + item.no_do.toUpperCase()}</td>
        
        <td style="${statusStyle}"> ${statusText}</td>
        <td><i>${formattedDate}</i></td>
    </tr>`;
    tableBody.innerHTML += row;
});
}
function renderPagination() {
const pagination = document.getElementById('pagination');
pagination.innerHTML = '';

// Previous button
const prevButton = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="changePage(currentPage - 1)">Sebelumnya</a>
</li>`;
pagination.innerHTML += prevButton;

// Current page indicator
const pageInfo = `<li class="page-item disabled">
    <span class="page-link">Halaman ${currentPage} dari ${totalPages}</span>
</li>`;
pagination.innerHTML += pageInfo;

// Next button
const nextButton = `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="changePage(currentPage + 1)">Halaman Selanjutnya</a>
</li>`;
pagination.innerHTML += nextButton;
}

async function changePage(page) {
if (page < 1 || page > totalPages) return;
currentPage = page;
const data = await fetchData(currentPage);
totalPages = data.totalPages; // Update total pages based on fetched data
renderTable(data);
renderPagination();
}

(async () => {
await authenticate();
const data = await fetchData(currentPage);
totalPages = data.totalPages; // Set total pages from fetched data
renderTable(data);
renderPagination();
})();



