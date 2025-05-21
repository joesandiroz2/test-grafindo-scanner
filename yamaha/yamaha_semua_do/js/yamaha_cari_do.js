document.addEventListener("DOMContentLoaded", function () {
  const pb = new PocketBase(pocketbaseUrl); // dari pocket_config.js
  
  const searchBtn = document.getElementById("searchDoBtn");
  const searchInput = document.getElementById("searchDoInput");
  const spinner = document.getElementById("loadingSpinner");
  const tableHead = document.getElementById("doTableHead");
  const tableBody = document.getElementById("doTableBody");

  searchBtn.addEventListener("click", async function () {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      Swal.fire("Belum input nomor DO", "Masukkan nomor DO dulu!", "warning");
      return;
    }

    spinner.style.display = "block";
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleString("id-ID", options);
  }
  
    try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
      const resultList = await pb.collection("yamaha_do").getList(1, 50, {
        filter: `no_do ~ "${searchTerm}"`,
      });

      const items = resultList.items;
      if (items.length === 0) {
        tableHead.innerHTML = "";
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Data tidak ditemukan</td></tr>`;
        spinner.style.display = "none";
        return;
      }

      // Set header kolom (sekali saja)
      tableHead.innerHTML = `
        <tr>
          <th>No</th>
          <th>No DO</th>
          <th>Tgl DO</th>
          <th>Part Number</th>
          <th>Nama Barang</th>
          <th>Qty</th>
        </tr>
      `;

      // Isi tabel dengan hasil pencarian
      tableBody.innerHTML = items
        .map((item, index) => {
            const createdFormatted = formatDate(item.created);
          return `
            <tr>
              <td>${createdFormatted}</td>
              <td>${item.kode_depan + item.no_do}</td>
              <td>${item.tgl_do}</td>
              <td>${item.part_number}</td>
              <td>${item.nama_barang}</td>
              <td>${item.qty}</td>
            </tr>
          `;
        })
        .join("");

    } catch (error) {
      console.error("Gagal mencari DO:", error);
      Swal.fire("Error", "Terjadi kesalahan saat mencari DO", "error");
    } finally {
      spinner.style.display = "none";
    }
  });
});
