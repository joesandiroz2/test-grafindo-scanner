const uploadBtn = document.getElementById("uploadBtn");
const excelFile = document.getElementById("excelFile");
const progressContainer = document.querySelector(".progress");
const progressBar = document.getElementById("progressBar");

const requiredColumns = ["part_number", "nama_barang", "qty", "po_no"]; // Kolom Excel wajib

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
    const noDoInput = document.getElementById("no_do_input").value.trim();

    // ambil nilai kode depan
    let kodeDepan;
    const manualChecked = document.getElementById("manual_kode").checked;
    if (manualChecked) {
        kodeDepan = document.getElementById("kode_manual").value.trim();
    } else {
        kodeDepan = document.getElementById("kode_select").value;
    }

    const merk = document.getElementById("merk_select").value;

    // Validasi input
    let missingInputs = [];
    if (!noDoInput) missingInputs.push("No DO");
    if (!kodeDepan) missingInputs.push("Kode Depan");
    if (!merk) missingInputs.push("Merk");
    if (!excelFile.files.length) missingInputs.push("File Excel");

    if (missingInputs.length) {
        Swal.fire("Peringatan", `Harap isi / pilih: ${missingInputs.join(", ")}`, "warning");
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

        // Tambahkan no_do, kode_depan, merk ke setiap baris
        data = data.map(row => {
            let part = (row.part_number || "").toString();
            part = part.replace(/\s+/g, "").toUpperCase(); // hilangkan spasi & jadikan huruf besar
            return {
                ...row,
                part_number: part,
                no_do: noDoInput,
                kode_depan: kodeDepan,
                merk: merk
            };
        });

        // ---- proses upload per baris ----
        const total = data.length;
        let successCount = 0;

        for (let i = 0; i < total; i++) {
            try {
                await pb.collection("dian_scan").create(data[i]);
                successCount++;
            } catch (err) {
                console.error("Gagal upload:", data[i], err);
            }

            // update progress
            let percent = Math.round(((i + 1) / total) * 100);
            progressBar.style.width = percent + "%";
            progressBar.innerText = percent + "%";
        }

        Swal.fire("Sukses", `${successCount} data berhasil diupload!`, "success");
        location.reload()
    } catch (err) {
        console.error("Error upload:", err);
        Swal.fire("Error", "Terjadi kesalahan saat upload", "error");
    }

    uploadBtn.disabled = false;
    uploadBtn.innerText = "Upload";
    progressContainer.style.display = "none";
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
