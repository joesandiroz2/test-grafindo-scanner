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
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data</td></tr>';
    return;
  }

  // Header tabel
  const headerRow = document.createElement("tr");
  const headers = ["Diupload", "No DO", "Part Number", "Nama Barang", "Qty", "Remarks", "Tgl DO", "Aksi"];
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  tableHead.appendChild(headerRow);

  // Isi tabel
  data.forEach((item) => {
    const row = document.createElement("tr");
    const createdFormatted = formatTanggal(item.created);

    const fields = [
      createdFormatted,
      `${item.kode_depan || ""}${item.no_do || ""}`,
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

    // Kolom Aksi
    const tdAksi = document.createElement("td");
    tdAksi.innerHTML = `
      <button class="btn btn-warning btn-sm edit-btn" data-id="${item.id}">Edit</button>
      <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Delete</button>
    `;
    row.appendChild(tdAksi);

    tableBody.appendChild(row);
  });

  // Event tombol Edit
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const record = await pb.collection("yamaha_do").getOne(id);

      document.getElementById("editId").value = record.id;
      document.getElementById("editNoDo").value = record.no_do;
      document.getElementById("editPartNumber").value = record.part_number;
      document.getElementById("editNamaBarang").value = record.nama_barang;
      document.getElementById("editQty").value = record.qty;
      document.getElementById("editRemarks").value = record.remarks;
      document.getElementById("editTglDo").value = record.tgl_do;
      document.getElementById("editKodeDepan").value = record.kode_depan || "";

      // Buka modal
      const modal = new bootstrap.Modal(document.getElementById("editModal"));
      modal.show();
    });
  });

  // Event tombol Delete
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      Swal.fire({
        title: "Yakin mau hapus ??",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal"
      }).then(async (result) => {
        if (result.isConfirmed) {
          await pb.collection("yamaha_do").delete(id);
          Swal.fire("Terhapus!", "Data berhasil dihapus", "success");
          fetchData(currentPage);
        }
      });
    });
  });
}


document.getElementById("editForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("editId").value;
  const data = {
    no_do: document.getElementById("editNoDo").value,
    part_number: document.getElementById("editPartNumber").value,
    nama_barang: document.getElementById("editNamaBarang").value,
    qty: document.getElementById("editQty").value,
    remarks: document.getElementById("editRemarks").value,
    tgl_do: document.getElementById("editTglDo").value
  };

  try {
    await pb.collection("yamaha_do").update(id, data);
    Swal.fire("Berhasil", "Data berhasil diupdate", "success");

    // Tutup modal
    const modalElement = document.getElementById("editModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();

    fetchData(currentPage);
  } catch (err) {
    Swal.fire("Gagal", "Tidak dapat mengupdate data", "error");
  }
});


  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) fetchData(currentPage - 1);
  });

  nextBtn.addEventListener("click", () => {
    fetchData(currentPage + 1);
  });
});
