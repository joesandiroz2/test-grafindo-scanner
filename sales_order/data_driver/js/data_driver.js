
const pb = new PocketBase(pocketbaseUrl);

// fungsi login global
async function loginUser() {
  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    console.log("Login sukses");
  } catch (err) {
    console.error("Login gagal:", err);
    Swal.fire("Error", "Gagal login ke server", "error");
  }
}

$(document).ready(function () {
  // Load navbar + login
  $("#navbar-container").load("../../component/nav.html", async function () {
    await loginUser();
    loadDrivers();
  });

  // Create Driver
  $("#formDriver").on("submit", async function (e) {
    e.preventDefault();
    const nama = $("#nama").val();

    try {
      await pb.collection("sales_order_driver").create({ nama });
      Swal.fire("Sukses", "Driver berhasil ditambahkan", "success");
      $("#formDriver")[0].reset();
      loadDrivers();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal menambahkan driver", "error");
    }
  });

  // Update Driver
  $("#formEditDriver").on("submit", async function (e) {
    e.preventDefault();
    const id = $("#edit_id").val();
    const nama = $("#edit_nama").val();

    try {
      await pb.collection("sales_order_driver").update(id, { nama });
      Swal.fire("Sukses", "Driver berhasil diperbarui", "success");
      $("#editModal").modal("hide");
      loadDrivers();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Gagal update driver", "error");
    }
  });
});

// Load Data
async function loadDrivers() {
  try {
    const records = await pb.collection("sales_order_driver").getFullList({
      sort: "-created"
    });

    let tbody = $("#tbl_driver tbody");
    tbody.empty();

    records.forEach((row, i) => {
      tbody.append(`
        <tr>
          <td>${i + 1}</td>
          <td>${row.nama}</td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="editDriver('${row.id}', '${row.nama}')">
              <i class="bi bi-pencil-square"></i> Edit
            </button>
          </td>
        </tr>
      `);
    });
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal load data driver", "error");
  }
}

// Isi modal edit
function editDriver(id, nama) {
  $("#edit_id").val(id);
  $("#edit_nama").val(nama);
  $("#editModal").modal("show");
}

