import { searchKartuStok } from './keluar_stok/check_kartu_stok.js';
import { ScanOutStok } from './keluar_stok/scan_out_stok.js';

const pb = new PocketBase(pocketbaseUrl);
let globalRecords = []; // Variabel global untuk menyimpan data dari data_do
let inputValue

$(document).ready(function() {
$("#navbar-container").load("./component/nav.html");

let timeout;
$("#do-input").on("input", function() {
    clearTimeout(timeout);
    const bersih_input = $(this).val().trim();
    
    // Menghapus spasi dan mengubah input menjadi huruf besar
    inputValue = bersih_input.toUpperCase().replace(/\s+/g, '');

    if (inputValue) {
        timeout = setTimeout(async function() {
     const parts = inputValue.split('|');

     // Validasi baru
        if (inputValue.includes('|')) {

            if (parts.length < 4 ) {
                errorScan("Format harus di atas 4 blok minimal : part|supplier|qty|lot");
                return;
            }

            const partNumber = parts[0];
            const supplierId = parts[1];
            const qty = parts[2];
            const lot = parts.slice(3).join('|'); 
            // supaya kalau lot ada "|" tambahan tetap digabung

            // Validasi partnumber (huruf, angka, strip)
            if (!/^[A-Z0-9-]+$/.test(partNumber)) {
                errorScan("Partnumber tidak valid");
                return;
            }

            // Validasi qty harus angka
            if (!/^\d+$/.test(qty)) {
                errorScan("Qty harus angka");
                return;
            }

        }

    

         // Mengatur src audio dari JavaScript
            const audioSource = document.getElementById('audio-source');
            audioSource.src = './suara/scan_do.wav'; // Ganti dengan path audio yang diinginkan
            const audio = document.getElementById('scan-audio');
            audio.load(); // Memuat audio baru
            audio.play(); // Memutar suara

            // Memeriksa format input
            if (inputValue.includes('|')) {
                console.log("check scan",globalRecords)
                // Format: part_number|supplier_id|qty|no_lot
                await ScanOutStok(pb, inputValue,globalRecords); // Panggil fungsi penulisan
                 // Setelah menyimpan, ambil qty scan terbaru
                let qtyScanMap = await searchKartuStok(globalRecords[0].Delivery_Note_No); // Ambil qtyScanMap
                console.log("searchKartuStok",qtyScanMap)
                
                displayResults(globalRecords, qtyScanMap); // Perbarui tampilan dengan qtyScanMap
            } else {
                // Format: DO-A-2502000048
                await searchDO(inputValue);
            }
        }, 200); // 0.9 detik
    } else {
        $("#result-container").empty(); // Kosongkan hasil jika input kosong
    }
});

$(document).on('click', '.hapus-button', async function() {
    const deliveryNoteNo = $(this).data('delivery-note');
    const supplierPartNumber = $(this).data('supplier-part');

    // Konfirmasi password
    const { value: password } = await Swal.fire({
        title: 'Konfirmasi Password',
        input: 'password',
        inputLabel: 'Masukkan password admin',
        inputPlaceholder: 'Password',
        showCancelButton: true,
        confirmButtonText: 'Hapus',
        cancelButtonText: 'Batal',
        allowOutsideClick: false
    });

    // Cek password
    if (password === 'sp102103') { // Ganti dengan password yang sesuai
        try {
            // Mencari record ID berdasarkan Delivery_Note_No dan Supplier_Part_Number
            const records = await pb.collection('data_do').getList(1, 1, {
                filter: `Delivery_Note_No="${deliveryNoteNo}" && Supplier_Part_Number="${supplierPartNumber}"`
            });

            if (records.items.length > 0) {
                const recordId = records.items[0].id; // Ambil ID dari record yang ditemukan

                // Hapus data dari data_do
                await pb.collection('data_do').delete(recordId);

                Swal.fire({
                    title: 'Sukses!',
                    text: 'Data berhasil dihapus.',
                    icon: 'success',
                    timer: 1300,
                    showConfirmButton: false
                });

                // Refresh data setelah penghapusan
                await searchDO(deliveryNoteNo); // Panggil kembali untuk memperbarui tampilan
            } else {
                Swal.fire('Data tidak ditemukan', 'Tidak ada data yang cocok untuk dihapus.', 'warning');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Terjadi kesalahan saat menghapus data.', 'error');
        }
    } else {
        Swal.fire({
            title: 'Password Salah',
            text: 'Hubungi Admin untuk menghapus data.',
            icon: 'error',
            timer: 1300,
            showConfirmButton: false
        });
    }
});

});

async function searchDO(deliveryNoteNo) {
const resultContainer = $("#result-container");
resultContainer.html('<div class="text-center"><p>sedang mencari DO ini...</p><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>');

try {
    // Autentikasi ke PocketBase
    const authResponse = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
    
    // Mengambil data dari collection data_do
    globalRecords = await pb.collection('data_do').getFullList({
            filter: `Delivery_Note_No="${deliveryNoteNo}"`
        });
    
    // hapus data jika duplicat
    const seen = new Set();
    const duplicates = [];

    for (const record of globalRecords) {
        const partNumber = record.Supplier_Part_Number;
        if (seen.has(partNumber)) {
            // Jika sudah pernah dilihat, tandai untuk dihapus
            duplicates.push(record.id);
        } else {
            seen.add(partNumber);
        }
    }
    
     if (duplicates.length > 0) {
        const audio = new Audio('../suara/duplicat_gw_hapus.mp3');
        audio.play();
    }

        for (const id of duplicates) {
        await pb.collection('data_do').delete(id);
    }

    // Hapus juga dari globalRecords agar tidak ditampilkan
    globalRecords = globalRecords.filter(item => !duplicates.includes(item.id));


    // Kosongkan input dan set fokus kembali
    $("#do-input").val(''); // Mengosongkan input
    $("#do-input").focus(); // Mengatur fokus kembali ke input

     let qtyScanMap = await searchKartuStok(deliveryNoteNo); // Panggil kembali searchKartuStok
    console.log("Searchdo",qtyScanMap)
  // Reset qtyScanMap jika tidak valid
    if (!qtyScanMap || Object.keys(qtyScanMap).length === 0) {
        console.log("qtyScanMap is empty or undefined");
        qtyScanMap = {}; // Reset qtyScanMap ke objek kosong
    }

    displayResults(globalRecords, qtyScanMap); // Perbarui tampilan dengan qtyScanMap


} catch (error) {
    console.log(error);
    if (error.message.includes("not found")) {
         const audio = new Audio('../suara/do_belum_di_upload.mp3');
            audio.play();
        resultContainer.html('<h5 style="color:red;font-weight:bold">DO ini belum Di UPLOAD di sistem ini.</h5>');
    } else {
        resultContainer.html('<h6>Terjadi error saat pencarian DO, harap coba lagi.</h6>');
    }
}
}

async function displayResults(items,qtyScanMap) {
const resultContainer = $("#result-container");
resultContainer.empty(); // Kosongkan hasil sebelumnya

if (items.length > 0) {
     const deliveryNoteNo = items[0].Delivery_Note_No;

    let table = `
    <h5 style="text-align:center;font-weight:bold">${deliveryNoteNo}</h5>
    <table class="table table-bordered">
    <thead>
    <tr>
    <th>Aksi</th> 
    <th>No</th> 
    <th>nama_barang</th>
    <th>Part Number</th>
    <th>Qty Do</th>`
     // Tambahkan kolom Qty Scan hanya jika qtyScanMap valid
    if (qtyScanMap && Object.keys(qtyScanMap).length > 0) {
        table += `<th>Qty Scan</th>`;
    }
    
    table += `</tr>
    </thead><tbody>`;

      let nomorUrut = 1;
      let allMatch = true; // Variabel untuk mengecek apakah semua item cocok

    items.forEach(item => {
           const qtyScan = qtyScanMap && qtyScanMap[item.Supplier_Part_Number] !== undefined ? qtyScanMap[item.Supplier_Part_Number] : 0; // Ambil qty scan atau 0 jika tidak ada
          
        // Tentukan kelas atau gaya berdasarkan perbandingan
        const qtyDN = parseInt(item.Qty_DN) || 0; // Konversi ke angka, default ke 0 jika NaN
        const qtyScanParsed = parseInt(qtyScan) || 0; // Konversi ke angka, default ke 0 jika NaN

        const rowStyle = (qtyDN === qtyScanParsed) ? 'background-color: green; color: white; font-weight: bold;' : '';
        table += `
            <tr style="${rowStyle}">
         <td>
        <button  class="btn btn-danger hapus-button" data-delivery-note="${item.Delivery_Note_No}" data-supplier-part="${item.Supplier_Part_Number}">Hapus</button>
        </td> 
            <td>${nomorUrut}</td> 
                <td style="font-weight:bold">${item.Part_Number_Desc}</td>
                <td>${item.Supplier_Part_Number}</td>
                <td>${item.Qty_DN}</td>`
               // Tambahkan kolom Qty Scan jika qtyScanMap valid
            if (qtyScanMap && Object.keys(qtyScanMap).length > 0) {
                table += `<td>${qtyScan}</td>`;
            }
            
            table += `</tr>`;

             if (qtyDN !== qtyScanParsed) {
                allMatch = false; // Set allMatch ke false jika ada yang tidak cocok
            }
            nomorUrut++; 
    });
    table += '</tbody></table>';
    resultContainer.html(table);
     if (allMatch) {
            const audio = new Audio('../suara/udah_close_do.mp3');
            audio.play();
        }
} else {
    const audio = new Audio('../suara/do_belum_di_upload.mp3');
            audio.play();
    resultContainer.html(`<h5 style="color:red;text-align:center;">Nomor DO <b>${inputValue}</b> ini belum Di UPLOAD di sistem ini. </h5>`);
}
}


function errorScan(message) {
    Swal.fire({
        timer:1300,
        icon: 'error',
        title: 'Scan Tidak Standar',
        text: message,
    });

    const audio = new Audio('../../suara/partnumber_ga_standar_scan.mp3');
    audio.play();

    $('#do-input').val('');
}
