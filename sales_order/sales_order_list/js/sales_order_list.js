let currentPage = 1;
const perPage = 100;
let totalPages = 1;



async function loadSalesData(page = 1) {
    $("#loading").show();
    $("#table-container").hide();

    try {
        const res = await fetch(`${pocketbaseUrl}/api/collections/sales_order_unik/records?page=${page}&perPage=${perPage}&sort=-created`);

        if (!res.ok) throw new Error("Gagal fetch data");
        const result = await res.json();
        console.log(result);

        const tbody = $("#sales-body");
        tbody.empty();

        result.items.forEach((item, index) => {
            // nomor urut
            const nomor = (page - 1) * perPage + (index + 1);

            // format created
            let createdFormatted = "";
            if (item.created) {
                const date = new Date(item.created);
                createdFormatted =
                    date.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    }) +
                    " " +
                    date.toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit"
                    });
            }

            // status batal / ok
            let statusCell = "";
            if (
                item.is_batal === true || 
                (typeof item.is_batal === "string" && item.is_batal.toLowerCase() === "batal")
            ) {
                statusCell = `<td style="background:red;color:white;">Batal</td>`;
            } else {
                statusCell = `<td style="background:green;color:white;">Ok</td>`;
            }
            console.log(item)

            const row = `
                <tr>
                    <td>${nomor}</td>
                    <td>${item.no_po || ""}</td>
                    <td>${item.no_so || ""}</td>
                    <td>${item.no_io || ""}</td>
                    <td>${item.no_do || ""}</td>
                    <td>${item.sales || ""}</td>
                <td style="${item.setujui_io 
                              ? 'color:green; font-weight:bold;' 
                              : 'color:red; font-weight:bold;'}">
                  ${item.setujui_io || "Blm Aproved"}
                </td>


                    ${statusCell}
                    <td>${createdFormatted}</td>
                   <td>
          <a class="btn btn-info" href="./sales_order_detail/sales_order_detail.html?id=${encodeURIComponent(item.no_so || "")}">
                 SO
            </a>
         <a class="btn btn-warning" href="/sales_order/information_order/information_order_list.html?id=${encodeURIComponent(item.no_io || "")}">
                 IO
            </a>
        </td>
                </tr>`;
            tbody.append(row);
        });

        totalPages = result.totalPages;
        currentPage = page;
        renderPagination();

        $("#loading").hide();
        $("#table-container").show();
    } catch (err) {
        $("#loading").hide();
        Swal.fire("Error", "Gagal mengambil data", "error");
    }
}

function formatTanggal(tgl) {
    if (!tgl) return "";
    const date = new Date(tgl);
    return (
        date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }) +
        " " +
        date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        })
    );
}

function renderPagination() {
    const pagination = $("#pagination");
    pagination.empty();

    // tombol sebelumnya
    pagination.append(`
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="if(currentPage > 1) loadSalesData(${currentPage - 1}); return false;">Sebelumnya</a>
        </li>
    `);

    // info halaman
    pagination.append(`
        <li class="page-item disabled">
            <span class="page-link">Halaman ${currentPage} dari ${totalPages}</span>
        </li>
    `);

    // tombol selanjutnya
    pagination.append(`
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="if(currentPage < totalPages) loadSalesData(${currentPage + 1}); return false;">Selanjutnya</a>
        </li>
    `);
}


loadSalesData();
