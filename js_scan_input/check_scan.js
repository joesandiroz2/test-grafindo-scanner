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

        // Validasi: harus ada 4 blok jika menggunakan '|', atau inputan standar tanpa '|'
    if ((parts.length === 4 && inputValue.endsWith('|')) || (parts.length !== 4 && !/^[A-Z0-9-]+$/.test(inputValue))) {
        // Tampilkan SweetAlert2 jika tidak sesuai
        Swal.fire({
            timer:1300,
            icon: 'error',
            title: 'Partnumber scan Tidak Standar, hanya 3 block',
            text: 'Partnumber scan harus terdiri dari 4 blok dan tidak boleh diakhiri dengan "|", atau input standar tanpa "|".',
        });

        // Memutar suara
        const audio = new Audio('../../suara/partnumber_ga_standar_scan.mp3');
        audio.play();

        // Menghapus inputan setelah menampilkan pesan
        $('#do-input').val('');
        return; // Keluar dari fungsi jika format tidak sesuai
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
        }, 1300); // 1.3 detik
    } else {
        $("#result-container").empty(); // Kosongkan hasil jika input kosong
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
    resultContainer.html(`<h5 style="color:red;text-align:center;">Nomor DO <b>${inputValue}</b> ini belum Di UPLOAD di sistem ini. Minta Pa DEDE untuk Upload DO Excel</h5>`);
}
}