document.addEventListener("DOMContentLoaded", async function () {
  const pb = new PocketBase(pocketbaseUrl); // dari pocket_config.js

  const spinner = document.getElementById("loadingSpinner");
  const tableHead = document.getElementById("doTableHead");
  const tableBody = document.getElementById("doTableBody");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let currentPage = 1;
  const perPage = 20;

  try {
    // Login dulu
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    console.log("Login berhasil");

    fetchData(currentPage);
  } catch (err) {
    console.error("Login gagal:", err);
  }

  async function fetchData(page) {
    spinner.style.display = "block";
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    try {
      const resultList = await pb.collection("yamaha_do").getList(page, perPage, {
        sort: "-created",
      });

      renderTable(resultList.items);
      currentPage = page;

      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = resultList.page >= resultList.totalPages;
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    Swal.fire("gagal dapat do", "coba refresh atau server lagi gangguan", "error");
      
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Gagal memuat data</td></tr>`;
    } finally {
      spinner.style.display = "none";
    }
  }

  function formatTanggal(created) {
    const date = new Date(created);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const tanggal = date.toLocaleDateString('id-ID', options);
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${tanggal} ${jam}`;
  }

  function renderTable(data) {
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
      return;
    }

    // Header manual
    const headerRow = document.createElement("tr");
 const headers = ["Diupload", "No DO", "Part Number", "Nama Barang", "Qty", "Remarks", "Tgl DO"];

    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    tableHead.appendChild(headerRow);

    // Body
    data.forEach((item) => {
      const row = document.createElement("tr");

      const createdFormatted = formatTanggal(item.created);
      const fields = [
      createdFormatted,
      `${item.kode_depan || ""}${item.no_do || ""}`, // Gabungkan kode_depan dan no_do
      item.part_number || "",
      item.nama_barang || "",
      item.qty || "",
      item.remarks || "",
      item.tgl_do || ""
    ];


      fields.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        row.appendChild(td);
      });

      tableBody.appendChild(row);
    });
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) fetchData(currentPage - 1);
  });

  nextBtn.addEventListener("click", () => {
    fetchData(currentPage + 1);
  });
});
