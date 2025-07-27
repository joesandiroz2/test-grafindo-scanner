

$(document).ready(function() {
    $("#inputForm").on("submit", function(event) {
        event.preventDefault();

        const submitButton = $(this).find('button[type="submit"]');
        submitButton.prop('disabled', true).text('Sedang membuat...');

        const data = {
            "operator": localStorage.getItem('operator_label'),
            "merk": $("#merk").val(),
            "part_number": $("#part_number").val(),
            "nama_barang": $("#nama_barang").val(),
            "qty": $("#qty").val(),
            "satuan": $("#satuan").val(),
            "lot": $("#lot").val(),
            "depo": $("#depo").val(),
            "supplier_id": $("#supplier_id").val(),
            "berapa_lembar": $("#berapa_lembar").val(),
            "tgl_inspeksi": $("#tgl_inspeksi").val()
        };

        // Ambil data lama dari localStorage (jika ada)
        let storedData = JSON.parse(localStorage.getItem('scan_data') || '[]');

        // Tambahkan data baru ke array
        storedData.push(data);

        // Simpan kembali ke localStorage
        localStorage.setItem('scan_data', JSON.stringify(storedData));

        // Tampilkan notifikasi sukses
        Swal.fire({
            title: 'Sukses!',
            text: 'Data berhasil disimpan di localStorage.',
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 1300
        });

        // Reset form dan redirect
        $("#inputForm")[0].reset();
        window.location.href = "/print_label/system2_gse/index.html";

        // Aktifkan tombol kembali
        submitButton.prop('disabled', false).text('Buat');
    });
});
