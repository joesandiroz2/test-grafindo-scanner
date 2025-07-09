const pb = new PocketBase(pocketbaseUrl);

async function loginPocketBase() {
  if (!pb.authStore.isValid) {
    try {
      await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
      console.log("Login PocketBase berhasil");
    } catch (err) {
      console.error("Gagal login PocketBase:", err);
      alert("Gagal login ke PocketBase");
    }
  }
}

async function fetchDoTerkunci() {
  try {
    await loginPocketBase();

    const records = await pb.collection("yamaha_do").getFullList({
      filter: 'is_lock = "terkunci"',
      sort: "-created"
    });

    const seen = new Set();
    const uniqueNoDOs = [];

    for (const record of records) {
      if (!seen.has(record.no_do)) {
        seen.add(record.no_do);
        uniqueNoDOs.push({
          no_do: record.no_do,
          kode_depan: record.kode_depan || "",
          is_lock_msg: record.is_lock_msg || "Tidak ada pesan",
          created: record.created
        });
      }
    }

    const container = document.getElementById("daftarDoTerkunci");
    container.innerHTML = "";

    if (uniqueNoDOs.length === 0) {
      container.innerHTML = "<div class='alert alert-success'>Tidak ada DO yang terkunci.</div>";
    } else {
      let html = `
        <div class="table-responsive">
          <table class="table table-bordered table-striped">
            <thead class="table-danger">
              <tr>
                <th>No</th>
                <th>No DO</th>
                <th>Pesan Terkunci</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
      `;

      uniqueNoDOs.forEach((item, index) => {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${item.kode_depan} ${item.no_do}</td>
            <td>${item.is_lock_msg}</td>
            <td>${formatTanggal(item.created)}</td>
            <td>
              <button class="btn btn-sm btn-success perbaiki-btn" data-nodo="${item.no_do}">
                Perbaiki dan kembalikan
              </button>
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;

      // Tambahkan info total DO
      const totalInfo = document.createElement("div");
      totalInfo.className = "mt-3 alert alert-info";
      totalInfo.textContent = `Total DO terkunci unik: ${uniqueNoDOs.length}`;
      container.prepend(totalInfo);
    }

  } catch (err) {
    console.error("Gagal mengambil data DO terkunci:", err);
    document.getElementById("daftarDoTerkunci").innerHTML = "<div class='alert alert-danger'>Gagal mengambil data dari PocketBase.</div>";
  }
}

function formatTanggal(isoString) {
  const bulanIndonesia = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const date = new Date(isoString);
  const tgl = date.getDate();
  const bulan = bulanIndonesia[date.getMonth()];
  const tahun = date.getFullYear();
  const jam = String(date.getHours()).padStart(2, '0');
  const menit = String(date.getMinutes()).padStart(2, '0');
  return `${tgl} ${bulan} ${tahun} ${jam}:${menit}`;
}

// ✅ Event delegation + handle tombol perbaiki
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("perbaiki-btn")) {
    const btn = e.target;
    const noDo = btn.getAttribute("data-nodo");

    // 🔐 SweetAlert2 konfirmasi password
    const { value: password } = await Swal.fire({
      title: 'Konfirmasi Password',
      input: 'password',
      inputLabel: 'Masukkan password untuk melanjutkan',
      inputPlaceholder: 'Password',
      inputAttributes: {
        maxlength: 20,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Lanjutkan',
      cancelButtonText: 'Batal'
    });

    // Jika user batal
    if (password === undefined) return;

    // Cek password
    if (password !== 'sp102103') {
      return Swal.fire({
        icon: 'error',
        title: 'Password Salah',
        text: 'Anda tidak memiliki akses untuk memperbaiki DO ini.'
      });
    }

    // Password benar: lanjutkan proses
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "Sedang mengembalikan...";

    try {
      await loginPocketBase();

      const recordsToUpdate = await pb.collection("yamaha_do").getFullList({
        filter: `no_do = "${noDo}"`
      });

      for (const rec of recordsToUpdate) {
        await pb.collection("yamaha_do").update(rec.id, {
          is_lock: "",
          is_lock_msg: ""
        });
      }

      // Toast berhasil
      Swal.fire({
        toast: true,
        position: "top-start",
        icon: "success",
        title: `No DO ${noDo} berhasil diperbaiki`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      // Refresh tabel
      fetchDoTerkunci();

    } catch (err) {
      console.error("Gagal memperbaiki DO:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat memperbaiki DO."
      });
    } finally {
      // Pulihkan tombol
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
});


// Mulai saat halaman siap
fetchDoTerkunci();
