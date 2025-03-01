async function Masukkan_stok_baru() {
    const partNumber = $("#part-number").val().trim().replace(/\s+/g, '').toUpperCase();
    const noLot = $("#no-lot").val().trim().replace(/^0+/, '');
    const noPB = $("#no_pb").val().trim();
    const tglPB = new Date($("#tgl_pb").val()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const namaBarang = $("#nama_barang").val().trim().toUpperCase();
    const qtyMasuk = parseInt($("#qty_masuk").val(), 10);

    if (!partNumber || !noLot || !noPB || !tglPB || !namaBarang || isNaN(qtyMasuk)) {
        Swal.fire('Error', 'Semua field harus diisi dengan benar.', 'error');
        return;
    }

    const loadingButton = $("#masukkan-qty-button");
    loadingButton.prop("disabled", true).text("Sedang menambahkan...");

    try {
        Swal.fire({
            title: 'Loading...',
            text: 'Sedang menambahkan data, harap tunggu...',
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading();
            }
        });

        // Ambil balance terakhir
        const latestItem = await getBalanceTerakhir(partNumber);
        let balance = 0;

        if (latestItem) {
            balance = latestItem.balance + qtyMasuk; // Tambahkan qtyMasuk ke balance terakhir
        } else {
            balance = qtyMasuk; // Jika tidak ada item, set balance ke qtyMasuk
        }

        // Buat data untuk disimpan
        const data = {
            id: generateRandomId(),
            no_dn: noPB,
            part_number: partNumber,
            lot: noLot,
            nama_barang: namaBarang,
            qty_minta: qtyMasuk,
            qty_ambil: qtyMasuk,
            status: 'masuk',
            tgl_pb: tglPB,
            balance: balance,
        };

        // Simpan data ke PocketBase
        await pb.collection('kartu_stok').create(data);

        Swal.close();
        Swal.fire({
            title: 'Sukses!',
            text: 'Data berhasil ditambahkan.',
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
    const resultList = await pb.collection('kartu_stok').getList(1, 1, {
        sort: '-created', // Mengurutkan berdasarkan tanggal terbaru
        filter: filter,
    });
    return resultList.items.length > 0 ? resultList.items[0] : null; // Mengembalikan item terbaru atau null
}

function resetInputs() {
    $("#no_pb").val('');
    $("#part-number").val('');
    $("#no-lot").val('');
    $("#tgl_pb").val('');
    $("#nama_barang").val('');
    $("#qty_masuk").val('');
    $("#inputan_pb_baru").hide(); // Sembunyikan inputan setelah reset
}