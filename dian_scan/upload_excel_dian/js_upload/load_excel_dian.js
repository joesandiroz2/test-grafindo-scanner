let currentPage = 1;
let perPage = 100; // jumlah baris per halaman

async function loadDianScanData(page = 1) {
  try {
    // login sekali aja kalau belum
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil data paginated
    const result = await pb.collection("dian_scan").getList(page, perPage, {
      sort: "-created",
    });
    console.log(result);

    let tbody = $("#tbl_data_excel tbody");
    tbody.empty(); // clear biar gak numpuk

    if (result.items.length === 0) {
      tbody.append(`
        <tr>
          <td colspan="7" class="text-center">Tidak ada data.</td>
        </tr>
      `);
    } else {
      result.items.forEach(item => {
        let row = `
          <tr>
            <td>${item.kode_depan}${item.no_do}</td>
            <td>${item.part_number}</td>
            <td>${item.nama_barang}</td>
            <td>${item.qty}</td>
            <td>${item.po_no}</td>
            <td>${item.merk}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Delete</button>
            </td>
          </tr>
        `;
        tbody.append(row);
      });
    }

    // bind tombol edit
    $(".edit-btn").click(function () {
      let id = $(this).data("id");
      editRecord(id);
    });

    // bind tombol delete
    $(".delete-btn").click(function () {
      let id = $(this).data("id");
      deleteRecord(id);
    });

    renderPagination(result.page, result.totalPages);

  } catch (err) {
    console.error("Error load data:", err);
    alert("Gagal load data dari PocketBase!");
  }
}

function renderPagination(current, total) {
  let pagination = $("#pagination");
  pagination.empty();

  // tombol prev
  let prevDisabled = current === 1 ? "disabled" : "";
  pagination.append(`
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" data-page="${current - 1}">Previous</a>
    </li>
  `);

  // info halaman (tanpa tombol)
  pagination.append(`
    <li class="page-item disabled">
      <a class="page-link">Halaman ${current} dari ${total}</a>
    </li>
  `);

  // tombol next
  let nextDisabled = current === total ? "disabled" : "";
  pagination.append(`
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" data-page="${current + 1}">Next</a>
    </li>
  `);

  // event klik
  $("#pagination a").click(function (e) {
    e.preventDefault();
    let page = parseInt($(this).data("page"));
    if (!isNaN(page) && page >= 1 && page <= total) {
      currentPage = page;
      loadDianScanData(page);
    }
  });
}

// fungsi delete
// fungsi delete pakai SweetAlert2
async function deleteRecord(id) {
  Swal.fire({
    title: 'Yakin hapus data ini?',
    text: "Data yang dihapus tidak bisa dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await pb.collection("dian_scan").delete(id);

        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Data berhasil dihapus.',
          timer: 1500,
          showConfirmButton: false
        });

        // cek ulang data di halaman ini
        const res = await pb.collection("dian_scan").getList(currentPage, perPage, { sort: "-created" });
        if (res.items.length === 0 && currentPage > 1) {
          // kalau halaman kosong setelah delete, mundur 1 halaman
          currentPage--;
        }
        loadDianScanData(currentPage);

      } catch (err) {
        console.error("Error delete:", err);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Gagal menghapus data!'
        });
      }
    }
  });
}


let editModal; 

// inisialisasi bootstrap modal
document.addEventListener("DOMContentLoaded", () => {
  editModal = new bootstrap.Modal(document.getElementById('editModal'));
});

async function editRecord(id) {
  try {
    const record = await pb.collection("dian_scan").getOne(id);

    // isi field modal
    $("#edit-id").val(record.id);
    $("#edit-no_do").val(record.no_do || "");
    $("#edit-kode_depan").val(record.kode_depan || "");
    $("#edit-part_number").val(record.part_number || "");
    $("#edit-nama_barang").val(record.nama_barang || "");
    $("#edit-qty").val(record.qty || "");
    $("#edit-po_no").val(record.po_no || "");
    $("#edit-merk").val(record.merk || "");

    // tampilkan modal
    editModal.show();

  } catch (err) {
    console.error("Error ambil data:", err);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Gagal mengambil data untuk edit!"
    });
  }
}

$("#saveEditBtn").click(async function () {
  const id = $("#edit-id").val();
  const data = {
    no_do: $("#edit-no_do").val(),
    kode_depan: $("#edit-kode_depan").val(),
    part_number: $("#edit-part_number").val(),
    nama_barang: $("#edit-nama_barang").val(),
    qty: $("#edit-qty").val(),
    po_no: $("#edit-po_no").val(),
    merk: $("#edit-merk").val(),
  };

  try {
    await pb.collection("dian_scan").update(id, data);

    Swal.fire({
      icon: "success",
      title: "Tersimpan!",
      text: "Data berhasil diperbarui.",
      timer: 1500,
      showConfirmButton: false
    });

    editModal.hide();
    loadDianScanData(currentPage); // reload tabel

  } catch (err) {
    console.error("Error update:", err);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Gagal memperbarui data!"
    });
  }
});



//pencarian

// fungsi pencarian DO
async function searchDo() {
  const keyword = $("#search_do").val().trim();

  if (!keyword) {
    Swal.fire("Peringatan", "Masukkan nomor DO untuk mencari", "warning");
    return;
  }

  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // kalau input berupa angka saja (Yamaha: cukup angka, ex: 123)
    let filterQuery;
    if (/^\d+$/.test(keyword)) {
      filterQuery = `no_do ~ "${keyword}"`; 
    } else {
      // untuk Honda (harus persis, misal DOA-123)
      filterQuery = `no_do = "${keyword}"`; 
    }

    const result = await pb.collection("dian_scan").getList(1, perPage, {
      filter: filterQuery,
      sort: "-created",
    });

    let tbody = $("#tbl_data_excel tbody");
    tbody.empty();

    if (result.items.length === 0) {
      tbody.append(`
        <tr>
          <td colspan="7" class="text-center">Data tidak ditemukan.</td>
        </tr>
      `);
    } else {
      result.items.forEach(item => {
        let row = `
          <tr>
            <td>${item.kode_depan}${item.no_do}</td>
            <td>${item.part_number}</td>
            <td>${item.nama_barang}</td>
            <td>${item.qty}</td>
            <td>${item.po_no}</td>
            <td>${item.merk}</td>
            <td>
              <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Delete</button>
            </td>
          </tr>
        `;
        tbody.append(row);
      });
    }

  } catch (err) {
    console.error("Error pencarian:", err);
    Swal.fire("Error", "Gagal mencari data DO", "error");
  }
}

// event klik tombol cari
$("#btnCari").click(searchDo);

// event enter di input
$("#search_do").keypress(function(e) {
  if (e.which === 13) {
    searchDo();
  }
});


// load awal
loadDianScanData(currentPage);
