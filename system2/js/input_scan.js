$(document).ready(function() {
    // Event listener untuk form submit
    $("#inputForm").on("submit", function(event) {
        event.preventDefault(); // Mencegah reload halaman

        // Menonaktifkan tombol dan mengubah teks
        const submitButton = $(this).find('button[type="submit"]');
        submitButton.prop('disabled', true).text('Sedang membuat...');

        // Mengambil data dari input
        const data = {
            "merk": $("#merk").val(),
            "part_number": $("#part_number").val(),
            "nama_barang": $("#nama_barang").val(),
            "qty": $("#qty").val(),
            "satuan": $("#satuan").val(),
            "lot": $("#lot").val(),
            "depo": $("#depo").val(),
            "supplier_id": $("#supplier_id").val(),
            "tgl_inspeksi": $("#tgl_inspeksi").val()
        };
        console.log(data); // Debugging: lihat data yang akan dikirim

        // Mengirim data ke PocketBase menggunakan fetch
        fetch(pocketbaseUrl + '/api/collections/system2_barang_data/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Jika ada token otentikasi, tambahkan di sini
                // 'Authorization': 'Bearer YOUR_TOKEN'
            },
            body: JSON.stringify(data)
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((responseData) => {
            // Menampilkan notifikasi sukses
            Swal.fire({
                title: 'Sukses!',
                text: 'Data berhasil dikirim.',
                icon: 'success',
                confirmButtonText: 'OK',
                timer:1300
            });
            // Reset form setelah sukses
            $("#inputForm")[0].reset();
            window.location.href = "/system2/index.html";
        })
        .catch((error) => {
            // Menampilkan notifikasi gagal
            Swal.fire({
                title: 'Gagal!',
                text: error.message || 'Terjadi kesalahan saat mengirim data.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            console.error('Error:', error);
        })
        .finally(() => {
            // Mengaktifkan kembali tombol dan mengubah teksnya
            submitButton.prop('disabled', false).text('Buat');
        });
    });
});