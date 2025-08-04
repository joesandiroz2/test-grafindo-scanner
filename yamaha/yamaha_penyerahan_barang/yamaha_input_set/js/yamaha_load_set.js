document.addEventListener("DOMContentLoaded", async () => {
    await loadSelectOptions();
});

async function loadSelectOptions() {
    const spinner = document.getElementById("spinnerSet");
    const selectElement = document.getElementById("selectSet");

    spinner.style.display = "inline-block"; // tampilkan spinner
    selectElement.disabled = true; // disable saat loading

    try {
        const response = await fetch(pocketbaseUrl + "/api/collections/yamaha_unik_nama_set/records?sort=-created&perPage=150");
        const data = await response.json();

        const namaSetRecords = data.items || data;

        selectElement.innerHTML = '<option value="">-- Pilih Nama Set --</option>';

        namaSetRecords.forEach(record => {
            const option = document.createElement("option");
            option.value = record.ikut_set.trim();
            option.textContent = record.ikut_set.trim();
            selectElement.appendChild(option);
        });
    } catch (err) {
        console.error("Gagal memuat daftar set:", err);
        Swal.fire("Gagal", "Gagal memuat daftar set.", "error");
    } finally {
        spinner.style.display = "none"; // sembunyikan spinner
        selectElement.disabled = false;
    }
}
