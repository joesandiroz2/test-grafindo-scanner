import { searchKartuStok } from './keluar_stok/check_kartu_stok.js';
import { ScanOutStok } from './keluar_stok/scan_out_stok.js';

const pb = new PocketBase(pocketbaseUrl);
let globalRecords = []; // Variabel global untuk menyimpan data dari data_do

$(document).ready(function() {
$("#navbar-container").load("./component/nav.html");

let timeout;
$("#do-input").on("input", function() {
    clearTimeout(timeout);
    const bersih_input = $(this).val().trim();
    
    // Menghapus spasi dan mengubah input menjadi huruf besar
    const inputValue = bersih_input.toUpperCase().replace(/\s+/g, '');

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
    displayResults(globalRecords);
    
    // Kosongkan input dan set fokus kembali
    $("#do-input").val(''); // Mengosongkan input
    $("#do-input").focus(); // Mengatur fokus kembali ke input

    await searchKartuStok(deliveryNoteNo); // Panggil kembali searchKartuStok

} catch (error) {
    console.log(error);
    if (error.message.includes("not found")) {
        resultContainer.html('<h6>DO ini belum ada di sistem ini.</h6>');
    } else {
        resultContainer.html('<h6>Terjadi error saat pencarian DO, harap coba lagi.</h6>');
    }
}
}

async function displayResults(items) {
const resultContainer = $("#result-container");
resultContainer.empty(); // Kosongkan hasil sebelumnya

if (items.length > 0) {
     const deliveryNoteNo = items[0].Delivery_Note_No;

    let table = `
    <h5 style="text-align:center;font-weight:bold">${deliveryNoteNo}</h5>
    <table class="table table-bordered">
    <thead>
    <tr>
    <th>nama_barang</th>
    <th>Part Number</th>
    <th>Qty </th>
    </tr>
    </thead><tbody>`;
    items.forEach(item => {
        table += `
            <tr>
                <td>${item.Part_Number_Desc}</td>
                <td>${item.Supplier_Part_Number}</td>
                <td>${item.Qty_DN}</td>
            </tr>`;
    });
    table += '</tbody></table>';
    resultContainer.html(table);
} else {
    resultContainer.html('<h6>DO ini belum ada di sistem ini.</h6>');
}
}