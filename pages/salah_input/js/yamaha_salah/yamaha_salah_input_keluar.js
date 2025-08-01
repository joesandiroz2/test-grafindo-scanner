// Inisialisasi PocketBase untuk Yamaha Keluar
const pb_yamaha_keluar = new PocketBase(pocketbaseUrl);

// Saat halaman dimuat
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await loginPocketBaseYamahaKeluar();
    await tampilkanTerakhirKeluarYamaha();
  } catch (error) {
    console.error("Gagal autentikasi Yamaha:", error);
  }
});

// Fungsi login ke PocketBase
async function loginPocketBaseYamahaKeluar() {
  await pb_yamaha_keluar.collection("users").authWithPassword(username_pocket, user_pass_pocket);
}

// Fungsi untuk menghitung waktu relatif 
function waktuRelatifYamahaKeluar(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;

  const detik = Math.floor(diffMs / 1000);
  const menit = Math.floor(detik / 60);
  const jam = Math.floor(menit / 60);
  const hari = Math.floor(jam / 24);

  if (hari >= 1) return `${hari} hari lalu`;
  else if (jam >= 1) return `${jam} jam lalu`;
  else if (menit >= 1) return `${menit} menit lalu`;
  else return `Baru saja`;
}

// Fungsi ambil data "keluar" dari yamaha_kartu_stok
async function tampilkanTerakhirKeluarYamaha() {
  const container = document.getElementById("yamaha_terakhir_keluar");

  // Tampilkan spinner saat loading
  container.innerHTML = `
    <div class="text-center py-3">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Sedang mengambil data Yamaha...</span>
      </div>
      <p class="mt-2 mb-0">Sedang mengambil data Yamaha...</p>
    </div>
  `;

  try {
    const result = await pb_yamaha_keluar.collection("yamaha_kartu_stok").getList(1, 1, {
      sort: "-created",
      filter: 'status = "keluar"',
    });

    container.innerHTML = "";

    result.items.forEach((item, i) => {
      const waktu = waktuRelatifYamahaKeluar(item.created);

      const card = `
        <div class="card mb-2" style="background-color: #f8d7da; border-left: 5px solid red;">
          <div class="card-body p-2">
            <p class="card-text mb-1" style="font-size: 0.85rem;"><strong>${i + 1}</strong></p>
            <p class="card-text mb-1"> ${item.no_do}</p>
            <h6 class="card-title" style="font-weight:bold">${item.nama_barang}</h6>
            <p class="card-text mb-1"><strong>Part:</strong> ${item.part_number}</p>
            <p class="card-text mb-1"><strong>Qty Keluar:</strong> ${item.qty_scan}</p>
            <p class="card-text mb-1"><strong>Lot:</strong> ${item.lot}</p>
             <span style="font-style: italic;">(${waktu})</span>
          </div>
          <div class="row mb-2">
            <div class="col-6">
              <button class="btn btn-sm btn-success w-100" onclick='lihatKartuStokYamahaKeluar(${JSON.stringify(item)})'>Lihat Kartu Stok</button>
            </div>
            <div class="col-6">
              <button class="btn btn-sm btn-warning w-100" onclick='buatModalPerbaikiYamahaKeluar(${JSON.stringify(item)})'>Perbaiki Qty</button>
            </div>
          </div>
          <div class="row mt-1 mb-1">
            <div class="col-4">
              <button class="btn btn-sm btn-danger w-100" onclick="hapusDataYamahaKeluar('${item.id}', this)">Hapus</button>
            </div>
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
  } catch (err) {
    console.error("Gagal mengambil data Yamaha keluar:", err);
    container.innerHTML = `<div class="text-danger text-center">Gagal mengambil data Yamaha. Coba refresh</div>`;
  }
}

function buatModalPerbaikiYamahaKeluar(item) {
  // Hapus modal lama jika ada
  const modalLama = document.getElementById("modal-perbaiki-yamaha-keluar");
  if (modalLama) modalLama.remove();

  // Buat elemen modal
  const modal = document.createElement("div");
  modal.id = "modal-perbaiki-yamaha-keluar";
  modal.style.position = "fixed";
  modal.style.top = "20%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -20%)";
  modal.style.background = "white";
  modal.style.padding = "20px";
  modal.style.zIndex = "1000";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  modal.innerHTML = `
    <h5>Perbaiki Data Keluar Yamaha</h5>
    <p><strong>Nama Barang:</strong> ${item.nama_barang}</p>
    <p><strong>Part Number:</strong> ${item.part_number}</p>
    <p><strong>Qty Keluar:</strong><br>
      <input type="number" id="input-qty-yamaha-keluar" class="form-control" value="${item.qty_scan}">
    </p>
    <p><strong>Lot:</strong><br>
      <input type="text" id="input-lot-yamaha" class="form-control" value="${item.lot || ''}">
    </p>
    <p><strong>NO DO/PB:</strong><br>
      <input type="text" id="input-do-yamaha" class="form-control" value="${item.no_do || ''}">
    </p>

    <div class="mt-3 d-flex justify-content-between">
      <button class="btn btn-primary" id="btn-simpan-yamaha-keluar">Simpan</button>
      <button class="btn btn-secondary" id="btn-batal-yamaha-keluar">Batal</button>
    </div>
  `;

  // Buat overlay
  const overlay = document.createElement("div");
  overlay.id = "modal-overlay-yamaha-keluar";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "999";

  // Event: batal
  overlay.onclick = tutupModalYamahaKeluar;
  modal.querySelector("#btn-batal-yamaha-keluar").onclick = tutupModalYamahaKeluar;

  // Event: simpan
  modal.querySelector("#btn-simpan-yamaha-keluar").onclick = async function () {
    const btnSimpan = document.getElementById("btn-simpan-yamaha-keluar");
    btnSimpan.disabled = true;
    btnSimpan.innerText = "Sedang menyimpan...";

    const qtyBaru = parseInt(document.getElementById("input-qty-yamaha-keluar").value);
    const lotBaru = document.getElementById("input-lot-yamaha").value.trim();
    const noDoBaru = document.getElementById("input-do-yamaha").value.trim();

    if (isNaN(qtyBaru) || qtyBaru < 0) {
      Swal.fire("Error", "Qty tidak boleh kosong atau negatif!", "warning");
      btnSimpan.disabled = false;
      btnSimpan.innerText = "Simpan";
      return;
    }

    try {
      const sebelumnya = await pb_yamaha_keluar.collection("yamaha_kartu_stok").getList(1, 1, {
        sort: "-created",
        filter: `part_number = "${item.part_number}" && created < "${item.created}"`,
      });

      const balanceSebelumnya = sebelumnya.items.length > 0 ? parseInt(sebelumnya.items[0].balance || 0) : 0;
      const balanceBaru = balanceSebelumnya - qtyBaru;

      await pb_yamaha_keluar.collection("yamaha_kartu_stok").update(item.id, {
        qty_scan: qtyBaru,
        balance: balanceBaru,
        lot: lotBaru,
        no_do: noDoBaru
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Qty dan balance Yamaha berhasil diperbarui.",
        timer: 1500,
        showConfirmButton: false
      });

      tutupModalYamahaKeluar();
      tampilkanTerakhirKeluarYamaha();
    } catch (err) {
      console.error("Gagal update Yamaha:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Gagal menyimpan perubahan data Yamaha.",
      });
      btnSimpan.disabled = false;
      btnSimpan.innerText = "Simpan";
    }
  };

  // Tampilkan ke body
  document.body.appendChild(overlay);
  document.body.appendChild(modal);
}

function tutupModalYamahaKeluar() {
  const modal = document.getElementById("modal-perbaiki-yamaha-keluar");
  const overlay = document.getElementById("modal-overlay-yamaha-keluar");
  if (modal) modal.remove();
  if (overlay) overlay.remove();
}

function tutupModalStokYamahaKeluar() {
  const modal = document.getElementById("modal-lihat-kartu-yamaha-keluar");
  const overlay = document.getElementById("modal-overlay-yamaha-keluar");
  if (modal) modal.remove();
  if (overlay) overlay.remove();
}

// lihat kartu stok Yamaha
async function lihatKartuStokYamahaKeluar(item) {
  // Hapus modal lama
  const lama = document.getElementById("modal-lihat-kartu-yamaha-keluar");
  if (lama) lama.remove();

  const overlay = document.createElement("div");
  overlay.id = "modal-overlay-yamaha-keluar";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "999";
  overlay.onclick = tutupModalYamahaKeluar;

  const modal = document.createElement("div");
  modal.id = "modal-lihat-kartu-yamaha-keluar";
  modal.style.position = "fixed";
  modal.style.top = "10%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, 0)";
  modal.style.background = "white";
  modal.style.padding = "20px";
  modal.style.zIndex = "1000";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  modal.style.maxHeight = "80%";
  modal.style.overflowY = "auto";
  modal.style.width = "90%";
  modal.innerHTML = `
    <h5 class="mb-3">Kartu Stok Yamaha - 10 transaksi terakhir</h5>
    <p><strong>Part Number:</strong> ${item.part_number}</p>
    <p><strong>Nama Barang:</strong> ${item.nama_barang}</p>
    <div class="mt-3 text-end">
      <button class="btn btn-danger btn-sm" onclick="tutupModalStokYamahaKeluar()">Tutup</button>
    </div>
    <div class="table-responsive">
      <table class="table table-bordered table-sm">
        <thead class="thead-dark">
          <tr>
            <th>No</th>
            <th>in</th>
            <th>balance</th>
            <th>out</th>
            <th>DO/Pb</th>
            <th>Lot</th>
            <th>Status</th>
            <th>Tanggal</th>
          </tr>
        </thead>
        <tbody id="isi-kartu-stok-yamaha-keluar">
          <tr><td colspan="8" class="text-center">Loading data Yamaha...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  try {
    const perPage = 10;

    // Ambil info total halaman lebih dulu
    const temp = await pb_yamaha_keluar.collection("yamaha_kartu_stok").getList(1, perPage, {
      filter: `part_number = "${item.part_number}"`,
    });

    const totalPages = temp.totalPages;

    // Sekarang ambil 10 data terakhir dari halaman terakhir
    const hasil = await pb_yamaha_keluar.collection("yamaha_kartu_stok").getList(totalPages, perPage, {
      filter: `part_number = "${item.part_number}"`,
    });

    const tbody = modal.querySelector("#isi-kartu-stok-yamaha-keluar");
    tbody.innerHTML = "";

    if (hasil.items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center">Data Yamaha tidak ditemukan.</td></tr>`;
    } else {
      hasil.items.forEach((row, i) => {
        const balance = parseInt(row.balance || 0);
        const warnaBalance = balance < 0 ? 'style="color:red; font-weight:bold;"' : 'style="color:black; font-weight:bold;"';

        const tgl = new Date(row.created).toLocaleString();
        tbody.innerHTML += `
          <tr>
            <td>${i + 1}</td>
            <td>${row.qty_masuk || "-"}</td>
            <td ${warnaBalance}>${balance}</td>
            <td>${row.qty_scan || "-"}</td>
            <td>${row.no_do || "-"}</td>
            <td>${row.lot || "-"}</td>
            <td>${row.status || "-"}</td>
            <td>${tgl}</td>
          </tr>
        `;
      });
    }
  } catch (err) {
    console.error("Gagal load kartu stok Yamaha:", err);
    const tbody = modal.querySelector("#isi-kartu-stok-yamaha-keluar");
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Gagal memuat data Yamaha</td></tr>`;
  }
}

// hapus data Yamaha
async function hapusDataYamahaKeluar(id, tombol) {
  const konfirmasi = await Swal.fire({
    title: "Yakin hapus data Yamaha ini?",
    text: "Data akan hilang secara permanen! Pastikan balance part ini sudah dicek.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus!",
    cancelButtonText: "Batal"
  });

  if (!konfirmasi.isConfirmed) return;

  tombol.disabled = true;
  const teksAwal = tombol.innerText;
  tombol.innerText = "Sedang menghapus...";

  try {
    await pb_yamaha_keluar.collection("yamaha_kartu_stok").delete(id);

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data Yamaha berhasil dihapus.",
      timer: 1500,
      showConfirmButton: false
    });

    // Refresh data
    tampilkanTerakhirKeluarYamaha();
  } catch (err) {
    console.error("Gagal menghapus data Yamaha:", err);
    Swal.fire("Gagal", "Tidak bisa menghapus data Yamaha", "error");
    tombol.disabled = false;
    tombol.innerText = teksAwal;
  }
}