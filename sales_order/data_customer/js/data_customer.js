let pb; // instance global PocketBase
let currentPage = 1;
const perPage = 100;
let totalPages = 1;

// login dulu sebelum query
async function loginUser() {
  try {
    pb = new PocketBase(pocketbaseUrl);
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    console.log("Login sukses");

    // load halaman pertama
    loadCustomers(currentPage);
  } catch (err) {
    console.error("Login gagal:", err);
    Swal.fire("Error", "Login gagal ke PocketBase", "error");
  }
}

// CREATE data
async function addCustomer() {
  const nama = $("#nama_pt").val().trim();
  const alamat = $("#alamat").val().trim();
  const telp = $("#no_telp").val().trim();

  if (!nama) {
    Swal.fire("Oops", "Nama PT harus diisi", "warning");
    return;
  }

  const data = { nama_pt: nama, alamat: alamat, no_telp: telp };

  try {
    await pb.collection("sales_customer").create(data);
    Swal.fire("Sukses", "Customer berhasil ditambahkan", "success");
    $("#nama_pt").val(""); $("#alamat").val(""); $("#no_telp").val("");
    loadCustomers(currentPage); // reload halaman aktif
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal menambah customer", "error");
  }
}

// READ data dengan pagination
async function loadCustomers(page = 1) {
  try {
    $("#customerTableBody").html(`
      <tr><td colspan="5" class="text-center">
        <div class="spinner-border text-primary" role="status"></div> Loading...
      </td></tr>
    `);

    const result = await pb.collection("sales_customer").getList(page, perPage, {
      sort: "-created"
    });

    totalPages = result.totalPages;
    currentPage = result.page;

    if (result.items.length === 0) {
      $("#customerTableBody").html(`<tr><td colspan="5" class="text-center">Belum ada data</td></tr>`);
      $("#paginationControls").html("");
      return;
    }

    let html = "";
    result.items.forEach((cust, idx) => {
      const nomor = (page - 1) * perPage + (idx + 1); // nomor urut global
      html += `
        <tr>
          <td>${nomor}</td>
          <td style="white-space:pre-wrap">${cust.nama_pt || ""}</td>
          <td style="white-space:pre-wrap">${cust.alamat || ""}</td>
          <td>${cust.no_telp || ""}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="editCustomer('${cust.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${cust.id}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    });
    $("#customerTableBody").html(html);

    // Pagination UI
    $("#paginationControls").html(`
      <div class="d-flex justify-content-between align-items-center">
        <button class="btn btn-sm btn-secondary" ${currentPage <= 1 ? "disabled" : ""} onclick="loadCustomers(${currentPage - 1})">Previous</button>
        <span>Halaman ${currentPage} dari ${totalPages}</span>
        <button class="btn btn-sm btn-secondary" ${currentPage >= totalPages ? "disabled" : ""} onclick="loadCustomers(${currentPage + 1})">Next</button>
      </div>
    `);

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal memuat data customer", "error");
  }
}

// UPDATE data
async function editCustomer(id) {
  try {
    const record = await pb.collection("sales_customer").getOne(id);

    const { value: formValues } = await Swal.fire({
      title: "Edit Customer",
      html: `
        <label class="swal2-label">Nama PT</label>
        <textarea id="swal-nama" style="height:120px">${record.nama_pt || ""}</textarea>
        <br/>
        <label class="swal2-label">Alamat</label>
        <textarea id="swal-alamat" style="height:120px">${record.alamat || ""}</textarea>
        <br/>
        
        <label class="swal2-label">No Telp</label>
        <input id="swal-telp" placeholder="No Telp" value="${record.no_telp || ""}">
      `,
      focusConfirm: false,
      preConfirm: () => ({
        nama_pt: document.getElementById("swal-nama").value.trim(),
        alamat: document.getElementById("swal-alamat").value.trim(),
        no_telp: document.getElementById("swal-telp").value.trim()
      })
    });

    if (formValues) {
      if (!formValues.nama_pt) {
        Swal.fire("Oops", "Nama PT tidak boleh kosong", "warning");
        return;
      }
      await pb.collection("sales_customer").update(id, formValues);
      Swal.fire("Sukses", "Customer berhasil diupdate", "success");
      loadCustomers(currentPage);
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal mengambil atau mengupdate data", "error");
  }
}

// DELETE data
async function deleteCustomer(id) {
  const confirm = await Swal.fire({
    title: "Yakin hapus?",
    text: "Data customer akan dihapus permanen",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal"
  });

  if (confirm.isConfirmed) {
    try {
      await pb.collection("sales_customer").delete(id);
      Swal.fire("Terhapus!", "Customer berhasil dihapus", "success");
      loadCustomers(currentPage);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal hapus customer", "error");
    }
  }
}

// expose ke window
window.addCustomer = addCustomer;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;


loginUser()