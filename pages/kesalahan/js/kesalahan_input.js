async function Kurangi_stok_part() {
    const partNumber = $("#part-number").val().trim().replace(/\s+/g, '').toUpperCase();
    const alasan_kurangi = $("#alasan_kurangi").val();
    const lot = $("#no-lot").val();
    const nama_barang = $("#namabarang").val();
    const qty_kurangi = parseInt($("#qtykurangi").val(), 10);

    if (!partNumber || !lot ||!alasan_kurangi || !nama_barang || isNaN(qty_kurangi)) {
        Swal.fire('Ada Inputan yg Kosong , lengkapi dulu', 'Semua field harus diisi dengan benar.', 'error');
        return;
    }

    const loadingButton = $("#kurangi-button");
    loadingButton.prop("disabled", true).text("Sedang Mengurangi Stok...");

    try {

      // Konfirmasi password
    const { value: password } = await Swal.fire({
        title: 'Konfirmasi Password',
        input: 'password',
        inputLabel: 'Masukkan password admin',
        inputPlaceholder: 'Password',
        showCancelButton: true,
        confirmButtonText: 'Lanjutkan',
        cancelButtonText: 'Batal',
        allowOutsideClick: false
    });

    if (password === 'sp102103') {
    
        Swal.fire({
            title: 'Sedang Mengurangi...',
            text: 'Sedang Mengurangi Stok, harap tunggu...',
            allowOutsideClick: false,
             showConfirmButton: false,
            onBeforeOpen: () => {
                Swal.showLoading();
            }
        });

        

      
        // Ambil balance terakhir
        const latestItem = await getBalanceTerakhir(partNumber);
        let balance = 0;

        if (latestItem) {
            balance = parseInt(latestItem.balance, 10) - parseInt(qty_kurangi); // Konversi ke integer sebelum menjumlahkan
        } else {
            balance = qtyMasuk;
        }

        // Buat data untuk disimpan
        const data = {
            id: generateRandomId(),
            no_dn: alasan_kurangi,
            part_number: partNumber,
            qty_ambil: qty_kurangi,
            status: 'keluar',
            lot:lot,
            nama_barang:nama_barang,
            balance: balance,
        };

        // Simpan data ke PocketBase
        await pb.collection('kartu_stok').create(data);

        Swal.close();
        Swal.fire({
            title: 'Sukses!',
            text: 'Stok berhasil dikurangi.',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false
        });

        // Reset inputan
        resetInputs();
     } else {
            Swal.fire('Password Salah', 'Password admin salah, hubungi Admin untuk mengurangi stok.', 'error');
    }

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Terjadi kesalahan saat menambahkan data.', 'error');
    } finally {
        loadingButton.prop("disabled", false).text("Masukkan Qty");
    }
}

function generateRandomId() {
    return Math.random().toString(36).substring(2, 10); // Menghasilkan ID acak 8 karakter
}

async function getBalanceTerakhir(partNumber) {
    const filter = `part_number = "${partNumber}"`; // Filter untuk mendapatkan item terbaru
    const resultList = await pb.collection('kartu_stok').getList(1, 1, {
        sort: '-created', // Mengurutkan berdasarkan tanggal terbaru
        filter: filter,
    });
    return resultList.items.length > 0 ? resultList.items[0] : null; // Mengembalikan item terbaru atau null
}

function resetInputs() {
    $("#part-number").val('');
    $("#no-lot").val('');
    $("#alasan_kurangi").val('');
    $("#qtykurangi").val('');
$("#result-container, #latest-data-container, #error-container").empty().hide();
    window.location.href = "/pages/kesalahan/index.html"
}