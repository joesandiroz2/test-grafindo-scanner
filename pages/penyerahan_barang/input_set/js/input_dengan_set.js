
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
