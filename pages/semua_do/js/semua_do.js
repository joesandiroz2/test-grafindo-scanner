
const pb = new PocketBase(pocketbaseUrl);

async function fetchData(page = 1,filter = '') {
    try {
        // Tampilkan loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Mengambil data, harap tunggu...',
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading();
            }
        });

        // Autentikasi
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

        // Ambil data dari koleksi data_do
        const resultList = await pb.collection('data_do').getList(page, 50, {
            sort: '-created', // Mengurutkan berdasarkan tanggal terbaru
            filter: filter, // Ganti dengan filter yang sesuai
        });

        // Hapus loading indicator
        Swal.close();

        // Tampilkan data di tabel
        displayResults(resultList.items);
        setupPagination(resultList.totalItems, page);
    } catch (error) {
        console.error(error);
        Swal.fire('Error, coba refresh web ', 'Terjadi kesalahan saat mengambil data.', 'error');
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', options).replace(',', ''); // Format sesuai dengan yang diinginkan
}

function displayResults(items) {
    const resultContainer = $("#result-container");
    resultContainer.empty(); // Kosongkan hasil sebelumnya

    if (items.length > 0) {
        let table = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Diupload</th>
                        <th>Delivery Note Date</th>
                        <th>Supplier Part Number</th>
                        <th>Nama Barang</th>
                        <th>Qty DN</th>
                        <th>Delivery Note No</th>
                        <th>PO Number</th>
                        <th>Plant ID</th>
                        <th>Gate ID</th>
                    </tr>
                </thead>
                <tbody>`;
        
        items.forEach(item => {
            table += `
                <tr>
                    <td style="font-style:italic">${formatDate(item.created)}</td> <!-- Menampilkan tanggal yang diformat -->
                    <td style="font-weight:bold">${item.Delivery_Note_No}</td>
                    <td>${item.Supplier_Part_Number}</td>
                    <td style="font-weight:bold">${item.Part_Number_Desc}</td>
                    <td>${item.Qty_DN}</td>
                    <td>${item.Delivery_Note_Date}</td>
                    <td>${item.PO_Number}</td>
                    <td>${item.Plant_ID}</td>
                    <td>${item.Gate_ID}</td>
                </tr>`;
        });

        table += '</tbody></table>';
        resultContainer.html(table);
    } else {
        resultContainer.html('<h6>Tidak ada data yang ditemukan.</h6>');
    }
}

function setupPagination(totalItems, currentPage) {
    const paginationContainer = $("#pagination-container");
    paginationContainer.empty(); // Kosongkan pagination sebelumnya

    const totalPages = Math.ceil(totalItems / 50); // Asumsi 50 item per halaman
    let paginationHtml = '<nav><ul class="pagination">';

    // Previous button
    if (currentPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="fetchData(${currentPage - 1})">Previous</a></li>`;
    }

    // Informasi halaman saat ini
    paginationHtml += `<li class="page-item disabled"><a class="page-link" href="#">Halaman ${currentPage} dari ${totalPages}</a></li>`;

    // Next button
    if (currentPage < totalPages) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="fetchData(${currentPage + 1})">Next</a></li>`;
    }

    paginationHtml += '</ul></nav>';
    paginationContainer.html(paginationHtml);
}

// Event listener untuk tombol cari
$("#search-button").on("click", function() {
    const searchValue = $("#search-input").val().trim();
    const filter = searchValue ? `Delivery_Note_No = "${searchValue}"` : ''; // Filter pencarian
    fetchData(1, filter); // Panggil fetchData dengan filter
});

$("#reset-button").on("click", function() {
    $("#search-input").val(''); // Kosongkan input
    fetchData(1, ''); // Panggil fetchData tanpa filter
});

// Memanggil fungsi fetchData untuk halaman pertama saat halaman dimuat
$(document).ready(() => {
    fetchData(1);
});