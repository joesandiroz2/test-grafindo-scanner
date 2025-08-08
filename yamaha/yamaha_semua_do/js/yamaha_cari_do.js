document.addEventListener("DOMContentLoaded", function () {
  const pb = new PocketBase(pocketbaseUrl); // dari pocket_config.js

  const searchBtn = document.getElementById("searchDoBtn");
  const searchInput = document.getElementById("searchDoInput");
  const spinner = document.getElementById("loadingSpinner");
  const tableHead = document.getElementById("doTableHead");
  const tableBody = document.getElementById("doTableBody");

  // Fungsi format tanggal
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

  // Pencarian DO
  searchBtn.addEventListener("click", async function () {
    const searchTerm = searchInput.value.replace(/\s+/g, "");

    if (!searchTerm) {
      Swal.fire("Belum input nomor DO", "Masukkan nomor DO dulu!", "warning");
      return;
    }

    spinner.style.display = "block";
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    try {
      await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
      const resultList = await pb.collection("yamaha_do").getList(1, 50, {
        filter: `no_do ~ "${searchTerm}"`,
      });

      const items = resultList.items;
      if (items.length === 0) {
        tableHead.innerHTML = "";
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Data tidak ditemukan</td></tr>`;
        spinner.style.display = "none";
        return;
      }

      // Header kolom
      tableHead.innerHTML = `
        <tr>
          <th>Tanggal Input</th>
          <th>No DO</th>
          <th>Tgl DO</th>
          <th>Part Number</th>
          <th>Nama Barang</th>
          <th>Qty</th>
          <th>Aksi</th>
        </tr>
      `;

      // Tabel data DO
      tableBody.innerHTML = items
        .map((item) => {
          const createdFormatted = formatDate(item.created);
          return `
            <tr>
              <td>${createdFormatted}</td>
              <td>${item.kode_depan + item.no_do}</td>
              <td>${item.tgl_do}</td>
              <td>${item.part_number}</td>
              <td>${item.nama_barang}</td>
              <td>${item.qty}</td>
              <td>
                <button class="btn btn-sm btn-warning editBtn" data-id="${item.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-danger deleteBtn" data-id="${item.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `;
        })
        .join("");

      // Event listener tombol EDIT
      document.querySelectorAll(".editBtn").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.getAttribute("data-id");
          try {
            const record = await pb.collection("yamaha_do").getOne(id);

            document.getElementById("editId").value = record.id;
            document.getElementById("editKodeDepan").value = record.kode_depan;
            document.getElementById("editNoDo").value = record.no_do;
            document.getElementById("editPartNumber").value = record.part_number;
            document.getElementById("editNamaBarang").value = record.nama_barang;
            document.getElementById("editQty").value = record.qty;
            document.getElementById("editRemarks").value = record.remarks || "";
            document.getElementById("editTglDo").value = record.tgl_do;

            const editModal = new bootstrap.Modal(document.getElementById("editModal"));
            editModal.show();
          } catch (err) {
            Swal.fire("Gagal", "Tidak bisa mengambil data untuk diedit", "error");
          }
        });
      });

      // Event listener tombol DELETE
      document.querySelectorAll(".deleteBtn").forEach((btn) => {
        btn.addEventListener("click", async function () {
          const id = this.getAttribute("data-id");

          const confirmed = await Swal.fire({
            title: "Yakin ingin menghapus?",
            text: "Data DO akan dihapus permanen!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, hapus",
            cancelButtonText: "Batal"
          });

          if (confirmed.isConfirmed) {
            try {
              await pb.collection("yamaha_do").delete(id);
              Swal.fire("Sukses", "Data berhasil dihapus", "success");
              searchBtn.click(); // refresh hasil
            } catch (err) {
              Swal.fire("Error", "Gagal menghapus data", "error");
            }
          }
        });
      });

    } catch (error) {
      console.error("Gagal mencari DO:", error);
      Swal.fire("Error", "Terjadi kesalahan saat mencari DO", "error");
    } finally {
      spinner.style.display = "none";
    }
  });

  // Form Submit Edit
  document.getElementById("editForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    const data = {
      kode_depan: document.getElementById("editKodeDepan").value,
      no_do: document.getElementById("editNoDo").value,
      part_number: document.getElementById("editPartNumber").value,
      nama_barang: document.getElementById("editNamaBarang").value,
      qty: parseInt(document.getElementById("editQty").value),
      remarks: document.getElementById("editRemarks").value,
      tgl_do: document.getElementById("editTglDo").value,
    };

    try {
      await pb.collection("yamaha_do").update(id, data);
      Swal.fire("Sukses", "Data berhasil diperbarui", "success");
      const modal = bootstrap.Modal.getInstance(document.getElementById("editModal"));
      modal.hide();
      searchBtn.click(); // refresh hasil
    } catch (err) {
      Swal.fire("Gagal", "Gagal memperbarui data", "error");
    }
  });
});
