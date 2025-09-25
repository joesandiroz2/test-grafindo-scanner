let currentPage = 1;
const perPage = 15;
let totalPages = 1;

let selectedHari = "";
let filterBelumAproved = false; // default: tampilkan semua


const pb = new PocketBase(pocketbaseUrl);


function buildScheduleFilter(hariOffset) {
    if (!hariOffset) return "";

    const today = new Date();
    const target = new Date(today);
    target.setDate(today.getDate() + parseInt(hariOffset));

    const start = new Date(target.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(target.setHours(23, 59, 59, 999)).toISOString();

    return encodeURIComponent(`tgl_schedule >= "${start}" && tgl_schedule <= "${end}"`);
}



async function loadSalesData(page = 1) {
    $("#loading").show();
    $("#table-container").hide();

    try {
            let filters = [];

        let filterQuery = "";
            if (selectedHari) {
                filterQuery = `&filter=${buildScheduleFilter(selectedHari)}`;
            }


        // filter belum aproved
        if (filterBelumAproved) {
            filters.push(`setujui_io = ""`);
        }

        // gabung filter (pakai &&)
        if (filters.length > 0) {
            filterQuery = `&filter=${encodeURIComponent(filters.join(" && "))}`;
        }

          const res = await fetch(
            `${pocketbaseUrl}/api/collections/sales_order_unik/records?page=${page}&perPage=${perPage}&sort=-created${filterQuery}`
        );

        if (!res.ok) throw new Error("Gagal fetch data");
        const result = await res.json();


          // 2. ambil semua customer_id unik
        const customerIds = [
            ...new Set(result.items.map(item => item.customer_id).filter(Boolean))
        ];
       // 3. ambil data customer hanya untuk id yang dipakai
        let customerMap = {};
        if (customerIds.length > 0) {
            for (const id of customerIds) {
                try {
                    const cust = await pb.collection("sales_customer").getOne(id);
                    customerMap[cust.id] = cust.nama_pt;
                } catch (err) {
                    console.error("Customer tidak ditemukan:", id, err);
                }
            }
        }
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

           // ===== DEADLINE (tgl_schedule) =====
            let deadCell = "";
            if (item.tgl_schedule) {
                // hari ini (tanggal doang, jam direset)
                const today = new Date();
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                // tanggal schedule (ambil tahun, bulan, tanggal doang biar ga geser timezone)
                const rawDate = new Date(item.tgl_schedule);
                const tglSchedule = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());

                // hitung selisih hari
                const diffTime = tglSchedule - todayOnly;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                let status = "";
                if (diffDays < 0) {
                    status = `H+${Math.abs(diffDays)} (terlewat)`; // sudah lewat
                } else if (diffDays === 0) {
                    status = "Hari ini";
                } else {
                    status = `H-${diffDays}`; // masih ke depan
                }

                const tglFormatted = tglSchedule.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });

                const bgColor = diffDays < 0
                    ? "color:blue;font-weight:bold;"
                    : "color:red;font-weight:bold;";

                deadCell = `<td style="${bgColor}">${status}<br><small>${tglFormatted}</small></td>`;
            } else {
                deadCell = `<td>-</td>`;
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
             // ambil nama_pt sesuai customer_id
            const namaPt = customerMap[item.customer_id] || "";

            const row = `
                <tr>
                    <td>${nomor}</td>
                    <td>${item.no_po || ""}</td>
                    <td>${item.no_so || ""}</td>
                 <td>${namaPt}</td>
                     ${deadCell}
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
        <a class="btn btn-success" href="/sales_order/surat_jalan/surat_jalan.html?id=${encodeURIComponent(item.no_do || "")}">
                 DO
            </a>
        <button class="btn btn-danger btn-edit" data-id="${item.no_so}">
          <i class="bi bi-wrench"></i>
        </button>
        <button class="btn btn-danger btn-batal" data-id="${item.no_so}">
          Batalkan 
        </button>
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
        console.log(err)
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


// ganti customer
// inisialisasi Select2 pakai SDK PocketBase
// inisialisasi Select2 dengan getFullList
$("#customerSelect").select2({
    placeholder: "Pilih Customer...",
    ajax: {
        transport: async function (params, success, failure) {
            try {
                const customers = await pb.collection("sales_customer").getFullList(200);
                success({ results: customers.map(c => ({ id: c.id, text: c.nama_pt })) });
            } catch (err) {
                console.error(err);
                failure(err);
            }
        },
        processResults: data => data
    }
});
// klik tombol edit
$(document).on("click", ".btn-edit", function() {
    const noSo = $(this).data("id"); // langsung ambil no_so
    $("#editRecordId").val(noSo);    // simpan no_so
    $("#customerSelect").val(null).trigger("change"); // reset Select2
    $("#editCustomerContainer").slideDown();
});

// klik batal
$("#cancelEditBtn").on("click", function() {
    $("#editCustomerContainer").slideUp();
});

// simpan customer berdasarkan no_so
$("#saveCustomerBtn").on("click", async function() {
    const noSo = $("#editRecordId").val(); // no_so yang dipilih
    const newCustomerId = $("#customerSelect").val();

    if (!newCustomerId) {
        Swal.fire("Error", "Silakan pilih customer dulu", "error");
        return;
    }

    try {
        // ambil semua record dengan no_so yang sama
        const records = await pb.collection("sales_order").getFullList({
            filter: `no_so = "${noSo}"`
        });

        if (records.length === 0) {
            Swal.fire("Info", "Tidak ada record ditemukan untuk No SO ini", "info");
            return;
        }

        // update semua record (paralel)
        await Promise.all(records.map(rec => pb.collection("sales_order").update(rec.id, { customer_id: newCustomerId })));

        Swal.fire("Sukses", `${records.length} record berhasil diupdate ✅`, "success");
        $("#editCustomerContainer").slideUp();
        loadSalesData(currentPage); // refresh tabel
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal update customer", "error");
    }
});


loadSalesData();

$("#filterHari").on("change", function () {
    selectedHari = $(this).val();
    loadSalesData(1); // reload data dengan filter baru
});


//batalkan so
// klik batal
$(document).on("click", ".btn-batal", async function() {
    const noSo = $(this).data("id");

    // step 1: prompt password
    const { value: password } = await Swal.fire({
        title: 'Masukkan Password Buat Batalin',
        input: 'password',
        inputLabel: 'Password untuk membatalkan SO',
        inputPlaceholder: 'Password...',
        showCancelButton: true
    });

    if (!password) return; // batal jika tidak diisi
    if (password !== 'sp102103') {
        Swal.fire("Error", "Password salah ❌", "error");
        return;
    }

    // step 2: konfirmasi pembatalan
    const confirm = await Swal.fire({
        title: 'Konfirmasi',
        text: `Apakah yakin ingin membatalkan SO ${noSo}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Batalkan',
        cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
        // step 3: loading
        Swal.fire({
            title: 'Sedang membatalkan...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // ambil semua record sales_order berdasarkan no_so
        const records = await pb.collection("sales_order").getFullList({
            filter: `no_so = "${noSo}"`
        });

        if (records.length === 0) {
            Swal.close();
            Swal.fire("Info", `Tidak ada record ditemukan untuk SO ${noSo}`, "info");
            return;
        }

        // update semua record
        await Promise.all(records.map(rec => pb.collection("sales_order").update(rec.id, { is_batal: "batal" })));

        Swal.close();
        Swal.fire("Sukses", `SO ${noSo} berhasil dibatalkan ✅`, "success");

        // reload data
        loadSalesData(currentPage);

    } catch (err) {
        Swal.close();
        console.error(err);
        Swal.fire("Error", "Gagal membatalkan SO", "error");
    }
});
