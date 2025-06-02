
// Inisialisasi PocketBase
const pb = new PocketBase(pocketbaseUrl);

async function fetchDataBarang(namaSetFilter) {
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
const records = await pb.collection('yamaha_data_barang').getFullList({
    sort: "-created",  // Urutkan berdasarkan terbaru
    filter:`ikut_set  ~  "${namaSetFilter}"`
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
        <div style="background-color:cyan;color:black;display:flex;justify-content:space-between;padding:10px">
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
                    <th>Stok Awal/Akhir</th>
                      <th>Dikalikan</th> 
                </tr>
            </thead>
            <tbody>
                ${items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><img src="${pocketbaseUrl}/api/files/yamaha_data_barang/${item.id}/${item.gambar}" style="width:100px;height:40px"></td>
                        <td>${item.nama_barang}</td>
                        <td style="font-weight:bold">${item.part_number}</td>
                      <td colspan="2">
                        <div class="stok-info mt-1" data-part="${item.part_number}">
                            <span class="stok-awal">Stok Awal: ...</span> 
                            <span class="stok-awal-bulan">Awal Bulan: ...</span>
                            <span class="stok-akhir">Stok Akhir: ...</span>
                      
                        </div>
                    </td>

                       <td>
                <select class="form-control select-dikalikan" data-part="${item.part_number}">
                  ${[...Array(10).keys()].map(i => {
                      const value = i + 1;
                      const selected = parseInt(item.dikalikan) === value ? 'selected' : '';
                      return `<option value="${value}" ${selected}>${value}</option>`;
                  }).join("")}
                </select>

            </td>

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
        const barangRecords = await pb.collection("yamaha_data_barang").getFullList();
        const matchingBarangList = barangRecords.filter(item => item.ikut_set === setName);

        if (matchingBarangList.length === 0) {
            Swal.fire({ icon: "error", title: "Set tidak ditemukan!" });
            return;
        }

   
        // Proses semua barang yang cocok
        for (const barang of matchingBarangList) {
            const { id,part_number: partNumber, nama_barang: namaBarang, gambar } = barang;
            const imageUrl = gambar ? `${pocketbaseUrl}/api/files/yamaha_data_barang/${id}/${gambar}` : 'tidak ada gambar';


            // hitung total dikalikan
            const selectElement = document.querySelector(`.select-dikalikan[data-part="${partNumber}"]`);
            const dikalikan = selectElement ? parseInt(selectElement.value, 10) : 1;
            const totalQty = qty * dikalikan;

            // proses ke penyerahan barang
            // Cek apakah sudah ada entry dengan part_number dan lot yang sama di yamaha_penyerahan_barang
            const existingPB = await pb.collection("yamaha_penyerahan_barang").getList(1, 1, {
                filter: `part_number = "${partNumber}" && lot = "${nomorLot}"`
            });

            if (existingPB.items.length > 0) {
                // Jika sudah ada, update qty_masuk
                const currentQtyMasuk = parseInt(existingPB.items[0].qty_masuk, 10) || 0;
                const updatedQtyMasuk = currentQtyMasuk + totalQty;

                await pb.collection("yamaha_penyerahan_barang").update(existingPB.items[0].id, {
                    qty_masuk: updatedQtyMasuk
                });
            } else {
                // Jika belum ada, buat data baru
                await pb.collection("yamaha_penyerahan_barang").create({
                    part_number: partNumber,
                    lot: nomorLot,
                    nama_barang: namaBarang,
                    tgl_pb: tglPB,
                    no_pb: nomorPB,
                    qty_masuk: totalQty
                });
            }

            // =============================
            // proses ke kartu stok
            // Cek apakah part_number dengan lot sudah ada di kartu_stok
             const existingKartu = await pb.collection("yamaha_kartu_stok").getList(1, 1, {
                filter: `part_number = "${partNumber}"`,
                sort: "-created" // Ambil data terbaru
            });

            let newBalance = totalQty; // Default balance = qty input jika tidak ada data lama

            if (existingKartu.items.length > 0) {
                // Ambil balance dari data terbaru
                const lastBalance = parseInt(existingKartu.items[0].balance, 10);
                newBalance = lastBalance + totalQty;

            }

            // Buat data baru dengan balance yang diperbarui
            const newId = Math.random().toString(36).substr(2, 6); // UUID 6 karakter
            await pb.collection("yamaha_kartu_stok").create({
                part_number: partNumber,
                nama_barang: namaBarang,
                lot: nomorLot,
                no_do: nomorPB,
                gambar: imageUrl,
                status: "masuk",
                balance: newBalance, // Balance baru = balance lama + qty input
                qty_masuk: totalQty,
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


document.getElementById("btnCariSet").addEventListener("click", () => {
    const selectedSet = document.getElementById("selectSet").value;
    if (selectedSet) {
        fetchDataBarang(selectedSet); // kirim nama set sebagai parameter
    } else {
        Swal.fire("Pilih Set", "Silakan pilih nama set terlebih dahulu.", "warning");
    }
});


// hitung stok awal akhir
document.getElementById("btn-tampilkan-semua-stok").addEventListener("click", async function() {
  const btn = this;

  // Disable tombol dan ubah teks
  btn.disabled = true;
  btn.textContent = "Sedang cek stok...";

  const stokElements = document.querySelectorAll(".stok-info");

  for (const el of stokElements) {
    const partNumber = el.getAttribute("data-part");

    const stokAwalSpan = el.querySelector(".stok-awal");
    const stokAwalBulanSpan = el.querySelector(".stok-awal-bulan");
    const stokAkhirSpan = el.querySelector(".stok-akhir");

    stokAwalSpan.textContent = "Stok Awal: ...";
    stokAwalBulanSpan.textContent = "Stok Awal Bulan: ...";
    stokAkhirSpan.textContent = "Stok Akhir: ...";

    const { stokAwal, stokAwalBulan, stokAkhir } = await getStokAwalAkhir(partNumber);

    let bulanSingkat = stokAwalBulan;
    if (stokAwalBulan) {
      const parts = stokAwalBulan.split(' ');
      if (parts.length >= 2) {
        const bulan = parts[0].substring(0,3).toUpperCase();
        const tahun = parts[1];
        bulanSingkat = `${bulan} ${tahun}`;
      }
    }
    console.log('stokAwalBulan:', stokAwalBulan);

    stokAwalSpan.textContent = `Stok Awal: ${stokAwal}`;
    stokAwalBulanSpan.textContent = `Stok Awal Bulan: ${bulanSingkat}`;
    stokAkhirSpan.textContent = `Stok Akhir: ${stokAkhir}`;
  }

  // Enable tombol dan kembalikan teks awal
  btn.disabled = false;
  btn.textContent = "Tampilkan Semua Stok";
});


async function getStokAwalAkhir(partNumber) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Format tanggal string
  function formatDate(d) {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
  }

  // Dapatkan tanggal terakhir bulan sebelumnya
  const lastDayPrevMonth = new Date(year, month - 1, 0); // 0 hari bulan ini artinya hari terakhir bulan sebelumnya
  const lastDatePrevMonthStr = formatDate(lastDayPrevMonth);

  // Tanggal 1 bulan ini (stok awal bulan)
  const firstDayThisMonth = new Date(year, month - 1, 1);
  const firstDateThisMonthStr = formatDate(firstDayThisMonth);

  // Tanggal terakhir bulan ini (stok akhir)
  const lastDayThisMonth = new Date(year, month, 0);
  const lastDateThisMonthStr = formatDate(lastDayThisMonth);

  // Ambil stok terakhir bulan sebelumnya (stok awal)
  const stokAwalResult = await pb.collection("yamaha_kartu_stok").getList(1, 1, {
    filter: `part_number = "${partNumber}"`,
  });

  // Ambil stok awal bulan ini (tanggal 1 bulan ini)
  const stokAwalBulanResult = await pb.collection("yamaha_kartu_stok").getList(1, 1, {
    filter: `part_number = "${partNumber}" && created >= "${firstDateThisMonthStr}T00:00:00"`,
    sort: "created" // data paling awal bulan ini
  });

  // Ambil stok akhir bulan ini (tanggal terakhir bulan ini)
  const stokAkhirResult = await pb.collection("yamaha_kartu_stok").getList(1, 1, {
    filter: `part_number = "${partNumber}" && created <= "${lastDateThisMonthStr}T23:59:59"`,
    sort: "-created" // data terbaru bulan ini
  });

  // Ambil balance dari masing-masing query, jika kosong maka default 0
  const stokAwal = stokAwalResult.items.length > 0 ? stokAwalResult.items[0].balance : 0;
  const stokAwalBulan = stokAwalBulanResult.items.length > 0 ? stokAwalBulanResult.items[0].balance : stokAwal; // fallback ke stokAwal
  const stokAkhir = stokAkhirResult.items.length > 0 ? stokAkhirResult.items[0].balance : stokAwalBulan;

  return { stokAwal, stokAwalBulan, stokAkhir };
}
