let currentLoadPage = 1; // Ganti nama variabel untuk halaman saat ini
const itemsPerPageLoad = 50; // Ganti nama variabel untuk jumlah item per halaman



async function loadInputData(page = 1) {
    // Tampilkan loading spinner
    document.getElementById('loadinput').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    const userGrafindo = localStorage.getItem('operator_label');
    try {

        // Mengambil data dari API dengan pagination
          let url = `${pocketbaseUrl}/api/collections/system2_scan_input/records?page=${page}&perPage=${itemsPerPageLoad}&sort=-created`;

        // Tambahkan filter jika user bukan "sopian@gmail.com"
        // if (userGrafindo !== "sopian@gmail.com") {
        //     url += `&filter=operator%20%3D%20%27${encodeURIComponent(userGrafindo)}%27`;
        // }
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




let selectedItems = {};

function displayDataInTable(items) {
    let tableHTML = `
        <table class="table table-bordered table-responsive">
            <thead>
                <tr>
              <th>
                Pilih 
                <button class="btn btn-primary btn-sm" onclick="printSelectedItems()">Cetak</button>
            </th>
                    <th>Aksi</th>
                    <th>OP</th>
                    <th>Merk</th>
                    <th>Part Number</th>
                    <th>Nama Barang</th>
                    <th>qty</th>
                    <th>Bikin Berapa Label</th>
                    <th>Cetak Berapa Lembar</th>
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
       <input type="checkbox" class="item-checkbox" 
            data-id="${item.id}" 
            data-merk="${item.merk}" 
            data-part_number="${item.part_number}" 
            data-nama_barang="${item.nama_barang}" 
            data-qty="${item.qty}" 
            data-satuan="${item.satuan}" 
            data-berapa_lembar="${item.berapa_lembar}" 
            data-lot="${item.lot}" 
            data-depo="${item.depo}" 
            data-supplier_id="${item.supplier_id}" 
            data-tgl_inspeksi="${item.tgl_inspeksi}"
        />
        </td>
                 <td>
            <button class="btn btn-warning" onclick="openPrintModal('${item.merk}', '${item.part_number}', '${item.nama_barang}', '${item.qty}', '${item.satuan}', '${item.berapa_lembar}','${item.lot}', '${item.depo}', '${item.supplier_id}', '${item.tgl_inspeksi}')">Cetak</button>
            ${showEditDeleteButtons ? `
                <button class="btn btn-danger" onclick="openDeleteModal('${item.id}')">Hapus</button>
                <button class="btn btn-success" onclick="openEditModal('${item.id}', '${item.merk}', '${item.part_number}', '${item.nama_barang}', '${item.qty}', '${item.satuan}','${item.berapa_lembar}','${item.depo}','${item.tgl_inspeksi}','${item.lot}')">Edit</button>
            ` : ''}
                </td>
                <td>${item.operator}</td>
                <td style="font-weight:bold">${item.merk}</td>
                <td style="font-weight:bold">${item.part_number}</td>
                <td>${item.nama_barang}</td>
                <td>${item.qty}</td>
                <td>${item.satuan}</td>
                <td>${item.berapa_lembar}</td>
                <td>${item.lot}</td>
                <td>${item.depo}</td>
                <td>${item.supplier_id}</td>
                <td>${item.tgl_inspeksi}</td>

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


document.addEventListener('change', function(event) {
    if (event.target.classList.contains('item-checkbox')) {
        const checkbox = event.target;
        const itemId = checkbox.dataset.id;

        if (checkbox.checked) {
            selectedItems[itemId] = {
                merk: checkbox.dataset.merk,
                partNumber: checkbox.dataset.part_number,
                namaBarang: checkbox.dataset.nama_barang,
                qty: checkbox.dataset.qty,
                satuan: parseInt(checkbox.dataset.satuan) || 0,
                berapa_lembar: checkbox.dataset.berapa_lembar,
                lot: checkbox.dataset.lot,
                depo: checkbox.dataset.depo,
                supplierId: checkbox.dataset.supplier_id,
                tglInspeksi: checkbox.dataset.tgl_inspeksi
            };
        } else {
            delete selectedItems[itemId]; // Hapus jika tidak dicentang
        }

        // Hitung total satuan dari semua item yang dipilih
        let totalSatuan = Object.values(selectedItems).reduce((sum, item) => sum + item.satuan, 0);

        if (totalSatuan > 18) {
            Swal.fire({
                icon: 'error',
                title: 'Total cuman 18 label yg bagus untuk di cetak ',
                text: 'Total label maksimal hanya 18 yang bisa dipilih.',
            });

            // Batalkan centang terakhir
            checkbox.checked = false;
            delete selectedItems[itemId];
        }
    }
});

function printSelectedItems() {
    if (Object.keys(selectedItems).length === 0) {
        Swal.fire({
            title:"Centang dulu label yg mau di cetak",
            icon:"warning"
        })
        return;
    }

    // Bersihkan modal sebelum menampilkan data baru
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '';

    for (const itemId in selectedItems) {
        const item = selectedItems[itemId];

        openBarenganPrint(
            item.merk,
            item.partNumber,
            item.namaBarang,
            parseInt(item.qty),  
            parseInt(item.satuan), 
            parseInt(item.berapa_lembar),  
            item.lot,
            item.depo,
            item.supplierId,
            item.tglInspeksi
        );
    }

    // Tampilkan modal setelah semua data dimasukkan
    $('#printModal').modal('show');
}

function openBarenganPrint(merk, partNumber, namaBarang, qty, satuan, berapa_lembar, lot, depo, supplierId, tglInspeksi) {
    const modalBody = document.getElementById('modalBody');
    const formattedPartNumber = partNumber.replace(/\s+/g, '').toUpperCase();
    
    if (modalBody) {
        let supplierId = (merk.toLowerCase() === 'yamaha') ? '7603' : (merk.toLowerCase() === 'honda') ? '1201591' : '';
        let penerima = (merk.toLowerCase() === 'yamaha') ? 'PT YAMAHA INDONESIA' : (merk.toLowerCase() === 'honda') ? 'PT ASTRA HONDA MOTOR' : '';

        let jumlahLabelPerLembar = parseInt(satuan); // Jumlah label tergantung satuan

        // **Perbaikan: Hapus `page-break-after: always;` agar tetap dalam satu lembar**
        let lembarHTML = '';
        if (document.getElementById('modalBody').children.length === 0) {
            lembarHTML += `<div style="height:28px;"></div>`; 
        }

        // **Loop berdasarkan jumlah label tanpa memisahkan lembar**
        for (let i = 0; i < jumlahLabelPerLembar; i++) {
            let qrData = (merk.toLowerCase() === 'yamaha') 
                ? `${partNumber}|${supplierId}|${qty}|${lot}` 
                : `${partNumber}|${supplierId}|${qty}|${lot}`;
                let qrId = `qrcode-${partNumber.replace(/\s+/g, '')}-${lot}-${qty}-${i}`;
            
        lembarHTML += `
            <div  style="color:black;padding: 3px  6px; width: calc(33.33% - 20px);display:inline-block">
            <div class="label" style=" page-break-inside: avoid; width:310px;border-radius:10px; border: 1px solid black;position: relative;margin-bottom:30px;margin-left:40px">
                    <p style="font-size:10px;padding:0px;border-bottom:1px solid black;margin:0px;text-align:center; display:block;">PT. GRAFINDO MITRASEMESTA</p>
                    <p class="no-margin" style="font-size:12px;text-decoration:underline; display: block; width: 100%; margin: 1px 0; line-height: 1;">Part Name &nbsp;&nbsp;&nbsp;:&nbsp;${namaBarang}</p>
                    <div style="line-height:0.5;display:flex;justify-content:space-between">
                        <div style="line-height:0.2;margin-top:0px">
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Part Number  &nbsp;:&nbsp;${formattedPartNumber}</p>
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Penerima &nbsp;&nbsp;&nbsp;: &nbsp;${penerima}</p>
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">No Lot &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;${lot}</p>
                            <span class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">
                                Qty &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${qty} Pcs  
                                &nbsp;&nbsp;<span style="border:1px solid black;font-weight:bold;padding:0.5px;">OK</span> &nbsp;&nbsp;&nbsp;<span > NG</span>
                            </span>
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Tgl Packing &nbsp;&nbsp;:&nbsp;&nbsp;${tglInspeksi}</p>
                            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Opr Packing &nbsp;:&nbsp;${depo}</p>
                        </div>
                   <div style="text-align: center;padding-top:3px;padding-left:3px;padding-bottom:3px;padding-right:3px">
                            <div id="${qrId}"></div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        lembarHTML += `</div>`; // **Tutup div container agar semua dalam satu lembar**
        modalBody.innerHTML += lembarHTML;

        // **Generate QR Code setelah HTML selesai dibuat**
        setTimeout(() => {
            for (let i = 0; i < jumlahLabelPerLembar; i++) {
                let qrId = `qrcode-${partNumber.replace(/\s+/g, '')}-${lot}-${qty}-${i}`;

                let qrElement = document.getElementById(qrId);

                if (qrElement) {
                    let qrText = (merk.toLowerCase() === 'yamaha') 
                        ? `${partNumber}|${supplierId}|${qty}|${lot}`
                        : `${partNumber}|${supplierId}|${qty}|${lot}`;

                    new QRCode(qrElement, {
                        text: qrText,
                        width: 70,
                        height: 70,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.L 
                    });
                } else {
                    console.error("QR Code container not found:", qrId);
                }
            }
        }, 100);
    } else {
        console.error('Modal body not found');
    }
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

function openPrintModal(merk, partNumber, namaBarang, qty, satuan, berapa_lembar, lot, depo, supplierId, tglInspeksi) {
    const modalBody = document.getElementById('modalBody');
    const formattedPartNumber = partNumber.replace(/\s+/g, '').toUpperCase();

    if (modalBody) {
        modalBody.innerHTML = `
            <div id="lembarContainer"></div>`;

        const lembarContainer = document.getElementById('lembarContainer');

        // Menentukan supplierId berdasarkan merk
        let supplierId;
        if (merk.toLowerCase() === 'yamaha') {
            supplierId = '7603';
        } else if (merk.toLowerCase() === 'honda') {
            supplierId = '1201591';
        } else {
            supplierId = '';
        }

        // Menentukan penerima berdasarkan merk
        const penerima = (merk.toLowerCase() === 'yamaha') 
            ? 'PT YAMAHA INDONESIA' 
            : (merk.toLowerCase() === 'honda' ? 'PT ASTRA HONDA MOTOR' : '');

        // Loop untuk jumlah lembar
    for (let l = 0; l < berapa_lembar; l++) {
        let lembarHTML = `<div class="lembar" style="margin-top:28px;page-break-after: always;">`;
        
            // Loop untuk jumlah label per lembar
            for (let i = 0; i < satuan; i++) {
                let qrData = (merk.toLowerCase() === 'yamaha') 
                    ? `${partNumber}|${supplierId}|${qty}|${lot}`
                    : `${partNumber}|${supplierId}|${qty}|${lot}`;

lembarHTML += `
<div  style="color:black;padding: 3px  6px; width: calc(33.33% - 20px);display:inline-block">
    <div class="label" style=" page-break-inside: avoid; width:310px;border-radius:10px; border: 1px solid black;position: relative;margin-bottom:30px;margin-left:40px">
        <p style="font-size:10px;padding:0px;border-bottom:1px solid black;margin:0px;text-align:center; display:block;">PT. GRAFINDO MITRASEMESTA</p>
         <p class="no-margin" style="font-size:12px;text-decoration:underline; display: block; width: 100%; margin: 1px 0; line-height: 1;">Part Name &nbsp;&nbsp;&nbsp;:&nbsp;${namaBarang}</p>
        <div style="line-height:0.5;display:flex;justify-content:space-between">
            <div style="line-height:0.2;margin-top:0px">
                <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Part Number  &nbsp;:&nbsp;${formattedPartNumber}</p>
                <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Penerima &nbsp;&nbsp;: &nbsp;${penerima}</p>
                
               <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">No Lot &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: &nbsp;${lot}</p>
                <span class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Qty &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;${qty} Pcs  &nbsp;&nbsp;<span style="border:1px solid black;font-weight:bold;padding:0.5px;">OK</span> &nbsp;&nbsp;&nbsp;<span > NG</span></span>
                <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Tgl Packing &nbsp;&nbsp;:&nbsp;&nbsp;${tglInspeksi}</p>
            <p class="no-margin" style="font-size:12px;border-bottom: 1px solid black; display: block; width: 100%; margin: 2px 0; line-height: 1;">Opr Packing &nbsp;:&nbsp;${depo}</p>
                
            </div>
            <div style="text-align: center;padding-top:3px;padding-left:3px;padding-bottom:3px;padding-right:3px">
                 <div id="qrcode-${l}-${i}"></div>
            </div>
        </div>
    </div>
</div>
`;
            }

            lembarHTML += `</div>`; // Tutup div lembar
            lembarContainer.innerHTML += lembarHTML;
        }

        // Generate QR Code untuk setiap label
        setTimeout(() => {
            for (let l = 0; l < berapa_lembar; l++) {
                for (let i = 0; i < satuan; i++) {
                    new QRCode(document.getElementById(`qrcode-${l}-${i}`), {
                        text: (merk.toLowerCase() === 'yamaha') 
                            ? `${partNumber}|${supplierId}|${qty}|${lot}`
                            : `${partNumber}|${supplierId}|${qty}|${lot}`,
                        width: 70,
                        height: 70,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.L 
                    });
                }
            }
        }, 100);

        // Menampilkan modal
        $('#printModal').modal('show');
    } else {
        console.error('Modal body not found');
    }
}



// Buka Modal Edit
function openEditModal(id, merk, partNumber, namaBarang, qty, satuan,berapa_lembar,depo,tglInspeksi,lot) {
    document.getElementById('editId').value = id;
    document.getElementById('editMerk').value = merk;
    document.getElementById('editPartNumber').value = partNumber;
    document.getElementById('editNamaBarang').value = namaBarang;
    document.getElementById('editQty').value = qty;
    document.getElementById('editSatuan').value = satuan; // Tambahkan ini
    document.getElementById('editBerapaLembar').value = berapa_lembar; // Tambahkan ini
    document.getElementById('editDepo').value = depo; // Tambahkan ini
    document.getElementById('editTglInspeksi').value = tglInspeksi; // Tambahkan ini
    document.getElementById('editLot').value = lot; // Tambahkan ini

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
        berapa_lembar:document.getElementById('editBerapaLembar').value,
        depo:document.getElementById('editDepo').value,
        tgl_inspeksi:document.getElementById('editTglInspeksi').value,
        lot:document.getElementById('editLot').value,
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
