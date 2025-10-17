document.addEventListener("DOMContentLoaded", async function () {
  const pb = new PocketBase(pocketbaseUrl);
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const searchInfo = document.getElementById("searchInfo");
  const tbody = document.getElementById("penyerahanData");

  let fullData = [];

  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // Ambil hanya 50 data terbaru
    const result = await pb.collection("yamaha_kartu_stok").getList(1, 50, {
      sort: "-created",
   filter: 'status = "masuk"'
    });
    fullData = result.items;
    renderTable(fullData);
  } catch (err) {
    console.error("Gagal mengambil data:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Gagal mengambil data: ${err.message}</td></tr>`;
  }

  function renderTable(data) {
    tbody.innerHTML = "";
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">Data tidak ditemukan</td></tr>`;
      return;
    }

    data.forEach((item, index) => {
      const updatedFormatted = formatTanggalIndonesia(item.updated);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.part_number} <br/>

         <span style="font-size:15px;font-weight:bold;color:green">${item.no_do}</span>
        <br/>
        <button class="btn btn-primary btn-kartu-stok" data-part-number="${item.part_number}">
        kartu stok
      </button>

         </td>
        <td>${item.nama_barang}</td>
        <td>${item.lot}</td>
        <td>${item.qty_masuk}</td>
        <td><i>${updatedFormatted}</i></td>
         <td>
        <button class="btn btn-warning btn-ganti-lot" data-id="${item.id}" data-no-do="${item.no_do}" data-lot="${item.lot}">ganti lot Pb</button>
      </td>
      `;
        

      tbody.appendChild(tr);
    });
  }

  // Tombol cari → langsung fetch dari PocketBase berdasarkan keyword
  searchBtn.addEventListener("click", async () => {
    let keyword = searchInput.value.trim();
    keyword = keyword.toUpperCase().replace(/\s+/g, "");

    if (!keyword) return;

    try {
      const result = await pb.collection("yamaha_penyerahan_barang").getFullList({
       filter: `part_number ~ "${keyword}"`,
      sort: "-created"
      });
      renderTable(result);
      searchInfo.innerHTML = `Hasil pencarian partnumber: <b>${keyword}</b>`;
    } catch (err) {
      console.error("Gagal mencari data:", err);
      tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Gagal mencari data: ${err.message}</td></tr>`;
    }
  });

  // Tombol reset
  resetBtn.addEventListener("click", async () => {
    searchInput.value = "";
    searchInfo.innerHTML = "";

    const result = await pb.collection("yamaha_penyerahan_barang").getList(1, 50, {
      sort: "-created"
    });
    renderTable(result.items);
  });

  function formatTanggalIndonesia(dateString) {
    const bulanIndo = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const d = new Date(dateString);
    const tanggal = d.getDate();
    const bulan = bulanIndo[d.getMonth()];
    const tahun = d.getFullYear();

    let jam = d.getHours();
    let menit = d.getMinutes();

    jam = jam < 10 ? "0" + jam : jam;
    menit = menit < 10 ? "0" + menit : menit;

    return `${tanggal} ${bulan} ${tahun} ${jam}:${menit}`;
  }
});


document.addEventListener("click", function(e) {
  if (e.target.classList.contains("btn-ganti-lot")) {
    const id = e.target.getAttribute("data-id");
    const lot = e.target.getAttribute("data-lot");
    const no_do = e.target.getAttribute("data-no-do");

    document.getElementById("recordId").value = id;
    document.getElementById("lotBaru").value = lot;
    document.getElementById("nodoBaru").value = no_do;

    const modal = new bootstrap.Modal(document.getElementById("modalGantiLot"));
    modal.show();
  }

  if (e.target.classList.contains("btn-kartu-stok")) {
    const partNumber = e.target.getAttribute("data-part-number");
    bukaKartuStok(partNumber);
  }

});

document.getElementById("btnSimpanLot").addEventListener("click", async function() {
  const id = document.getElementById("recordId").value;
  const lotBaru = document.getElementById("lotBaru").value;
  const nodoBaru = document.getElementById("nodoBaru").value;
  const btn = document.getElementById("btnSimpanLot");

  if (!lotBaru) {
    alert("Lot tidak boleh kosong!");
    return;
  }

  // Ubah teks tombol jadi loading
  const oldText = btn.innerHTML;
  btn.innerHTML = "Sedang mengganti...";
  btn.disabled = true;

  try {
    const updated = await pb.collection("yamaha_kartu_stok").update(id, {
      lot: lotBaru,
      no_do:nodoBaru
    });

    console.log("Update sukses:", updated);
    alert("Lot berhasil diperbarui!");
    location.reload(); // refresh tabel
  } catch (err) {
    console.error("Update error:", err);
    alert("Gagal update lot!");
  } finally {
    // Balikin tombol (kalau tidak ada reload)
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
});


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
        <td style="font-weight:bold;">${item.kode_depan + item.no_do || "-"}</td>
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
      btnElement.innerHTML = "Lihat Kartu Stok";
    }
  }
}
