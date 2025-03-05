// Fungsi untuk memeriksa barang berdasarkan nomor barang
async function checkBarang() {
    const txtScanValue = document.getElementById('txtscan').value.trim();
    // Memisahkan nomor barang dan qty, dan menghapus elemen kosong
    const parts = txtScanValue.split(' ').filter(part => part !== '');
    console.log(txtScanValue,parts)
    
    // Pastikan ada dua elemen: nomor_barang dan qty
    if (parts.length < 2) {
        Swal.fire({
            title: 'scan Input ga standar',
            text: 'Format input tidak valid. Pastikan untuk memasukkan nomor barang dan qty.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
        document.getElementById('txtscan').value = ""; // Kosongkan input txtscan
        return;
    }

    const nomor_barang = parts[0]; // Ambil nomor barang
    const qty = parts[1]; // Ambil qty

    try {
        // Mencari barang berdasarkan nomor_barang
        const resultList = await pb.collection('system2_barang_data').getList(1, 50, {
            filter: `nomor_barang = "${nomor_barang.toUpperCase()}"`
        });
        console.log("resultList",resultList)
        if (resultList.items.length > 0) {
            const item = resultList.items[0]; // Ambil item pertama yang ditemukan
            document.getElementById('part_number').value = item.nomor_barang; // Set part_number
            document.getElementById('qty').value = qty; // Set qty
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
                timer: 3000
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
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
            title: 'Gagal!',
            text: 'Terjadi kesalahan saat mencari barang.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    } finally {
        // Kosongkan input txtscan setelah proses selesai
        document.getElementById('txtscan').value = ""; 
    }
}

// Event listener untuk menangani input scan
document.getElementById('txtscan').addEventListener('input', function() {
    setTimeout(checkBarang, 1200); // Panggil fungsi checkBarang setelah 1.2 detik
});