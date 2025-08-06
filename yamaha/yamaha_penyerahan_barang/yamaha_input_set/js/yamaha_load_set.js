$(document).ready(async function () {
    await loadSelectOptions(); // Pastikan ini selesai dulu
    $('#selectSet').select2({
        placeholder: "-- Ketik Nama Set --",
        allowClear: true,
        width: '100%'
    });
});


async function loadSelectOptions() {
    const spinner = document.getElementById("spinnerSet");
    const selectElement = document.getElementById("selectSet");

    spinner.style.display = "inline-block";
    selectElement.disabled = true;

    try {
        let page = 1;
        let perPage = 100;
        let totalPages = 1;
        let allItems = [];

        do {
            const response = await fetch(`${pocketbaseUrl}/api/collections/yamaha_unik_nama_set/records?sort=-created&page=${page}&perPage=${perPage}`);
            const data = await response.json();

            const items = data.items || [];
            allItems = allItems.concat(items);
            totalPages = data.totalPages || 1;
            page++;
        } while (page <= totalPages);

        // Clear existing options
        selectElement.innerHTML = '<option value="">-- Pilih Nama Set --</option>';

        // Populate options
        allItems.forEach(record => {
            const option = document.createElement("option");
            option.value = record.ikut_set.trim();
            option.textContent = record.ikut_set.trim();
            selectElement.appendChild(option);
        });

    } catch (err) {
        console.error("Gagal memuat daftar set:", err);
        Swal.fire("Gagal", "Gagal memuat daftar set.", "error");
    } finally {
        spinner.style.display = "none";
        selectElement.disabled = false;
    }
}


