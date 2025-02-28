
const pb = new PocketBase(pocketbaseUrl);

export async function searchKartuStok(noDn) {
const scannedItemsContainer = $("#scanned-items-container"); // New container for scanned items
 const resultContainer = $("#result-container");

function formatDate(isoString) {
    const date = new Date(isoString);
    
    const day = date.getDate();
    const month = date.toLocaleString('id-ID', { month: 'short' }).replace(/\./g, '');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0'); // Tambahkan nol di depan jika perlu
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

try {
    scannedItemsContainer.empty()
    // Mengambil data dari collection kartu_stok
    const records = await pb.collection('kartu_stok').getFullList({
        filter: `no_dn="${noDn}"`
    });
    console.log("Recors stok",noDn)

   if (records.length > 0) {
    let scannedList = `
        <h6>Data yg udah di scan :</h6>
        <ul class="collection" style="background-color: green; color: white; padding: 10px; border-radius: 5px;">
    `;
    records.forEach((item, index) => {
        scannedList += `
            <li style="background-color: green; border-bottom: 2px solid white; color: white; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-evenly; align-items: center;">
                <span ><b>${index + 1}. ${item.nama_barang}</b> </span>
            <p class="card" style="color:black">🛒 ${item.qty_ambil}</p>
             <p class="card" style="color:black">⏰ ${formatDate(item.created)}</p>
                <span class="card" style="color: green; font-weight: bold; padding: 3px 8px; border-radius: 3px;">✅ Success</span>
            </li>
        `;
    });


            scannedList += '</ul>';
            scannedItemsContainer.append(scannedList);

        // Memutar suara sudah diproses
        const audio = document.getElementById('scan-audio');
        audio.src = './suara/sudah_proses.mp3';
        audio.load();
        audio.play();
    } else {
        // Jika tidak ada data, tampilkan pesan
        resultContainer.append('<h6>Belum di proses.</h6>');
        const audio = document.getElementById('scan-audio');
        audio.src = './suara/belum_proses.mp3';
        audio.load();
        audio.play();
    }
} catch (error) {
    console.log(error);
    resultContainer.append('<h6>Terjadi error saat pencarian kartu stok, harap coba lagi.</h6>');
}
}
