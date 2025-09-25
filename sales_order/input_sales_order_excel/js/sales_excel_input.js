

// --- Login user PocketBase ---
async function loginPocketBase() {
  if (!pb.authStore.isValid) {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    console.log("✅ Berhasil login PocketBase");
  }
}

// Kolom wajib
const requiredCols = ["part_number", "nama_barang", "qty", "unit_price", "no_po", "sales"];

let parsedData = [];

// --- Helper format tanggal dari Excel ---
function formatExcelDate(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return value;
}

// --- Baca Excel ---
document.getElementById("excelFile").addEventListener("change", handleFile, false);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "", raw: false });

    parsedData = jsonData.map(row => {
      const newRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
        let val = row[key];
        
        newRow[normalizedKey] = val;
      });
      return newRow;
    });

    const fileCols = Object.keys(parsedData[0] || {});
    const missingCols = requiredCols.filter((col) => !fileCols.includes(col));

    if (missingCols.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Kolom Tidak Lengkap",
        html: `Kolom berikut tidak ditemukan di file:<br><b>${missingCols.join(", ")}</b>`
      });
      return;
    }

    renderPreview(parsedData);
    document.getElementById("uploadBtn").disabled = false;
  };
  reader.readAsArrayBuffer(file);
}

// --- Render preview ke tabel ---
function renderPreview(data) {
  const tbody = document.querySelector("#previewTable tbody");
  tbody.innerHTML = "";

  data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.part_number || ""}</td>
      <td>${row.nama_barang || ""}</td>
      <td>${row.qty || ""}</td>
      <td>${row.unit_price || ""}</td>
      <td>${row.no_po || ""}</td>
      <td>${row.tgl_schedule || ""}</td>
      <td>${row.sales || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Generate Nomor SO ---
// --- Generate Nomor SO Unik ---
async function generateNoSO() {
  // Ambil bulan dari input
  const bulanInput = document.getElementById("bulan_do").value;
  let year, month;

  if (bulanInput) {
    [year, month] = bulanInput.split("-");
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = String(now.getMonth() + 1).padStart(2, "0");
  }

  const yy = String(year).slice(-2);
  const mm = String(month).padStart(2, "0");

  // Ambil record terakhir untuk bulan tsb
  const records = await pb.collection("sales_order").getList(1, 1, {
    sort: "-created",
    filter: `no_so ~ "${yy}${mm}"`
  });

  let lastNumber = 0;
  if (records.items.length > 0) {
    const lastNoSo = records.items[0].no_so || "";
    const regex = new RegExp(`SO-${yy}${mm}(\\d+)`);
    const match = lastNoSo.match(regex);
    if (match) {
      lastNumber = parseInt(match[1], 10);
    }
  }

  let newNumber = lastNumber + 1;
  let candidate = "";

  // LOOP sampai ketemu nomor yang belum ada
  while (true) {
    candidate = `SO-${yy}${mm}${String(newNumber).padStart(5, "0")}`;
    const exists = await pb.collection("sales_order").getFirstListItem(`no_so="${candidate}"`).catch(() => null);
    if (!exists) break; // kalau belum ada → aman dipakai
    newNumber++; // kalau ada → tambah 1 lagi
  }

  return candidate;
}



// --- Upload ke PocketBase ---
document.getElementById("uploadBtn").addEventListener("click", async () => {
  if (parsedData.length === 0) return;

   // 🔒 Disable tombol upload biar tidak bisa dobel klik
  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.disabled = true;
  uploadBtn.textContent  = "sedang memproses....."

  // Login dulu
  try {
    await loginPocketBase();
  } catch (err) {
    Swal.fire("Error", "Gagal login ke PocketBase", "error");
    return;
  }

  uploadBtn.textContent  = "sedang mendapatkan nomor urut"

  // Generate nomor SO baru
  const noSOBaru = await generateNoSO();

 // Ambil input tanggal schedule
  const tglInput = document.getElementById("tgl_input_schedule").value;
    if (!tglInput) {
      Swal.fire("Pilih Tanggal", "Anda harus pilih tanggal schedule terlebih dahulu", "warning");
      return;
    }
    const tglSchedule = new Date(tglInput).toISOString(); // format timestamp string

    // Ambil kode depan
    const kodeDepan = document.getElementById("kode_depan_do").value;
    if (!kodeDepan) {
      Swal.fire("Pilih Kode Depan", "Anda harus pilih kode depan terlebih dahulu", "warning");
      return;
    }

    const customerId = document.getElementById("customerSelect").value;
  if (!customerId) {
    Swal.fire("Pilih Customer", "Anda harus pilih customer terlebih dahulu", "warning");
    return;
  }

  Swal.fire({
  title: `Konfirmasi Upload , No SO anda ${noSOBaru}.`,
  text: `No SO anda ${noSOBaru}. Anda yakin ingin mengupload ${parsedData.length} data ke PocketBase?`,
  icon: "question",
  showCancelButton: true,
  confirmButtonText: "Ya, upload",
  cancelButtonText: "Batal",
  allowOutsideClick: false,
  allowEscapeKey: false,
  showCloseButton: true
}).then(async (result) => {
  if (result.isDismissed) {
    // Kalau user close (X) atau klik cancel → jangan upload sama sekali
    console.log("❌ Upload dibatalkan atau modal ditutup.");
      uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload Data ke database";
    return;
  }

  if (result.isConfirmed) {
    // ✅ hanya masuk sini kalau user klik "Ya, upload"
    document.querySelector(".progress").style.display = "block";
    const progressBar = document.getElementById("uploadProgress");

    let successCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];

      const data = {
        part_number: row.part_number,
        nama_barang: row.nama_barang,
        qty: row.qty,
        unit_price: row.unit_price,
        no_po: row.no_po,
        tgl_schedule: tglSchedule,
        no_so: noSOBaru,  
        no_io: `IO-${noSOBaru.slice(3)}`,
        no_do: `${kodeDepan}-${noSOBaru.slice(3)}`,
        shipped: "",
        back_order: "",
        sales: row.sales,
        kode_depan: kodeDepan,
        customer_id: customerId || null,
        is_batal: ""   // default kosong, bukan "batal"
      };

      try {
        await pb.collection("sales_order").create(data);
        successCount++;
      } catch (err) {
        console.error("❌ Gagal upload row:", row, err);
      }

      const percent = Math.round(((i + 1) / parsedData.length) * 100);
      progressBar.style.width = `${percent}%`;
      progressBar.innerText = `${percent}%`;
    }

    Swal.fire({
      icon: "success",
      title: "Upload Selesai",
      text: `${successCount} dari ${parsedData.length} data berhasil diupload.`,
    });

    // reset
    parsedData = [];
    document.querySelector("#previewTable tbody").innerHTML = "";
    document.getElementById("uploadBtn").disabled = true;
    document.getElementById("excelFile").value = "";
    document.querySelector(".progress").style.display = "none";
    progressBar.style.width = "0%";
    progressBar.innerText = "0%";
     uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload";
  }
});

});


// select search customer

// Ambil list customer dan render ke Select2
async function loadCustomerList() {
  try {
    await loginPocketBase();
    const records = await pb.collection("sales_customer").getFullList({
      sort: "nama_pt"
    });

    const $select = $("#customerSelect");
    $select.empty();

    records.forEach(cust => {
      $select.append(new Option(`${cust.nama_pt} - ${cust.alamat}`, cust.id));
    });

    $select.select2({
      placeholder: "Cari Customer...",
      allowClear: true
    });
  } catch (err) {
    console.error("❌ Gagal load customer", err);
  }
}

$(document).ready(function () {
  loadCustomerList();
});