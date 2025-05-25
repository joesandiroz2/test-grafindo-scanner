document.addEventListener("DOMContentLoaded", function () {
  const excelInput = document.getElementById("excelFile");
  const tableHead = document.getElementById("excelHead");
  const tableBody = document.getElementById("excelBody");
  const uploadBtn = document.getElementById("uploadDataBtn");

  const requiredColumns = ["kode_depan", "no_do", "tgl_do", "part_number", "nama_barang", "qty", "remarks"];

  // Hide upload button at start
  uploadBtn.style.display = "none";

  // Create progress bar container dynamically (hidden at start)
  const progressContainer = document.getElementById("progress-upload");
  progressContainer.classList.add("progress", "mt-3");
  progressContainer.style.display = "none";
  progressContainer.innerHTML = `
    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" 
      style="width: 0%" aria-valuemin="0" aria-valuemax="100">0%</div>`;
  uploadBtn.parentNode.insertBefore(progressContainer, uploadBtn.nextSibling);

  // PocketBase init
  const pb = new PocketBase(pocketbaseUrl); // Ganti dengan URL PocketBase-mu

  let jsonData = [];

  excelInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

      tableHead.innerHTML = "";
      tableBody.innerHTML = "";
      uploadBtn.style.display = "none";  // sembunyikan dulu tombol upload tiap upload file baru

      if (json.length === 0) {
        alert("File kosong.");
        return;
      }

      const headers = json[0].map(h => h.toString().trim().toLowerCase());
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        alert("Kolom berikut tidak ditemukan di Excel:\n- " + missingColumns.join("\n- "));
        return;
      }

      const headerRow = document.createElement("tr");
      json[0].forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
      });
      tableHead.appendChild(headerRow);

      jsonData = [];
      for (let i = 1; i < json.length; i++) {
        const row = document.createElement("tr");
        const rowObj = {};
        json[0].forEach((key, idx) => {
          const cellValue = json[i][idx] ?? "";
          const td = document.createElement("td");
          td.textContent = cellValue;
          row.appendChild(td);
           const cleanKey = key.toString().trim().toLowerCase();
          let cleanValue = cellValue;
          // Hapus semua spasi untuk kolom tertentu
          if (cleanKey === 'no_do') {
            cleanValue = cellValue.replace(/\s+/g, '');
          } else if (cleanKey === 'part_number') {
            cleanValue = cellValue.replace(/\s+/g, '').toUpperCase();
          }

          rowObj[cleanKey] = cleanValue;
        });
        tableBody.appendChild(row);
        jsonData.push(rowObj);
      }

      // Setelah data valid dan preview tampil, munculkan tombol Upload Excel
      uploadBtn.style.display = "inline-block";
    };
    reader.readAsArrayBuffer(file);
  });

  
  uploadBtn.addEventListener("click", async function () {
  if (jsonData.length === 0) {
    Swal.fire("Gagal", "Silakan upload file Excel terlebih dahulu.", "warning");
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.innerText = "Sedang mengupload...";
  progressContainer.style.display = "block";

  try {
    // Auth user PocketBase
    await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

    let successCount = 0;
    const total = jsonData.length;

    for (let i = 0; i < total; i++) {
      const data = jsonData[i];

      // Simpan ke collection yamaha_do
      await pb.collection('yamaha_do').create(data);

      successCount++;
      const percent = Math.round((successCount / total) * 100);

      // Update progress bar
      const progressBar = progressContainer.querySelector(".progress-bar");
      progressBar.style.width = percent + "%";
      progressBar.textContent = percent + "%";
      progressBar.setAttribute("aria-valuenow", percent);
    }

    await Swal.fire({
      icon: 'success',
      title: 'Upload Do Berhasil!',
      text: `Berhasil mengupload ${successCount} data.`,
      confirmButtonText: 'OK'
    });

    window.location.href = "/yamaha/yamaha_semua_do/yamaha_semua_do.html";

  } catch (error) {
    Swal.fire("Upload Gagal, coba lagi", error.message, "error");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerText = "Upload Excel";
    progressContainer.style.display = "none";
  }
});

});
