// Fungsi untuk memeriksa barang berdasarkan nomor barang
async function checkBarang() {
       const nomor_barang = document.getElementById('partnumber_scan').value.trim().replace(/\s+/g, '').toUpperCase(); 
    const qty = document.getElementById('qty_scan').value.trim(); // Ambil qty
    let nomorcari = `${nomor_barang.toUpperCase()}`
    console.log("nomorcari",nomorcari)
    document.getElementById('part_number').value = nomor_barang; // Set part_number
    document.getElementById('qty').value = qty; // Set qty
           
    try {
        // Mencari barang berdasarkan nomor_barang
         const response = await fetch(`${pocketbaseUrl}/api/collections/system2_barang_data/records?page=1&perPage=50&filter=nomor_barang%20%3D%20%27${nomorcari}%27`);
       
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const resultList = await response.json();

        console.log("resultList",resultList)
        

        if (resultList.items.length > 0) {
            const item = resultList.items[0]; // Ambil item pertama yang ditemukan
            document.getElementById('nama_barang').value = item.nama_barang; // Set nama_barang

            const audio = new Audio('../../suara/suara_ok.mp3');
            audio.play();
            // Menampilkan notifikasi sukses
            Swal.fire({
                title: 'Berhasil!',
                text: 'Barang berhasil ditemukan.',
                icon: 'success',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            });
            document.getElementById('partnumber_scan').value = '';
                document.getElementById('qty_scan').value = '';
        } else {
            const audio = new Audio('../../suara/system2_partnumber_belom_ada.mp3');
            audio.play();
            // Menampilkan notifikasi gagal
            Swal.fire({
                title: 'Part Number ini Belum ada di sistem ini , buat data barang baru',
                text: 'Part number barang tidak ditemukan.',
                icon: 'error',
                confirmButtonText: 'OK',
                timer:1300
            });
            document.getElementById('partnumber_scan').value = '';
                document.getElementById('qty_scan').value = '';
                document.getElementById('partnumber_scan').focus();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
            title: 'Gagal!',
            text: 'Terjadi kesalahan saat mencari barang.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    } 
}

// Event listener untuk menangani input scan
// Fungsi untuk memeriksa apakah kedua input terisi
function checkInputsAndRun() {
    const nomor_barang = document.getElementById('partnumber_scan').value.trim();
    const qty = document.getElementById('qty_scan').value.trim();

    // Memastikan kedua input terisi
    if (nomor_barang && qty) {
        checkBarang(); // Panggil fungsi checkBarang jika kedua input terisi
    }
}

// Event listener untuk menangani input scan
document.getElementById('partnumber_scan').addEventListener('input', checkInputsAndRun);
document.getElementById('qty_scan').addEventListener('input', checkInputsAndRun);