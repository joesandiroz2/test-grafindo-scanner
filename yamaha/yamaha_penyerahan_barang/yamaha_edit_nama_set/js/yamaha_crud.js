const pb = new PocketBase(pocketbaseUrl);

let listContainer = document.getElementById("data-list");
const spinner = document.getElementById("loading");

// Login User
async function authpw() {
  try {
    spinner.classList.remove("d-none");
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    loadData();  // Panggil load data setelah login sukses
  } catch (err) {
    alert("Login gagal: " + err.message);
  } finally {
    spinner.classList.add("d-none");
  }
}

// Load Data

async function loadData() {
  
  listContainer.innerHTML = "";
  spinner.classList.remove("d-none");

  try {
    const records = await pb.collection("yamaha_data_barang").getFullList({
      sort: "-created",
       autoCancel: true, 
    });

    let no = 1;  // inisialisasi nomor urut

    records.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${no}</td>
        <td>${item.nama_barang}</td>
        <td style="font-weight:bold">${item.part_number}-00-80</td>
        <td style="font-weight:bold">${item.ikut_set}</td>
        <td>${item.dikalikan}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editData('${item.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteData('${item.id}')">Delete</button>
        </td>
      `;
      listContainer.appendChild(row);
      no++;  // naikkan nomor urut
    });
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Request loadData dibatalkan");
    } else {
      alert("Gagal load data: " + err.message);
    }
  } finally {
    spinner.classList.add("d-none");
  }
}



// Create Data
async function createData() {
   const btnSave = document.getElementById("btn-save");
  btnSave.disabled = true;
  btnSave.textContent = "Sedang menyimpan...";

  const data = {
    nama_barang: document.getElementById("nama_barang").value,
    part_number: document.getElementById("part_number").value,
    ikut_set: getIkutSetValue(),
    dikalikan: document.getElementById("dikalikan").value,
  };

  spinner.classList.remove("d-none");
  try {
    authpw()
    await pb.collection("yamaha_data_barang").create(data);
    clearForm()
    loadData();
  } catch (err) {
    alert("Gagal tambah data: " + err.message);
  } finally {
    spinner.classList.add("d-none");
    spinner.classList.add("d-none");
    btnSave.disabled = false;
    btnSave.textContent = "Simpan";
  }
}

// Delete Data
async function deleteData(id) {
  if (!confirm("Yakin ingin menghapus data ini?")) return;

  spinner.classList.remove("d-none");
  try {
    authpw()
    await pb.collection("yamaha_data_barang").delete(id);
    clearForm()
    loadData();
  } catch (err) {
    alert("Gagal hapus data: " + err.message);
  } finally {
    spinner.classList.add("d-none");
  }
}

// Edit Data
async function editData(id) {
  await authpw();
  const record = await pb.collection("yamaha_data_barang").getOne(id);

  document.getElementById("nama_barang").value = record.nama_barang;
  document.getElementById("part_number").value = record.part_number;
  document.getElementById("dikalikan").value = record.dikalikan;
  document.getElementById("edit-id").value = id;

  // Cek apakah record.ikut_set ada di salah satu option dari select
  const select = document.getElementById("ikut_set_select");
  const input = document.getElementById("ikut_set_input");
  const checkbox = document.getElementById("manualCheckbox");
  const options = Array.from(select.options).map(opt => opt.value);

  if (options.includes(record.ikut_set)) {
    // Gunakan select
    select.value = record.ikut_set;
    checkbox.checked = false;
  } else {
    // Gunakan input manual
    input.value = record.ikut_set;
    checkbox.checked = true;
  }

  toggleManualInput(); // tampilkan elemen sesuai mode
}


// Update Data
async function updateData() {
  const btnSave = document.getElementById("btn-save");
  btnSave.disabled = true;
  btnSave.textContent = "Sedang menyimpan...";

  const id = document.getElementById("edit-id").value;
  if (!id) {
    createData();
    return;
  }

  const data = {
    nama_barang: document.getElementById("nama_barang").value,
    part_number: document.getElementById("part_number").value,
    ikut_set:getIkutSetValue(),
    dikalikan: document.getElementById("dikalikan").value,
  };

  spinner.classList.remove("d-none");
  try {
    await pb.collection("yamaha_data_barang").update(id, data);
    document.getElementById("edit-id").value = "";
    clearForm()
    loadData();
  } catch (err) {
    alert("Gagal update data: " + err.message);
  } finally {
    spinner.classList.add("d-none");
     btnSave.disabled = false;
    btnSave.textContent = "Simpan";
  }
}


// Ambil nilai dari select/input tergantung mode
function getIkutSetValue() {
  const isManual = document.getElementById("manualCheckbox").checked;
  return isManual ? document.getElementById("ikut_set_input").value : document.getElementById("ikut_set_select").value;
}


function clearForm() {
  document.getElementById("nama_barang").value = "";
  document.getElementById("part_number").value = "";
  document.getElementById("ikut_set_input").value = "";
  document.getElementById("ikut_set_select").value = "";
  document.getElementById("dikalikan").value = "";
  document.getElementById("edit-id").value = "";
  
  // Reset checkbox dan tampilkan select (default mode)
  document.getElementById("manualCheckbox").checked = false;
  toggleManualInput(); // agar tampilan ikut_set kembali ke select
}



loadData()
