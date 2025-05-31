const pb = new PocketBase(pocketbaseUrl);

let listContainer = document.getElementById("data-list");
const spinner = document.getElementById("loading_data_set");

// Login User
async function authpw() {
  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
  } catch (err) {
    alert("Login gagal: " + err.message);
  } 
}

// Load Data

async function loadData() {
  
  listContainer.innerHTML = "";
  spinner.classList.remove("d-none");

  try {
    await authpw()
    const records = await pb.collection("yamaha_data_barang").getFullList({
      sort: "-created",
       autoCancel: true, 
    });

    let no = 1;  // inisialisasi nomor urut

    records.forEach(item => {
      const row = document.createElement("tr");
      const imageUrl = `${pocketbaseUrl}/api/files/yamaha_data_barang/${item.id}/${item.gambar}`;

      row.innerHTML = `
        <td>${no}</td>
        <td>
          ${item.gambar ? `<img src="${imageUrl}" style="width:100px;height:80px" alt="gambar" />` : '<span class="text-muted">Tidak ada gambar</span>'}
        </td>
        <td>${item.nama_barang}</td>
        <td style="font-weight:bold">${item.part_number}</td>
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
    spinner.classList.add("d-none");

  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Request loadData dibatalkan");
    } else {
      alert("Gagal load data: " + err.message);
    }
     spinner.classList.add("d-none");
  } 
}



// Create Data
async function createData() {
  const btnSave = document.getElementById("btn-save");
  btnSave.disabled = true;
  btnSave.textContent = "Sedang menyimpan...";

  const formData = new FormData();
  formData.append("nama_barang", document.getElementById("nama_barang").value);
  formData.append("part_number", document.getElementById("part_number").value);
  formData.append("ikut_set", getIkutSetValue());
  formData.append("dikalikan", document.getElementById("dikalikan").value);

  const gambarFile = document.getElementById("gambar").files[0];
  if (gambarFile) {
    formData.append("gambar", gambarFile);
  }

  spinner.classList.remove("d-none");
  try {
    await authpw();
    await pb.collection("yamaha_data_barang").create(formData);
    clearForm();
  } catch (err) {
    alert("Gagal tambah data: " + err.message);
  } finally {
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
    await authpw()
    await pb.collection("yamaha_data_barang").delete(id);
    clearForm()
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

   // Tampilkan gambar jika ada
  if (record.gambar) {
    const gambarUrl = pb.files.getUrl(record, record.gambar);
    const preview = document.getElementById("gambar-preview");
    preview.src = gambarUrl;
    preview.style.display = "block"; // pastikan preview terlihat
  }

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

  const formData = new FormData();
  formData.append("nama_barang", document.getElementById("nama_barang").value);
  formData.append("part_number", document.getElementById("part_number").value);
  formData.append("ikut_set", getIkutSetValue());
  formData.append("dikalikan", document.getElementById("dikalikan").value);

  const gambarFile = document.getElementById("gambar").files[0];
  if (gambarFile) {
    formData.append("gambar", gambarFile);
  }

  spinner.classList.remove("d-none");
  try {
    await authpw();
    await pb.collection("yamaha_data_barang").update(id, formData);
    document.getElementById("edit-id").value = "";
    clearForm();
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
  window.location.reload();
}




loadData()
