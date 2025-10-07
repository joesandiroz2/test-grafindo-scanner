const pb = new PocketBase(pocketbaseUrl);

$(document).ready(async function () {

  // === LOGIN POCKETBASE ===
  async function loginUser() {
    try {
      if (!pb.authStore.isValid) {
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("✅ Login PocketBase berhasil sebagai:", username_pocket);
      }
    } catch (err) {
      console.error("❌ Gagal login PocketBase:", err);
      Swal.fire("Gagal login ke PocketBase!", "", "error");
    }
  }

  // === SWEETALERT TOAST ===
  const Toast = Swal.mixin({
    toast: true,
    position: "center",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  await loginUser();
  const collection = "dian_scan_barang";

  // === OTOMATIS UPPERCASE DI INPUT ===
  $("#nama_barang, #ikut_set, #part_number").on("input", function () {
    this.value = this.value.toUpperCase();
  });

  // === CREATE ===
  async function createBarang(data) {
    try {
      const record = await pb.collection(collection).create(data);
      console.log("✅ Data berhasil dibuat:", record);
      await loadBarang();
      $("#formBarang")[0].reset();

      Toast.fire({ icon: "success", title: "Data berhasil ditambahkan!" });
    } catch (err) {
      console.error("❌ Gagal membuat data:", err);
      Swal.fire("Gagal menambah data!", "", "error");
    }
  }

  // === READ (GROUP BY ikut_set) ===
  // === READ (GROUP BY ikut_set) ===
async function loadBarang() {
  const container = $("#listBarang");
  container.empty();

  // tampilkan preloader sementara data diambil
  container.html(`
    <div class="text-center my-5" id="loading-indicator">
      <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;"></div>
      <div class="mt-3 fw-bold">Sedang memuat data barang...</div>
    </div>
  `);

  try {
    const records = await pb.collection(collection).getFullList({ sort: "-created" });
    $("#loading-indicator").remove(); // hapus loading

    if (records.length === 0) {
      container.html(`
        <div class="alert alert-warning text-center mt-4">
          <i class="bi bi-exclamation-circle"></i> Tidak ada data barang ditemukan!
        </div>
      `);
      return;
    }

    // grupkan berdasarkan ikut_set
    const grouped = {};
    records.forEach(item => {
      if (!grouped[item.ikut_set]) grouped[item.ikut_set] = [];
      grouped[item.ikut_set].push(item);
    });

    // buat row grid
    const rowDiv = $('<div class="row g-3"></div>');

    // tampilkan tiap grup dalam kolom
    for (const [setName, items] of Object.entries(grouped)) {
      const colDiv = $('<div class="col-md-6 col-sm-12 col-lg-6"></div>');

      const groupCard = $(`
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <b>${setName}</b>
            <button class="btn btn-success btn-sm btn-add-pb" data-set="${setName}">
              Tambah PB
            </button>
          </div>
          <ul class="list-group list-group-flush" id="list-${setName.replace(/\s+/g, '-')}"></ul>
        </div>
      `);

      const listEl = groupCard.find("ul");
      items.forEach((item, i) => {
        listEl.append(`
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${i + 1}.</strong> ${item.part_number} — ${item.nama_barang}
            </div>
            <div>
              <button class="btn btn-sm btn-warning btn-edit me-2"
                data-id="${item.id}"
                data-nama="${item.nama_barang}"
                data-part="${item.part_number}"
                data-set="${item.ikut_set}">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${item.id}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </li>
        `);
      });

      colDiv.append(groupCard);
      rowDiv.append(colDiv);
    }

    container.append(rowDiv);

  } catch (err) {
    console.error("❌ Gagal mengambil data:", err);
    $("#loading-indicator").remove();
    container.html(`
      <div class="alert alert-danger text-center mt-4">
        <i class="bi bi-x-circle"></i> Gagal memuat data dari PocketBase!
      </div>
    `);
  }
}


  // === UPDATE ===
  async function updateBarang(id, data) {
    try {
      const updated = await pb.collection(collection).update(id, data);
      console.log("✅ Data diperbarui:", updated);
      await loadBarang();
      Toast.fire({ icon: "success", title: "Data berhasil diperbarui!" });
    } catch (err) {
      console.error("❌ Gagal update data:", err);
      Swal.fire("Gagal update data!", "", "error");
    }
  }

  // === DELETE ===
  async function deleteBarang(id) {
    const konfirmasi = await Swal.fire({
      title: "Yakin hapus data ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    try {
      await pb.collection(collection).delete(id);
      console.log("🗑️ Data dihapus:", id);
      await loadBarang();
      Toast.fire({ icon: "success", title: "Data berhasil dihapus!" });
    } catch (err) {
      console.error("❌ Gagal hapus data:", err);
      Swal.fire("Gagal hapus data!", "", "error");
    }
  }

  // === SUBMIT TAMBAH ===
  $("#formBarang").on("submit", async function (e) {
    e.preventDefault();

    const nama_barang = $("#nama_barang").val().trim().toUpperCase();
    const part_number = $("#part_number").val().replace(/\s+/g, "").toUpperCase();
    const ikut_set = $("#ikut_set").val().trim().toUpperCase();

    const data = { nama_barang, part_number, ikut_set };
    await createBarang(data);
  });

  // === EDIT (SweetAlert2) ===
  $(document).on("click", ".btn-edit", async function () {
    const id = $(this).data("id");
    const nama = $(this).data("nama");
    const part = $(this).data("part");
    const set = $(this).data("set");

    const { value: formValues } = await Swal.fire({
      title: "Edit Barang",
      html: `
        <div class="text-start">
          <label>Nama Barang</label>
          <input id="swal-nama" class="swal2-input" value="${nama}">
          <label>Part Number</label>
          <input id="swal-part" class="swal2-input" value="${part}">
          <label>Ikut Set</label>
          <input id="swal-set" class="swal2-input" value="${set}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      preConfirm: () => {
        return {
          nama_barang: document.getElementById("swal-nama").value.trim().toUpperCase(),
          part_number: document.getElementById("swal-part").value.replace(/\s+/g, "").toUpperCase(),
          ikut_set: document.getElementById("swal-set").value.trim().toUpperCase(),
        };
      },
    });

    if (formValues) {
      await updateBarang(id, formValues);
    }
  });

  // === DELETE BUTTON ===
  $(document).on("click", ".btn-delete", function () {
    const id = $(this).data("id");
    deleteBarang(id);
  });

  // === LOAD AWAL ===
  await loadBarang();
});


// === TAMBAH PB UNTUK SEMUA BARANG DALAM SET ===
$(document).on("click", ".btn-add-pb", async function () {
  const setName = $(this).data("set");

  // Ambil semua part dari set yang diklik
  const records = await pb.collection("dian_scan_barang").getFullList({
    filter: `ikut_set="${setName}"`,
  });

  if (records.length === 0) {
    return Swal.fire("Tidak ada barang di set ini!", "", "info");
  }

  // === INPUT SEKALI UNTUK SEMUA BARANG DALAM SET ===
  const { value: formValues } = await Swal.fire({
    title: `Input PB untuk SET: ${setName}`,
    html: `
      <div class="text-start">
        <label>No DO</label>
        <input id="swal-no-do" placeholder="Masukkan No DO"><br/>
        <label>Qty Masuk</label>
        <input id="swal-qty" type="number"  placeholder="Masukkan Qty Masuk"><br/>
        <label>Lot</label>
        <input id="swal-lot"  placeholder="Masukkan Lot"><br/>
        <label>Tanggal PB</label>
        <input id="swal-tgl" type="date" >
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Simpan Semua",
    cancelButtonText: "Batal",
    preConfirm: () => {
      return {
        no_do: document.getElementById("swal-no-do").value.trim(),
        qty_masuk: parseInt(document.getElementById("swal-qty").value) || 0,
        lot: document.getElementById("swal-lot").value.trim(),
        tgl_pb: document.getElementById("swal-tgl").value,
      };
    },
  });

  if (!formValues) return;

  const { no_do, qty_masuk, lot, tgl_pb } = formValues;

  Swal.fire({
    title: "Sedang memproses...",
    html: `Menyimpan data untuk semua part di SET: <b>${setName}</b>`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    for (const item of records) {
      const part_number = item.part_number;
      const nama_barang = item.nama_barang;

      // Ambil balance terakhir
      const existing = await pb.collection("others_kartu_stok").getList(1, 1, {
        filter: `part_number="${part_number}"`,
        sort: "-created",
      });

      let newBalance = qty_masuk;
      if (existing.items.length > 0) {
        const lastBalance = parseInt(existing.items[0].balance) || 0;
        newBalance = lastBalance + qty_masuk;
      }

      const data = {
        no_do,
        part_number,
        nama_barang,
        qty_masuk,
        lot,
        tgl_pb,
        status: "MASUK",
        balance: newBalance,
        qty: "",
        kode_depan: "",
        qty_minta: "",
        no_po: "",
      };

      await pb.collection("others_kartu_stok").create(data);
      console.log(`✅ ${part_number} berhasil disimpan`);
    }

    Swal.fire("✅ Semua data PB berhasil disimpan!", "", "success");
  } catch (err) {
    console.error("❌ Gagal menyimpan data PB:", err);
    Swal.fire("❌ Gagal menyimpan data PB!", "", "error");
  }
});

