let currentPageHonda = 1;
const perPageHonda = 15;

async function loadHondaOthers(page = 1) {
    try {

        const container = $("#honda_others");
        container.empty();

        const progressBar = $("#progress_bar_honda");
        progressBar.css("width", "0%").text("0%");

        const doList = await pb.collection("kartu_stok").getList(page, perPageHonda, {
            filter: `budian="budian"`,
            sort: "-created"
        });

        const totalPages = doList.totalPages;
        $("#page_info_honda").text(`Halaman ${page} dari ${totalPages}`);

        const doNumbers = [...new Set(doList.items.map(item => item.no_dn || "unknown"))];

        for (let i = 0; i < doNumbers.length; i++) {
            const doNumber = doNumbers[i];

            const doData = await pb.collection("kartu_stok").getFullList({
                filter: `budian="budian" && no_dn="${doNumber}"`,
                sort: "-created"
            });

            // grouping per part_number
            const groupedData = {};
            doData.forEach(item => {
                const part = item.part_number || "unknown";
                if (!groupedData[part]) {
                    groupedData[part] = {
                        no_dn: doNumber,
                        part_number: part,
                        nama_barang: item.nama_barang,
                        qty_minta: parseInt(item.qty_minta || 0, 10),
                        qty_ambil: parseInt(item.qty_ambil || 0, 10),
                        status: "barang " + item.status
                    };
                } else {
                    groupedData[part].qty_ambil += parseInt(item.qty_ambil || 0, 10);
                }
            });

            container.append(`<div class="card shadow mb-3 p-2">
                                <h5 style="font-weight:bold">DO: ${doNumber}</h5>
                              </div>`);

            let table = `<table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Part No</th>
                                    <th>Barang</th>
                                    <th>Qty</th>
                                    <th>Qty keluar</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>`;

            let no = 1;
            for (const part in groupedData) {
                const item = groupedData[part];
                let statusSpan = "";
                if (item.qty_ambil === item.qty_minta) {
                    statusSpan = `<span style="color:green;font-weight:bold">OK</span>`;
                } else if (item.qty_ambil < item.qty_minta) {
                    statusSpan = `<span style="color:red;font-weight:bold">Not Full</span>`;
                }

                table += `<tr>
                            <td>${no++}</td>
                            <td>${item.part_number}</td>
                            <td>${item.nama_barang}</td>
                            <td>${item.qty_minta}</td>
                            <td>${item.qty_ambil} ${statusSpan}</td>
                            <td>${item.status}</td>
                          </tr>`;
            }
            table += `</tbody></table>`;
            container.append(table);

            const percent = Math.round(((i + 1) / doNumbers.length) * 100);
            progressBar.css("width", percent + "%").text(percent + "%");
        }

        $("#prev_page_honda").prop("disabled", page <= 1);
        $("#next_page_honda").prop("disabled", page >= totalPages);

        currentPageHonda = page;

    } catch (err) {
        console.error("Gagal load Honda others:", err);
    }
}

// tombol Honda
$("#prev_page_honda").click(() => {
    if (currentPageHonda > 1) loadHondaOthers(currentPageHonda - 1);
});
$("#next_page_honda").click(() => {
    loadHondaOthers(currentPageHonda + 1);
});

$(document).ready(async function () {
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    
    loadHondaOthers(currentPageHonda);
});
