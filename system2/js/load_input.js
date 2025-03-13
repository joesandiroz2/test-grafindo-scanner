let currentLoadPage = 1; // Ganti nama variabel untuk halaman saat ini
const itemsPerPageLoad = 50; // Ganti nama variabel untuk jumlah item per halaman



async function loadInputData(page = 1) {
    // Tampilkan loading spinner
    document.getElementById('loadinput').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    const userGrafindo = localStorage.getItem('operator_label');
    try {

        // Mengambil data dari API dengan pagination
          let url = `${pocketbaseUrl}/api/collections/system2_scan_input/records?page=${page}&perPage=${itemsPerPageLoad}`;

        // Tambahkan filter jika user bukan "sopian@gmail.com"
        if (userGrafindo !== "sopian@gmail.com") {
            url += `&filter=operator%20%3D%20%27${encodeURIComponent(userGrafindo)}%27`;
        }
        const response = await fetch(url);
        
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
                    <th>OP</th>
                    <th>Merk</th>
                    <th>Part Number</th>
                    <th>Nama Barang</th>
                    <th>qty</th>
                    <th>Bikin Berapa Label</th>
                    <th>Lot</th>
                    <th>Depo</th>
                    <th>Suplier</th>
                    <th>tgl Inspeksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    const currentOperator = localStorage.getItem('operator_label'); // Get the current operator from localStorage

    items.forEach(item => {
         const showEditDeleteButtons = item.operator === currentOperator;

        tableHTML += `
            <tr>
                 <td>
            <button class="btn btn-warning" onclick="openPrintModal('${item.merk}', '${item.part_number}', '${item.nama_barang}', '${item.qty}', '${item.satuan}', '${item.lot}', '${item.depo}', '${item.supplier_id}', '${new Date(item.tgl_inspeksi).toLocaleDateString()}')">Cetak</button>
            ${showEditDeleteButtons ? `
                <button class="btn btn-danger" onclick="openDeleteModal('${item.id}')">Hapus</button>
                <button class="btn btn-success" onclick="openEditModal('${item.id}', '${item.merk}', '${item.part_number}', '${item.nama_barang}', '${item.qty}', '${item.satuan}','${item.depo}')">Edit</button>
            ` : ''}
                </td>
                <td>${item.operator}</td>
                <td style="font-weight:bold">${item.merk}</td>
                <td style="font-weight:bold">${item.part_number}</td>
                <td>${item.nama_barang}</td>
                <td>${item.qty}</td>
                <td>${item.satuan}</td>
                <td>${item.lot}</td>
                <td>${item.depo}</td>
                <td>${item.supplier_id}</td>
                <td>${new Date(item.tgl_inspeksi).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</td>

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
        modalBody.innerHTML = `
            <div style="background-color:white;height:14px;color:white"></div>
            <div class="row"  id="labelContainer"></div>`;

        const labelContainer = document.getElementById('labelContainer');

        // Menentukan supplierId berdasarkan merk
        let supplierId;
        if (merk.toLowerCase() === 'yamaha') {
            supplierId = '7603';
        } else if (merk.toLowerCase() === 'honda') {
            supplierId = '1201591';
        } else {
            supplierId = ''; // Atau nilai default jika merk tidak dikenali
        }
        
        // Menentukan nama penerima berdasarkan merk
        const penerima = (merk.toLowerCase() === 'yamaha') 
            ? 'PT YAMAHA INDONESIA' 
            : (merk.toLowerCase() === 'honda' ? 'PT ASTRA HONDA MOTOR' : ''); // Tambahkan kondisi lain jika perlu


        for (let i = 0; i < satuan; i++) {
            // Menentukan format QR Code berdasarkan merk
            let qrData = (merk.toLowerCase() === 'yamaha') 
                ? `${partNumber}|${supplierId}|${qty}`
                : `${partNumber}|${supplierId}|${qty}|${lot}`;

            tglInspeksi = new Date(tglInspeksi).toLocaleDateString('id-ID', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            }).toUpperCase();


            let labelHTML = `
            <div  style="color:black;padding: 3px  20px; width: calc(33.33% - 10px);">
                <div class="label" style="width:340px;border-radius:10px; border: 1px solid black;position: relative;margin-bottom:30px;margin-left:20px">
                    <p style="font-size:10px;padding:0px;border-bottom:1px solid black;margin:0px;text-align:center; display:block;">PT. GRAFINDO MITRASEMESTA</p>
                     <p class="no-margin" style="font-size:12px;text-decoration:underline; display: block; width: 100%; margin: 1px 0; line-height: 1;">Part Name &nbsp;:&nbsp;${namaBarang}</p>
                    <div style="line-height:0.5;display:flex;justify-content:space-between">
                        <div style="line-height:0.2;margin-top:0px">
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Part Number &nbsp;: &nbsp;${partNumber}</p>
                            <p class="no-margin" style="font-size:10px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Penerima: &nbsp;${penerima}</p>
                            
                           <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">No Lot : &nbsp;&nbsp;${lot}</p>
                            <span class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Qty : &nbsp;&nbsp;&nbsp;&nbsp;${qty} Pcs  &nbsp;&nbsp;&nbsp;<span style="border:1px solid black;font-weight:bold;padding:0.5px;">OK</span> &nbsp;&nbsp;&nbsp;<span > NG</span></span>
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Tgl Packing: &nbsp;&nbsp;${tglInspeksi}</p>
                        <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Opr Packing: &nbsp;&nbsp;${depo}</p>
                            
                        </div>
                        <div style="text-align: right;padding-top:3px;padding-left:3px;padding-bottom:10px;padding-right:10px">
                            <div id="qrcode-${i}"></div>
                        </div>
                    </div>
                </div>
            </div>
            `;

            labelContainer.innerHTML += labelHTML;

            // Menunggu elemen dibuat, lalu generate QR Code
            setTimeout(() => {
                new QRCode(document.getElementById(`qrcode-${i}`), {
                    text: qrData,
                    width: 85,
                    height: 85,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.L 
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
function openEditModal(id, merk, partNumber, namaBarang, qty, satuan,depo) {
    document.getElementById('editId').value = id;
    document.getElementById('editMerk').value = merk;
    document.getElementById('editPartNumber').value = partNumber;
    document.getElementById('editNamaBarang').value = namaBarang;
    document.getElementById('editQty').value = qty;
    document.getElementById('editSatuan').value = satuan; // Tambahkan ini
    document.getElementById('editDepo').value = depo; // Tambahkan ini

    $('#editModal').modal('show');
}


// Simpan Perubahan Data
async function saveEdit() {
    const id = document.getElementById('editId').value;
    let merk = document.getElementById('editMerk').value;
    
    // Menentukan supplierId berdasarkan merk
    let supplierId;
    if (merk.toLowerCase() === 'yamaha') {
        supplierId = '7603';
    } else if (merk.toLowerCase() === 'honda') {
        supplierId = '1201591';
    } else {
        supplierId = ''; // Atau nilai default jika merk tidak dikenal
    }

    const updatedData = {
        merk: merk,
        part_number: document.getElementById('editPartNumber').value,
        nama_barang: document.getElementById('editNamaBarang').value,
        qty: document.getElementById('editQty').value,
        satuan:document.getElementById('editSatuan').value,
        depo:document.getElementById('editDepo').value,
        supplier_id:supplierId
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
            Swal.fire({
                icon:"success",
                title:"Berhasil Update ",
                timer:1200
            })
        } else {
           Swal.fire({
                icon:"error",
                title:"Gagal Update ada yg error ",
                timer:1200
            })
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
