
async function loadHistoryKeluar() {
    const container = document.getElementById("tbl_permintaan_keluar");

    // tampilkan preloader dulu
    container.innerHTML = `
        <p style="color:purple;font-weight:bold">Sedang mencari data keluar...</p>
    `;

    try {
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

        // Ambil data dari PocketBase dengan sort -created
        const records = await pb.collection("yamaha_kartu_stok").getList(1, 50, {
              filter: 'status = "keluar"',
            sort: "-created"
        });

        // render data → otomatis ganti preloader
        renderHistoryTable(records.items);
    } catch (error) {
        console.error("Gagal ambil history keluar:", error);
        container.innerHTML = `<p style="color:red">Gagal memuat history keluar</p>`;
    }
}


function renderHistoryTable(data) {
    const container = document.getElementById("tbl_permintaan_keluar");

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="color:red">Belum ada data keluar</p>`;
        return;
    }

    let html = `
        <table class="table table-bordered table-striped">
            <thead class="thead-dark">
                <tr>
                    <th>Part Number</th>
                    <th>Nama Barang</th>
                    <th>Qty Keluar</th>
                    <th>Lot</th>
                    <th>Created</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        html += `
            <tr>
                
                <td><div style="font-weight:bold">
            ${item.part_number || ""}
                <p style="color:red;font-weight:bold">
                ${item.kode_depan} ${item.no_do}</p>
                </div>
          <button class="btn btn-primary btn-kartu-stok" data-part-number="${item.part_number}">
          Kartu Stok
        </button>

                </td>
                <td>${item.nama_barang || ""}</td>
                <td><p style="color:red;font-weight:bold">${item.qty_scan }</p></td>
                <td>${item.lot || ""}</td>
                <td>${formatDate(item.created)}</td>
                <td>
                  <button 
                    class="btn btn-warning edit-btn" 
                    data-id="${item.id}" 
                    data-no_do="${item.no_do}" 
                    data-lot="${item.lot}">
                    ganti lot pb
                  </button>
                </td>

            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Event delegation supaya tetap jalan meski tabel di-render ulang
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.getAttribute("data-id");
    const no_do = e.target.getAttribute("data-no_do");
    const lot = e.target.getAttribute("data-lot");

    // Set ke modal input
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-no-do").value = no_do || "";
    document.getElementById("edit-lot").value = lot || "";

    // Tampilkan modal
    $("#editLotPbModal").modal("show");
  }
});


document.getElementById("saveLotPbBtn").addEventListener("click", async function() {
  const id = document.getElementById("edit-id").value;
  const no_do = document.getElementById("edit-no-do").value.trim();
  const lot = document.getElementById("edit-lot").value.trim();

  if (!id) {
    Swal.fire("Error", "ID tidak ditemukan!", "error");
    return;
  }

  try {
    await pb.collection("yamaha_kartu_stok").update(id, {
      no_do: no_do,
      lot: lot
    });

    Swal.fire("Sukses", "Data berhasil diperbarui!", "success");

    // Tutup modal
    $("#editLotPbModal").modal("hide");

    // Refresh tabel
    loadHistoryKeluar();

  } catch (error) {
    console.error("Gagal update:", error);
    Swal.fire("Error", "Gagal memperbarui data!", "error");
  }
});


function formatDate(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d; // selisih dalam ms
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Kalau kurang dari 1 menit
    if (diffMin < 1) {
        return "Barusan";
    }
    // Kalau < 1 jam
    if (diffHour < 1) {
        return `${diffMin} menit lalu`;
    }
    // Kalau < 24 jam
    if (diffDay < 1) {
        return `${diffHour} jam lalu`;
    }

    // Kalau lebih dari 1 hari → tampilkan tanggal lengkap
    const day = String(d.getDate()).padStart(2, "0");

    // Nama bulan dalam bahasa Indonesia
    const bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const monthName = bulan[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day} ${monthName} ${year} ${hours}:${minutes}`;
}

//modal kartu stok

//modal kartu stok
//modal kartu stok
async function bukaKartuStok(partNumber,btnElement) {
  const tbody = document.getElementById("tbodyKartuStok");
  const judul = document.getElementById("judulKartuStok");
  const modal = new bootstrap.Modal(document.getElementById("modalKartuStok"));


  // Ubah tampilan tombol jadi "Checking..."
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Checking...`;
  }

  judul.textContent = partNumber;
  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-info">Sedang Memuat data...</td></tr>`;

  try {
    const result = await pb.collection("yamaha_kartu_stok").getList(1, 15, {
      sort: "-created",
      filter: `part_number = "${partNumber}"`
    });

    const items = result.items.reverse(); // urutan dari lama ke baru

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-secondary">Tidak ada data kartu stok</td></tr>`;
      modal.show();
      return;
    }

    tbody.innerHTML = "";
    items.forEach((item, i) => {
      // Format tanggal manual
      const d = new Date(item.created);
      const bulanIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const tanggal = d.getDate();
      const bulan = bulanIndo[d.getMonth()];
      const tahun = d.getFullYear();
      let jam = d.getHours();
      let menit = d.getMinutes();
      if (jam < 10) jam = "0" + jam;
      if (menit < 10) menit = "0" + menit;

      const tglManual = `${tanggal} ${bulan} ${tahun} ${jam}:${menit}`;

       // Warna dan style balance
      const balanceValue = item.balance || 0;
      const balanceStyle = balanceValue < 0
        ? 'color:red;font-weight:bold'
        : 'font-weight:bold';


      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td style="color:purple;font-weight:bold">${item.qty_masuk || 0}</td>
        <td style="${balanceStyle}">${balanceValue}</td>
        <td style="color:red;font-weight:bold">${item.qty_scan || 0}</td>
        <td style="font-weight:bold">${item.kode_depan + item.no_do || "-"}</td>
        <td>${item.lot || "-"}</td>
        <td>${tglManual}</td>
      `;
      tbody.appendChild(tr);
    });

    modal.show();
  } catch (err) {
    console.error("Gagal ambil kartu stok:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Gagal mengambil data: ${err.message}</td></tr>`;
    modal.show();
  }finally {
    // Balikkan tombol ke keadaan normal
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = "Kartu Stok";
    }
  }
}


// Auto load saat halaman ready
document.addEventListener("DOMContentLoaded", loadHistoryKeluar);



// Event delegasi untuk tombol "Lihat Kartu Stok"
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("btn-kartu-stok")) {
    const partNumber = e.target.getAttribute("data-part-number");
    bukaKartuStok(partNumber, e.target);
  }
});

