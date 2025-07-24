// Fungsi untuk memeriksa barang berdasarkan nomor barang
async function checkBarang(part_number,qty_part) {
       const nomor_barang = part_number.trim().replace(/\s+/g, '').toUpperCase(); 
    const qty = qty_part; // Ambil qty
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
            document.getElementById('qr_scanner').value = '';
            document.getElementById('nama_barang').value = ''; // Set nama_barang

            document.getElementById('qr_scanner').focus();
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


let debounceTimer;

document.getElementById('qr_scanner').addEventListener('input', function (e) {
    clearTimeout(debounceTimer); // Reset timer setiap kali ada input baru

    debounceTimer = setTimeout(() => {
        const value = e.target.value.trim();

        if (value.includes(" ") && value.length > 10) {
            const parts = value.split(/\s+/); // Pisah semua spasi

            if (parts.length >= 2) {
                const partNumber = parts[0];
                const qty = parts[1];

                // Kosongkan input scanner agar bisa scan lagi
                e.target.value = "";

                // Panggil fungsi pengecekan
                checkBarang(partNumber, qty);
            }
        }
    }, 500); // Tunggu 600ms setelah input terakhir
});

