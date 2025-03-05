let currentLoadPage = 1; // Ganti nama variabel untuk halaman saat ini
const itemsPerPageLoad = 50; // Ganti nama variabel untuk jumlah item per halaman

async function loadInputData(page = 1) {
    // Tampilkan loading spinner
    document.getElementById('loadinput').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    try {
        // Mengambil data dari API dengan pagination
        const response = await fetch(`${pocketbaseUrl}/api/collections/system2_scan_input/records?page=${page}&perPage=${itemsPerPageLoad}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        const items = result.items;
        const totalItems = result.totalItems; // Total items untuk pagination

        // Mengurutkan data berdasarkan tanggal dibuat (created) terbaru di atas
        items.sort((a, b) => new Date(b.created) - new Date(a.created));

        // Menampilkan data dalam tabel
        displayDataInTable(items);
        // Menampilkan pagination
        displayPagination(totalItems, page);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('loadinput').innerHTML = '<p>Error loading data.</p>';
    }
}

function displayDataInTable(items) {
    let tableHTML = `
        <table class="table table-bordered table-responsive">
            <thead>
                <tr>
                    <th>Aksi</th>
                    <th>Merk</th>
                    <th>Part Number</th>
                    <th>Nama Barang</th>
                    <th>Quantity</th>
                    <th>Satuan</th>
                    <th>Lot</th>
                    <th>Depo</th>
                    <th>Supplier ID</th>
                    <th>Tanggal Inspeksi</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        tableHTML += `
            <tr>
                <td>
                    <button class="btn btn-warning" onclick="openPrintModal('${item.merk}', '${item.part_number}', '${item.nama_barang}', '${item.qty}', '${item.satuan}', '${item.lot}', '${item.depo}', '${item.supplier_id}', '${new Date(item.tgl_inspeksi).toLocaleDateString()}')">Cetak</button>
                    <button class="btn btn-danger" onclick="openDeleteModal('${item.id}')">Hapus</button>
                    <button class="btn btn-success" onclick="openEditModal('${item.id}', '${item.merk}', '${item.part_number}', '${item.nama_barang}', '${item.qty}', '${item.satuan}')">Edit</button>

                </td>
                <td>${item.merk}</td>
                <td>${item.part_number}</td>
                <td>${item.nama_barang}</td>
                <td>${item.qty}</td>
                <td>${item.satuan}</td>
                <td>${item.lot}</td>
                <td>${item.depo}</td>
                <td>${item.supplier_id}</td>
                <td>${new Date(item.tgl_inspeksi).toLocaleDateString()}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    // Update elemen loadinput dengan tabel
    document.getElementById('loadinput').innerHTML = tableHTML;
}

function displayPagination(totalItems, currentLoadPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPageLoad);
    let paginationHTML = `<nav aria-label="Page navigation"><ul class="pagination">`;

    // Previous button
    if (currentLoadPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadInputData(${currentLoadPage - 1})">Previous</a></li>`;
    } else {
        paginationHTML += `<li class="page-item disabled"><span class="page-link ">Previous</span></li>`;
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentLoadPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadInputData(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    if (currentLoadPage < totalPages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadInputData(${currentLoadPage + 1})">Next</a></li>`;
    } else {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">Next</span></li>`;
    }

    paginationHTML += `</ul></nav>`;
    paginationHTML += `<p>Halaman ${currentLoadPage} dari ${totalPages} | Total Items: ${totalItems}</p>`;

    // Update elemen loadinput dengan pagination
    document.getElementById('loadinput').innerHTML += paginationHTML;
}

// Memanggil fungsi untuk memuat data saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => loadInputData(currentLoadPage));

function openPrintModal(merk, partNumber, namaBarang, qty, satuan, lot, depo, supplierId, tglInspeksi) {
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
        // Mengisi modal untuk menampilkan detail
        modalBody.innerHTML = `<div class="row" id="labelContainer"></div>`;

        const labelContainer = document.getElementById('labelContainer');

        for (let i = 0; i < satuan; i++) {
            // Menentukan format QR Code berdasarkan merk
            let qrData = (merk.toLowerCase() === 'yamaha') 
                ? `${partNumber}|${supplierId}|${qty}`
                : `${partNumber}|${supplierId}|${qty}|${lot}`;

            tglInspeksi = new Date(tglInspeksi).toLocaleDateString('id-ID', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            }).toUpperCase();


            let labelHTML = `
            <div class="col-sm-12 col-md-4 col-lg-4">
                <div class="label" style="border-radius:10px; border: 2px solid black; margin: 5px; padding: 10px; position: relative;">
                    <span style="font-weight:bold;text-align:center; display:block;">PT. GRAFINDO MITRASEMESTA</span>
                    <hr style="border:1px solid black; margin-top:0px;"/>
                    <div style="display:flex;justify-content:space-between">
                        <div>
                            <p style="border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Nama Part: <b>${namaBarang}</b></p>
                            <p style="border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">No Part: <b>${partNumber}</b></p>
                            <p style="border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Lot Produksi : <b>${lot}</b></p>
                            <p style="border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Quantity : <b>${qty}</b></p>
                            <p style="border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Tanggal Packing: <b>${tglInspeksi}</b></p>
                        </div>
                        <div style="text-align: right;">
                            <div id="qrcode-${i}"></div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <p style="border-bottom: 1px solid black; flex-grow: 1; margin-right: 10px; padding-bottom: 2px;">Inspector: <b>${depo}</b></p>
                        <p style="padding: 2px;">Status part: <b style="border: 1px solid black;">OK</b></p>
                    </div>
                </div>
            </div>
            `;

            labelContainer.innerHTML += labelHTML;

            // Menunggu elemen dibuat, lalu generate QR Code
            setTimeout(() => {
                new QRCode(document.getElementById(`qrcode-${i}`), {
                    text: qrData,
                    width: 80,
                    height: 80
                });
            }, 100);
        }

        // Menampilkan modal
        $('#printModal').modal('show');
    } else {
        console.error('Modal body not found');
    }
}


// Buka Modal Edit
function openEditModal(id, merk, partNumber, namaBarang, qty, satuan) {
    document.getElementById('editId').value = id;
    document.getElementById('editMerk').value = merk;
    document.getElementById('editPartNumber').value = partNumber;
    document.getElementById('editNamaBarang').value = namaBarang;
    document.getElementById('editQty').value = qty;
    document.getElementById('editSatuan').value = satuan; // Tambahkan ini

    $('#editModal').modal('show');
}


// Simpan Perubahan Data
async function saveEdit() {
    const id = document.getElementById('editId').value;
    const updatedData = {
        merk: document.getElementById('editMerk').value,
        part_number: document.getElementById('editPartNumber').value,
        nama_barang: document.getElementById('editNamaBarang').value,
        qty: document.getElementById('editQty').value,
        satuan:document.getElementById('editSatuan').value,
    };

    try {
        const response = await fetch(`${pocketbaseUrl}/api/collections/system2_scan_input/records/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        if (response.ok) {
            $('#editModal').modal('hide');
            loadInputData(currentLoadPage);
            alert('Data berhasil diperbarui!');
        } else {
            alert('Gagal memperbarui data!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memperbarui data.');
    }
}

// Buka Modal Konfirmasi Hapus
function openDeleteModal(id) {
    document.getElementById('deleteId').value = id;
    $('#deleteModal').modal('show');
}

// Hapus Data
async function deleteData() {
    const id = document.getElementById('deleteId').value;

    try {
        const response = await fetch(`${pocketbaseUrl}/api/collections/system2_scan_input/records/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            $('#deleteModal').modal('hide');
            loadInputData(currentLoadPage);
            alert('Data berhasil dihapus!');
        } else {
            alert('Gagal menghapus data!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menghapus data.');
    }
}