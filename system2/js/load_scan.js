// Variabel untuk menyimpan data
let currentPage = 1;
let totalItems = 0;

// Fungsi untuk memuat data barang
async function loadData(page) {
    // Tampilkan loading spinner
    document.getElementById('databarang').innerHTML = '<p>Loading data barang...</p>';

    try {
        // Ambil data dari API
        const response = await fetch(`${pocketbaseUrl}/api/collections/system2_barang_data/records?page=${page}&perPage=50`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const resultList = await response.json();

        // Ambil total item
        totalItems = resultList.totalItems;

        // Tampilkan data di tabel
        displayData(resultList.items);
        // Tampilkan pagination
        displayPagination(page);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('databarang').innerHTML = '<p>Error loading data.</p>';
    }
}

// Fungsi untuk menampilkan data di tabel
function displayData(items) {
    let tableHTML = `
        <table class="table table-responsive">
            <thead>
                <tr>
                    <th>Nomor Barang</th>
                    <th>Nama Barang</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        tableHTML += `
            <tr>
                <td style="font-weight:bold">${item.nomor_barang}</td>
                <td>${item.nama_barang}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    document.getElementById('databarang').innerHTML = tableHTML;
}

// Fungsi untuk menampilkan pagination
function displayPagination(page) {
    const totalPages = Math.ceil(totalItems / 50);
    let paginationHTML = `<nav aria-label="Page navigation"><ul class="pagination">`;

    // Previous button
    if (page > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadData(${page - 1})">Previous</a></li>`;
    } else {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">Previous</span></li>`;
    }

    // Next button
    if (page < totalPages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadData(${page + 1})">Next</a></li>`;
    } else {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">Next</span></li>`;
    }

    paginationHTML += `</ul></nav>`;
    paginationHTML += `<p>Halaman ${page} dari ${totalPages} | Total Barang: ${totalItems}</p>`;

    document.getElementById('pagination').innerHTML = paginationHTML;
}

// Memuat data saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadData(currentPage);
});


document.getElementById('searchButton').addEventListener('click', async () => {
    const partNumber = document.getElementById('searchInput').value
        .replace(/\s+/g, '') // Menghilangkan semua spasi
        .toUpperCase(); // Mengubah semua huruf menjadi huruf besar

    if (!partNumber) {
        Swal.fire({
            icon: 'warning',
            title: 'Input Kosong!',
            text: 'Silakan masukkan part number.',
        });
        return;
    }

    try {
        document.getElementById('databarang').innerHTML = '<p>Loading...</p>';
        
        const response = await fetch(`${pocketbaseUrl}/api/collections/system2_barang_data/records?filter=(nomor_barang~"${partNumber}")`);
        
        if (!response.ok) {
            throw new Error('Gagal mengambil data.');
        }

        const result = await response.json();

        if (result.items.length === 0) {
            document.getElementById('databarang').innerHTML = '<p>Data tidak ditemukan.</p>';
            return;
        }

        displayData(result.items);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('databarang').innerHTML = '<p>Error loading data.</p>';
    }
});

document.getElementById('tambahBarangForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const data = {
        nomor_barang: document.getElementById('nomorBarang').value
            .replace(/\s+/g, '') // Menghilangkan semua spasi
            .toUpperCase(), // Mengubah semua huruf menjadi huruf besar
        nama_barang: document.getElementById('namaBarang').value
    };

    try {
        const response = await fetch( pocketbaseUrl + '/api/collections/system2_barang_data/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        Swal.fire({
            icon: 'success',
            title: 'Berhasil Ditambahkan !',
            text: 'Barang berhasil ditambahkan!',
            timer: 2000,
            showConfirmButton: false
        });

        // Tutup modal
        $('#tambahBarangModal').modal('hide');

        // Kosongkan input setelah menyimpan
        document.getElementById('tambahBarangForm').reset();

    } catch (error) {
        console.error('Gagal menambahkan data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Terjadi kesalahan saat menyimpan data!',
        });
    }
});
