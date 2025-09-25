
async function loadHistoryKeluar() {
    const container = document.getElementById("tbl_permintaan_keluar");

    // tampilkan preloader dulu
    container.innerHTML = `
        <p style="color:purple;font-weight:bold">Sedang mencari data keluar...</p>
    `;

    try {
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

        // Ambil data dari PocketBase dengan sort -created
        const records = await pb.collection("yamaha_kartu_stok").getList(1, 50, {
              filter: 'status = "keluar"',
            sort: "-created"
        });

        // render data → otomatis ganti preloader
        renderHistoryTable(records.items);
    } catch (error) {
        console.error("Gagal ambil history keluar:", error);
        container.innerHTML = `<p style="color:red">Gagal memuat history keluar</p>`;
    }
}


function renderHistoryTable(data) {
    const container = document.getElementById("tbl_permintaan_keluar");

    if (!data || data.length === 0) {
        container.innerHTML = `<p style="color:red">Belum ada data keluar</p>`;
        return;
    }

    let html = `
        <table class="table table-bordered table-striped">
            <thead class="thead-dark">
                <tr>
                    <th>No DO/pb</th>
                    <th>Part Number</th>
                    <th>Nama Barang</th>
                    <th>Qty Keluar</th>
                    <th>Lot</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(item => {
        html += `
            <tr>
                <td><p style="color:red;font-weight:bold">${item.kode_depan} ${item.no_do}</p></td>
                <td><p style="font-weight:bold">${item.part_number || ""}</p></td>
                <td>${item.nama_barang || ""}</td>
                <td><p style="color:red;font-weight:bold">${item.qty_scan }</p></td>
                <td>${item.lot || ""}</td>
                <td>${formatDate(item.created)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function formatDate(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d; // selisih dalam ms
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Kalau kurang dari 1 menit
    if (diffMin < 1) {
        return "Barusan";
    }
    // Kalau < 1 jam
    if (diffHour < 1) {
        return `${diffMin} menit lalu`;
    }
    // Kalau < 24 jam
    if (diffDay < 1) {
        return `${diffHour} jam lalu`;
    }

    // Kalau lebih dari 1 hari → tampilkan tanggal lengkap
    const day = String(d.getDate()).padStart(2, "0");

    // Nama bulan dalam bahasa Indonesia
    const bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const monthName = bulan[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day} ${monthName} ${year} ${hours}:${minutes}`;
}


// Auto load saat halaman ready
document.addEventListener("DOMContentLoaded", loadHistoryKeluar);
