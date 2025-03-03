// loadset.js

async function loadIkutSetOptions(selectElementId) {
    try {
        const records = await pb.collection('data_barang').getFullList();
        const ikutSetOptions = new Set(); // Menggunakan Set untuk menghindari duplikasi

        records.forEach(record => {
            if (record.ikut_set) {
                ikutSetOptions.add(record.ikut_set);
            }
        });

        const selectIkutSet = document.getElementById(selectElementId);
        selectIkutSet.innerHTML = '<option value="">Pilih Ikut Set</option>'; // Opsi default

        ikutSetOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            selectIkutSet.appendChild(opt);
        });
    } catch (error) {
        console.error('Error loading ikut_set options:', error);
    }
}