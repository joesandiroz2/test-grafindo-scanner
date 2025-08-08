
const pb = new PocketBase(pocketbaseUrl);

async function fetchData(page = 1,filter = '') {
    try {
        $("#loading-indicator").show();
        

        // Autentikasi
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

        // Ambil data dari koleksi data_do
        const resultList = await pb.collection('data_do').getList(page, 50, {
            sort: '-created', // Mengurutkan berdasarkan tanggal terbaru
            filter: filter, // Ganti dengan filter yang sesuai
        });

        // Hapus loading indicator
        $("#loading-indicator").hide();

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
                        <th>Aksi</th>
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
                   <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${item.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Hapus</button>
                    </td>
                </tr>`;
        });

        table += '</tbody></table>';
        resultContainer.html(table);

        // Event tombol Edit
        $(".edit-btn").on("click", async function () {
            const id = $(this).data("id");
            const item = items.find(x => x.id === id);

            const { value: formValues } = await Swal.fire({
                title: 'Edit Data',
                html: `
                    <div style="text-align:left">
                        <label>Delivery Note No:</label>
                        <input id="dn_no" value="${item.Delivery_Note_No}"><br/>
                        
                        <label>Supplier Part Number:</label>
                        <input id="supplier_part" value="${item.Supplier_Part_Number}"><br/>
                        
                        <label>Nama Barang:</label>
                        <input id="part_desc" value="${item.Part_Number_Desc}"><br/>
                        
                        <label>Qty DN:</label>
                        <input id="qty_dn" value="${item.Qty_DN}"><br/>
                        
                        <label>Delivery Note Date:</label>
                        <input id="dn_date" value="${item.Delivery_Note_Date}"><br/>
                        
                        <label>PO Number:</label>
                        <input id="po_number" value="${item.PO_Number}"><br/>
                        
                        <label>Plant ID:</label>
                        <input id="plant_id" value="${item.Plant_ID}"><br/>
                        
                        <label>Gate ID:</label>
                        <input id="gate_id" value="${item.Gate_ID}"><br/>
                    </div>
                `,
                focusConfirm: false,
                preConfirm: () => {
                    return {
                        Delivery_Note_No: document.getElementById('dn_no').value,
                        Supplier_Part_Number: document.getElementById('supplier_part').value,
                        Part_Number_Desc: document.getElementById('part_desc').value,
                        Qty_DN: document.getElementById('qty_dn').value,
                        Delivery_Note_Date: document.getElementById('dn_date').value,
                        PO_Number: document.getElementById('po_number').value,
                        Plant_ID: document.getElementById('plant_id').value,
                        Gate_ID: document.getElementById('gate_id').value
                    };
                }
            });

            if (formValues) {
                try {
                    await pb.collection('data_do').update(id, formValues);
                    Swal.fire('Berhasil', 'Data berhasil diupdate', 'success');
                    fetchData(1); // refresh
                } catch (err) {
                    Swal.fire('Gagal', 'Gagal mengupdate data', 'error');
                }
            }
        });




           // Event tombol Hapus
        $(".delete-btn").on("click", function () {
            const id = $(this).data("id");
            Swal.fire({
                title: 'Yakin hapus?',
                text: "Data yang dihapus tidak bisa dikembalikan!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, hapus',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await pb.collection('data_do').delete(id);
                        Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                        fetchData(1); // refresh
                    } catch (err) {
                        Swal.fire('Gagal', 'Gagal menghapus data', 'error');
                    }
                }
            });
        });
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
 const searchValue = $("#search-input").val().replace(/\s+/g, '').toUpperCase();
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