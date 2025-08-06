
// Inisialisasi PocketBase
const pb = new PocketBase(pocketbaseUrl);

async function fetchDataBarang() {
try {
// Tampilkan loading SweetAlert2
  const loader = document.createElement('div');
        loader.className = 'text-center';
        loader.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="sr-only">Loading...</span>
            </div>
            <p>Sedang Memuat Data... Silakan tunggu sebentar</p>
        `;
        document.getElementById("data-container").appendChild(loader);

// Autentikasi pengguna
await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

// Ambil data dari koleksi `data_barang`
const records = await pb.collection('data_barang').getFullList({
    sort: "-created",  // Urutkan berdasarkan terbaru
});


// Filter hanya yang memiliki `ikut_set`
const filteredRecords = records.filter(item => item.ikut_set && item.ikut_set.trim() !== "");

// Tutup loading setelah data diterima
 loader.remove();

if (filteredRecords.length === 0) {
    Swal.fire({
        icon: 'warning',
        title: 'Data Kosong',
        text: 'Tidak ada data barang dengan ikut_set.',
    });
    return;
}

// Kelompokkan data berdasarkan `ikut_set`
const groupedData = {};
filteredRecords.forEach(item => {
    const setName = item.ikut_set;
    if (!groupedData[setName]) {
        groupedData[setName] = [];
    }
    groupedData[setName].push(item);
});

// Render data ke HTML
renderData(groupedData);
} catch (error) {
// Tutup loading dan tampilkan error jika ada masalah
Swal.close();
Swal.fire({
    icon: 'error',
    title: 'Gagal Mengambil Data',
    text: 'Terjadi kesalahan saat mengambil data barang.',
});
console.error("Error fetching data:", error);
}
}

// Fungsi untuk menampilkan data dalam tabel Bootstrap
function renderData(groupedData) {
const container = document.getElementById("data-container");
container.innerHTML = "";  // Kosongkan sebelum menampilkan data

for (const [setName, items] of Object.entries(groupedData)) {
    const table = `
        <div style="background-color:maroon;color:white;display:flex;justify-content:space-between;padding:10px">
            <h4 class="mt-4">${setName}</h4>
            <button class="btn btn-warning kurangi-pb" data-set="${setName}">Kurangi Semua QTY di SET ini</button>
            <button class="btn btn-primary tambah-pb" data-set="${setName}">Tambahkan PB</button>
        </div>
        <table class="table table-bordered">
            <thead class="thead-dark">
                <tr>
                    <th>No</th>
                    <th>Gambar</th>
                    <th>Nama Barang</th>
                    <th>Part Number</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><img src="${pocketbaseUrl}/api/files/data_barang/${item.id}/${item.gambar}" style="width:300px;height:180px"></td>
                        <td>${item.nama_barang}</td>
                        <td>${item.part_number}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    container.innerHTML += table;
}

// Tambahkan event listener ke semua tombol "Tambahkan PB"
document.querySelectorAll(".tambah-pb").forEach(button => {
    button.addEventListener("click", function () {
        const setName = this.getAttribute("data-set");
        openModal(setName);
    });
});


// PROSES PENGURANGAN STOK
document.querySelectorAll(".kurangi-pb").forEach(button => {
    button.addEventListener("click", async function () {
        const setName = this.getAttribute("data-set");

        const { value: formValues } = await Swal.fire({
            title: `Kurangi QTY dari semua barang di SET: ${setName}`,
             html:
        '<label for="swal-input-lot">LOT</label>' +
        '<input id="swal-input-lot" class="swal2-input" placeholder="LOT">' +

        '<label for="swal-input-dn">NO DN</label>' +
        '<input id="swal-input-dn" class="swal2-input" placeholder="NO DN">' +

        '<label for="swal-input-qty">QTY</label>' +
        '<input id="swal-input-qty" class="swal2-input" type="number" placeholder="QTY" min="1">',
  
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Kurangi',
            preConfirm: () => {
                const lot = document.getElementById('swal-input-lot').value.trim().toUpperCase();
                const dn = document.getElementById('swal-input-dn').value.trim().toUpperCase();
                const qty = parseInt(document.getElementById('swal-input-qty').value, 10);

                if (!lot || !dn || isNaN(qty) || qty <= 0) {
                    Swal.showValidationMessage('Semua input harus diisi dengan benar!');
                    return false;
                }

                return { lot, dn, qty };
            }
        });

        if (!formValues) return;

        Swal.fire({
            title: 'Sedang Memproses...',
            html: 'Silakan tunggu',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const barangRecords = await pb.collection("data_barang").getFullList();
            const matchingBarangList = barangRecords.filter(item => item.ikut_set === setName);

            for (const barang of matchingBarangList) {
                const { id, part_number, nama_barang, gambar } = barang;

                const existingKartu = await pb.collection("kartu_stok").getList(1, 1, {
                    filter: `part_number = "${part_number}"`,
                    sort: "-created"
                });

                if (existingKartu.items.length > 0) {
                    const lastBalance = parseInt(existingKartu.items[0].balance, 10);
                    const newBalance = lastBalance - formValues.qty;

                    if (newBalance < 0) continue;

                    const newId = Math.random().toString(36).substr(2, 6);
                    await pb.collection("kartu_stok").create({
                        id: newId,
                        part_number,
                        nama_barang,
                        lot: formValues.lot,
                        no_dn: formValues.dn,
                        gambar: gambar ? `${pocketbaseUrl}/api/files/data_barang/${id}/${gambar}` : 'tidak ada gambar',
                        status: "keluar",
                        qty_ambil:formValues.qty,
                        balance: newBalance,
                        qty_keluar: formValues.qty,
                        tgl_pb: new Date().toLocaleDateString("en-GB", {
                            day: "2-digit", month: "long", year: "numeric"
                        })
                    });
                }
            }

            Swal.fire({ icon: "success", title: "QTY berhasil dikurangi!" }).then(() => {
                window.location.reload();
            });

        } catch (error) {
            Swal.fire({ icon: "error", title: "Terjadi kesalahan!", text: error.message });
        }
            });
        });

}

function openModal(setName) {
// Isi input Set Name
document.getElementById("setName").value = setName;

// Isi input Tanggal PB dengan tanggal sekarang
const today = new Date().toISOString().split("T")[0];
document.getElementById("tglPB").value = today;

// Kosongkan input lainnya
document.getElementById("nomorPB").value = "";
document.getElementById("nomorLot").value = "";
document.getElementById("qty").value = "";

// Tampilkan modal
$("#modalPB").modal("show");
}

document.getElementById("masukkanQty").addEventListener("click", async function () {
    const setName = document.getElementById("setName").value;
    const tglPBInput = document.getElementById("tglPB").value;
    // Format nomor PB: Hilangkan spasi & ubah huruf besar
    let nomorPB = document.getElementById("nomorPB").value.trim().toUpperCase().replace(/\s+/g, '');
    
    // Format nomor lot: Hapus spasi & angka 0 di depan
    let nomorLot = document.getElementById("nomorLot").value.replace(/\s+/g, '').replace(/^0+/, '');

    const qty = parseInt(document.getElementById("qty").value, 10);

    if (!nomorPB || !nomorLot || isNaN(qty) || qty <= 0) {
        Swal.fire({ icon: "warning", title: "Harap isi semua inputan data dengan benar!" });
        return;
    }

    // Format tanggal menjadi "22 January 2025"
    const tglPB = new Date(tglPBInput).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    Swal.fire({
        title: 'Sedang Memproses...',
        html: 'Silakan tunggu',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        // Ambil semua barang yang sesuai dengan setName
        const barangRecords = await pb.collection("data_barang").getFullList();
        const matchingBarangList = barangRecords.filter(item => item.ikut_set === setName);

        if (matchingBarangList.length === 0) {
            Swal.fire({ icon: "error", title: "Set tidak ditemukan!" });
            return;
        }

        // Ambil semua kartu_stok untuk pengecekan
        // const kartuRecords = await pb.collection("kartu_stok").getFullList();

        // Proses semua barang yang cocok
        for (const barang of matchingBarangList) {
            const { id,part_number: partNumber, nama_barang: namaBarang, gambar } = barang;
            const imageUrl = gambar ? `${pocketbaseUrl}/api/files/data_barang/${id}/${gambar}` : 'tidak ada gambar';

            // Cek apakah part_number dengan lot sudah ada di kartu_stok
             const existingKartu = await pb.collection("kartu_stok").getList(1, 1, {
                filter: `part_number = "${partNumber}"`,
                sort: "-created" // Ambil data terbaru
            });

            let newBalance = qty; // Default balance = qty input jika tidak ada data lama

            if (existingKartu.items.length > 0) {
                // Ambil balance dari data terbaru
                const lastBalance = parseInt(existingKartu.items[0].balance, 10);
                newBalance = lastBalance + qty; // Tambahkan qty input ke balance terbaru
            }

            // Buat data baru dengan balance yang diperbarui
            const newId = Math.random().toString(36).substr(2, 6); // UUID 6 karakter
            await pb.collection("kartu_stok").create({
                id: newId,
                part_number: partNumber,
                nama_barang: namaBarang,
                lot: nomorLot,
                no_dn: nomorPB,
                gambar: imageUrl,
                status: "masuk",
                balance: newBalance, // Balance baru = balance lama + qty input
                qty_masuk: qty,
                tgl_pb: tglPB
            });
        }

        Swal.fire({ icon: "success", title: "Data berhasil disimpan!" }).then(() => {
            window.location.reload();
        });

    } catch (error) {
        Swal.fire({ icon: "error", title: "Terjadi kesalahan!", text: error.message });
    }
});









// Panggil fungsi fetch saat halaman dimuat
document.addEventListener("DOMContentLoaded", fetchDataBarang);
