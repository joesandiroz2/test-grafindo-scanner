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
    
    Swal.fire({
            title: 'Sedang Mengurangi Stok...',
            text: 'Sedang Mengurangi Stok, harap tunggu...',
            allowOutsideClick: false,
             showConfirmButton: false,
            onBeforeOpen: () => {
                Swal.showLoading();
            }
        });
        // ==============================
        // proses yamaha penyerahan barang
        const filterPenyerahan = `part_number="${partNumber}" && lot="${lot}"`;
        const penyerahanList = await pb.collection('yamaha_penyerahan_barang').getList(1, 1, {
            sort: '-created',
            filter: filterPenyerahan
        });

        let bolehKurangi = false;
        let dataPenyerahan = null;

        if (penyerahanList.items.length > 0) {
            dataPenyerahan = penyerahanList.items[0];
            if (parseInt(dataPenyerahan.qty_masuk, 10) > 0) {
                // Kurangi qty_masuk
                const sisaQty = parseInt(dataPenyerahan.qty_masuk, 10) - qty_kurangi;
                if (sisaQty < 0) {
                    Swal.fire('Error', 'Qty yang dikurangi melebihi qty_masuk yang tersedia.', 'error');
                    loadingButton.prop("disabled", false).text("Masukkan Qty");
                    return;
                }

                // Update qty_masuk
                await pb.collection('yamaha_penyerahan_barang').update(dataPenyerahan.id, {
                    qty_masuk: sisaQty
                });

                bolehKurangi = true;
            }
        } else {
            // Tidak ditemukan, tapi tetap lanjut ke kartu stok tanpa update penyerahan
            bolehKurangi = true;
        }

        if (!bolehKurangi) {
            Swal.fire('Dibatalkan', 'Tidak ditemukan atau qty_masuk 0.', 'info');
            loadingButton.prop("disabled", false).text("Masukkan Qty");
            return;
        }
    



        // ==============================
        // proses yamaha kartu stok
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
            no_do: alasan_kurangi,
            part_number: partNumber,
            qty_scan: qty_kurangi,
            status: 'keluar',
            lot:lot,
            nama_barang:nama_barang,
            balance: balance,
        };

        // Simpan data ke PocketBase
        await pb.collection('yamaha_kartu_stok').create(data);

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
    const resultList = await pb.collection('yamaha_kartu_stok').getList(1, 1, {
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
    window.location.href = "/yamaha/yamaha_permintaan_barang/yamaha_permintaan_barang.html"
}