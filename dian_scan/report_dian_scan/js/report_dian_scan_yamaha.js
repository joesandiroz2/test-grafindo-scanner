let currentPageYamaha = 1;
const perPageYamaha = 15;

async function loadYamahaOthers(page = 1) {
    try {
        // login sekali

        const container = $("#yamaha_others");
        container.empty();

        // Yamaha (sementara tidak pakai progress bar, bisa ditambah nanti)
        const doListYamaha = await pb.collection("yamaha_kartu_stok").getList(page, perPageYamaha, {
            filter: `budian="budian"`,
            sort: "-created"
        });

        console.log(doListYamaha)
        const totalPages = doListYamaha.totalPages;
        // kalau mau ada pagination Yamaha → bisa tambahkan element seperti Honda
        // $("#page_info_yamaha").text(`Halaman ${page} dari ${totalPages}`);

        // ambil semua DO unik
        const doNumbers = [...new Set(doListYamaha.items.map(item => item.no_do || "unknown"))];

        for (let i = 0; i < doNumbers.length; i++) {
            const doNumber = doNumbers[i];

            const doData = await pb.collection("yamaha_kartu_stok").getFullList({
                filter: `no_do="${doNumber}"`,
                sort: "-created"
            });

            // grouping per part_number
            const groupedData = {};
            doData.forEach(item => {
                const part = item.part_number || "unknown";
                if (!groupedData[part]) {
                    groupedData[part] = {
                        no_do: doNumber,
                        part_number: part,
                        nama_barang: item.nama_barang,
                        qty: parseInt(item.qty_scan || 0, 10),
                        total_scan: 1
                    };
                } else {
                    groupedData[part].total_scan += 1;
                }
            });
            const kodeDepan = doData.length > 0 ? (doData[0].kode_depan || "") : "";

            // card per DO
            container.append(`<div class="card shadow mb-3 p-2">
                                <h5 style="font-weight:bold">DO: ${kodeDepan} ${doNumber}</h5>
                              </div>`);

            let table = `<table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Part No</th>
                                    <th>Barang</th>
                                    <th>Qty</th>
                                    <th>Total Scan</th>
                                </tr>
                            </thead>
                            <tbody>`;

            let no = 1;
            for (const part in groupedData) {
                const item = groupedData[part];
                let fullText = "";
                if (item.total_scan === item.qty) {
                    fullText = `<span style="color:green;font-weight:bold"> Full</span>`;
                }else{
                    fullText = `<span style="color:red;font-weight:bold"> Not Full</span>`;
                }

                table += `<tr>
                            <td>${no++}</td>
                            <td>${item.part_number}</td>
                            <td>${item.nama_barang}</td>
                            <td>${item.qty}</td>
                            <td>${item.total_scan}${fullText}</td>
                          </tr>`;
            }
            table += `</tbody></table>`;
            container.append(table);
        }

        // tombol prev/next Yamaha kalau nanti ada pagination
         $("#prev_page_yamaha").prop("disabled", page <= 1);
         $("#next_page_yamaha").prop("disabled", page >= totalPages);

        currentPageYamaha = page;

    } catch (err) {
        console.error("Gagal load Yamaha others:", err);
    }
}

// panggil saat ready
$(document).ready(function () {
    loadYamahaOthers(currentPageYamaha);
});
