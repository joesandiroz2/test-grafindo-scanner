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
        <td>${item.part_number} <br/> <span style="font-size:15px;font-weight:bold;color:green">${item.no_do}</span></td>
        <td>${item.nama_barang}</td>
        <td>${item.lot}</td>
        <td>${item.qty_masuk}</td>
        <td><i>${updatedFormatted}</i></td>
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
