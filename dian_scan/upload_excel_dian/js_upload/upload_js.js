const uploadBtn = document.getElementById("uploadBtn");
const excelFile = document.getElementById("excelFile");
const progressContainer = document.querySelector(".progress");
const progressBar = document.getElementById("progressBar");



// Kolom yang dibutuhkan
const requiredColumns = ["no_do", "part_number", "nama_barang", "qty", "po_no","merk","kode_depan"];

// Login user PocketBase
async function loginPocketBase() {
    try {
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("Login sukses!");
    } catch (err) {
        console.error("Login gagal:", err);
        Swal.fire("Error", "Gagal login ke PocketBase", "error");
        throw err;
    }
}

uploadBtn.addEventListener("click", async () => {
    if (!excelFile.files.length) {
        Swal.fire("Peringatan", "Silakan pilih file Excel terlebih dahulu", "warning");
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.innerText = "Sedang Mengupload...";
    progressContainer.style.display = "block";

    const file = excelFile.files[0];
    let data;

    try {
        await loginPocketBase();
        data = await readExcel(file);
    } catch (err) {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "Upload";
        progressContainer.style.display = "none";
        return;
    }

    // cek kolom yang kurang
    const fileColumns = Object.keys(data[0] || {});
    const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));
    if (missingColumns.length) {
        Swal.fire("Kolom Hilang", `Kolom berikut tidak ada: ${missingColumns.join(", ")}`, "error");
        uploadBtn.disabled = false;
        uploadBtn.innerText = "Upload";
        progressContainer.style.display = "none";
        return;
    }

    // Mulai upload
    let successCount = 0;
    for (let i = 0; i < data.length; i++) {
        try {
            await pb.collection("dian_scan").create(data[i]);
            successCount++;
        } catch (err) {
            console.error("Gagal upload:", err);
        }

        // Update progress bar
        const percent = Math.round(((i + 1) / data.length) * 100);
        progressBar.style.width = percent + "%";
        progressBar.innerText = `${percent}%`;
    }

    uploadBtn.disabled = false;
    uploadBtn.innerText = "Upload";

    if (successCount === data.length) {
        Swal.fire("Sukses", "Semua data berhasil diupload", "success");
    } else {
        Swal.fire("Gagal", `${data.length - successCount} data gagal diupload`, "error");
    }
});

// Fungsi membaca Excel
function readExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            resolve(json);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}
