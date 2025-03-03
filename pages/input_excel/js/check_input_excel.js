// Daftar kolom yang diharapkan
    const expectedColumns = [
        "Delivery Note No", "Delivery Note Date", "Delivery Note Status", "Delivery Note Type",
        "Print DN Total", "Export XML Total", "Packaging CS No", "Print Packaging CS Total",
        "Plan Receive Min Date", "Plan Receive Min Time", "Plan Receive Max Date", "Plan Receive Max Time",
        "Plant ID", "Plant Desc", "PO Number", "Gate ID", "Gate Desc", "Police Truck No",
        "Departed Date", "Departed Time", "Plant Supplier", "Status GR", "Checklist No", "Year",
        "GR Date", "Cancel Reason", "Cancel Date", "Export XML (Cancel)", "Supplier ID", "Supplier Desc",
        "PO Item", "Supplier Part Number", "Part Number Desc", "Flag Subcontracting", "Batch No",
        "Qty SUM DI Ori", "Qty DN", "Qty DN Received", "AHM Part Number", "DN Created By", "GR By",
        "Abnormal Acknowlage By (Name)", "Abnormal Acknowlage By (Code)", "Abnormal Acknowlage By (No Truck)", "Export"
    ];

   let finalJSON = []; // Variabel global untuk menyimpan data JSON

        // URL PocketBase
        let authToken = '';

        // Fungsi untuk login ke PocketBase
        async function loginToPocketBase() {
            const response = await fetch(`${pocketbaseUrl}/api/collections/users/auth-with-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identity: username_pocket,
                    password: user_pass_pocket
                })
            });

            if (!response.ok) {
                throw new Error('Login gagal');
            }

            const data = await response.json();
            authToken = data.token;
        }

        async function getExistingData() {
            const response = await fetch(`${pocketbaseUrl}/api/collections/data_do/records`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil data dari PocketBase');
            }

            const data = await response.json();
            return data.items; // Asumsi data yang dikembalikan adalah array dari item
        }


        // Fungsi untuk mengirim data ke PocketBase
        async function sendDataToPocketBase(data) {

            console.log(data)
            const response = await fetch(`${pocketbaseUrl}/api/collections/data_do/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Gagal mengirim data ke PocketBase');
            }

            return response.json();
        }

        document.getElementById('fileInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Ambil sheet pertama
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Konversi sheet ke JSON dengan header sebagai key
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Fungsi untuk mengonversi array 2D ke JSON dengan key sebagai nama kolom
            function convertToJSON(data) {
    const headers = data[0]; // Ambil header (nama kolom)
    const rows = data.slice(1); // Ambil baris data (mulai dari indeks 1)

    

    // Periksa apakah semua kolom yang diharapkan ada di header
    const missingColumns = expectedColumns.filter(column => !headers.includes(column));

    if (missingColumns.length > 0) {
        // Tampilkan SweetAlert2 jika ada kolom yang hilang
        Swal.fire({
            icon: 'error',
            title: 'Ada Kolom tidak sesuai standar ',
            html: `Kolom berikut tidak ditemukan atau salah nama kolom : <b>${missingColumns.join(', ')}</b>`
        });
        return null; // Hentikan proses jika ada kolom yang hilang
    }

    // Konversi data ke JSON
    const jsonResult = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            let value = row[index] !== undefined ? row[index] : null;

            // Hapus spasi dari nilai kolom tertentu
            if (header === "Supplier Part Number" || header === "AHM Part Number") {
                if (typeof value === "string") {
                    value = value.replace(/\s+/g, ''); // Hapus semua spasi
                }
            }

             // Clean "Delivery Note No" column
            if (header === "Delivery Note No" && typeof value === "string") {
                value = value.replace(/\s+/g, '').toUpperCase(); // Remove spaces and convert to uppercase
            }

            // Ganti spasi dengan underscore pada header
            const formattedHeader = header.replace(/\s+/g, '_');
            obj[formattedHeader] = value; // Simpan dengan header yang sudah diformat
        });
        return obj;
    });

    return jsonResult;
}

                // Konversi data ke JSON
                finalJSON = convertToJSON(jsonData); // Simpan data ke variabel global
         // Periksa apakah data JSON valid
                if (finalJSON && finalJSON.length > 0) {
                    // Aktifkan tombol jika data JSON valid
                    document.getElementById('submitButton').disabled = false;
                } else {
                    // Nonaktifkan tombol jika data JSON tidak valid
                    document.getElementById('submitButton').disabled = true;
                }
                // Inisialisasi DataTables
                const table = $('#dataTable').DataTable({
                    data: finalJSON, // Data JSON
                    columns: Object.keys(finalJSON[0]).map(key => ({
                        title: key, // Header kolom
                        data: key   // Data kolom
                    })),
                    paging: true,   // Aktifkan pagination
                    searching: true, // Aktifkan pencarian
                    ordering: true, // Aktifkan sorting
                    pageLength: 10, // Jumlah baris per halaman
                    scrollX: true,  // Aktifkan scroll horizontal
                    responsive: false // Nonaktifkan responsif (karena sudah ada scrollX)
                });
            };
            reader.readAsArrayBuffer(file);
        });

        document.getElementById('submitButton').addEventListener('click', async function() {
    const submitButton = this;
    submitButton.disabled = true; // Nonaktifkan tombol saat proses berlangsung

    // Tampilkan SweetAlert2 loading
    Swal.fire({
        title: 'Sedang Memasukkan Do ke database bentar...',
        text: 'Sedang memproses data, harap tunggu.',
        didOpen: () => {
            Swal.showLoading(); // Tampilkan loading indicator
        },
        allowOutsideClick: false, // Mencegah pengguna menutup loading dengan mengklik di luar
        allowEscapeKey: false, // Mencegah pengguna menutup loading dengan tombol escape
        showConfirmButton: false // Sembunyikan tombol OK
    });

    try {
        // Periksa apakah finalJSON valid
        if (!finalJSON || finalJSON.length === 0) {
            throw new Error('Data tidak valid atau kosong. Pastikan file Excel sudah diunggah dan sesuai format.');
        }

        // Login ke PocketBase
        await loginToPocketBase();
         const existingData = await getExistingData();

       
        // Kumpulkan Delivery_Note_No yang sudah ada
          const existingDeliveryNoteNos = new Set(
            existingData.map(item => item.Delivery_Note_No.trim().toLowerCase())
        );

        // Filter data yang akan diunggah (hanya data yang belum ada)
        const dataToUpload = finalJSON.filter(data => {
            const deliveryNoteNo = data.Delivery_Note_No.trim().toLowerCase();
            return !existingDeliveryNoteNos.has(deliveryNoteNo); // Hanya ambil data yang belum ada
        });
        // Kumpulkan Delivery_Note_No yang sudah ada untuk ditampilkan di SweetAlert2
        const duplicateDeliveryNoteNos = finalJSON
            .filter(data => existingDeliveryNoteNos.has(data.Delivery_Note_No.trim().toLowerCase()))
            .map(data => data.Delivery_Note_No);

         let is_swallsuccess = true;

        // Jika ada data yang sudah ada, tampilkan SweetAlert2
        if (duplicateDeliveryNoteNos.length > 0) {
            is_swallsuccess = false;
            Swal.fire({
                icon: 'warning',
                title: `Data Excel kamu yg udah pernah di masukin ga akan di masukan lagi ke database , 
                coba cek lagi bagian semua do . hapus atau cek lagi do yg barusan lu masukin , hapus hapusin yg udah terlanjur masuk barusan. 
                ini data yg terdeteksi sama`,
                html: `Data dengan Delivery Note No berikut sudah ada di database: <b>${duplicateDeliveryNoteNos.join(', ')}</b>`,
                showConfirmButton: true, // Tampilkan tombol OK
                allowOutsideClick: false, // Mencegah pengguna menutup SweetAlert2 dengan mengklik di luar
                allowEscapeKey: false // Mencegah pengguna menutup SweetAlert2 dengan tombol escape
            }).then(() => {
            window.location.href = "/pages/semua_do"; // Redirect setelah sukses
         });
        }

        // Jika tidak ada data yang perlu diunggah
        if (dataToUpload.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Tidak Ada Data Baru',
                text: 'Semua data yang akan diunggah sudah ada di database.'
            });
            return; // Hentikan proses
        }
        console.log(dataToUpload)

        // Kirim data ke PocketBase
        // const promises = finalJSON.map(data => sendDataToPocketBase(data));
        const promises = dataToUpload.map(data => sendDataToPocketBase(data));
       
        await Promise.all(promises);

          if (is_swallsuccess) {
        // Tampilkan pesan sukses
        Swal.fire({
            icon: 'success',
            title: 'Data yg Belum ada berhasil dimasukkan ke database!'
        }).then(() => {
            window.location.href = "/pages/semua_do"; // Redirect setelah sukses
        });
            }
    } catch (error) {
        // Tutup SweetAlert2 loading
        Swal.close();

        // Tampilkan pesan error
        Swal.fire({
            icon: 'error',
            title: 'Terjadi kesalahan',
            text: error.message
        });
    } finally {
        submitButton.textContent = "anda sudah upload Excel" ; // Aktifkan kembali tombol setelah proses selesai
    }
});

// Fungsi untuk menampilkan contoh kolom dengan pemisah koma dan spasi
function tampilkanContohKolom() {
    const container = document.getElementById('contohkolomexcel');
    if (container) {
        // Gabungkan kolom dengan koma dan spasi
        const kolomDenganPemisah = expectedColumns.join(', ');

        // Tampilkan di dalam kontainer
          container.innerHTML = `<b>${kolomDenganPemisah}</b>`;
    }
}

    document.addEventListener('DOMContentLoaded', tampilkanContohKolom);