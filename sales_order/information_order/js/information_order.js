let pb;

// login dulu sebelum query
async function loginUser() {
    try {
        pb = new PocketBase(pocketbaseUrl);

        // auth password
        const authData = await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("Login sukses", authData);

        // setelah login → load detail
        loadDetail_io();
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal login ke PocketBase", "error");
    }
}

async function loadDetail_io() {
    const params = new URLSearchParams(window.location.search);
    const no_io = params.get("id");

    if (!no_io) {
        Swal.fire("Error", "Parameter no_io tidak ditemukan di URL", "error");
        return;
    }

    $("#no_io").text(no_io);
    $("#loading").show();
    $("#detail-body").html(`<tr><td colspan="13" class="text-center">Loading...</td></tr>`);

    try {
        // ambil semua record dengan no_io
        const records = await pb.collection("sales_order").getFullList({
            filter: `no_io="${no_io}"`,
            sort: "-created"
        });

        const tbody = $("#detail-body");
        tbody.empty();

        if (records.length === 0) {
            tbody.append(`<tr><td colspan="13" class="text-center">Data tidak ditemukan</td></tr>`);
            renderStatusBadge(false); // badge merah
            return;
        }

        // tampilkan no_po dan salesman dari record pertama
        const firstItem = records[0];
        $("#no_po").text(firstItem.no_po || "-");
        $("#salesman").text(firstItem.sales || "-");

        // render tabel
        records.forEach((item, index) => {
            const amount = item.qty && item.unit_price ? item.qty * item.unit_price : 0;
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.tgl_schedule}</td>
                    <td>${item.nama_barang || ""}</td>
                    <td>${item.part_number || ""}</td>
                    <td>${item.qty ? item.qty.toLocaleString('id-ID') : ""} Pcs</td>
            <td style="${item.is_batal === 'batal' 
                          ? 'color:red; font-weight:bold;' 
                          : 'color:green; font-weight:bold;'}">
              ${item.is_batal === "batal" 
                  ? "❌ Batal" 
                  : "✅ Ok"}
            </td>

                </tr>`;
            tbody.append(row);
        });

        // render badge: hanya hijau jika semua record approved
        const allApproved = records.every(item => item.setujui_io && item.setujui_io.trim() !== "");
        renderStatusBadge(allApproved, firstItem.no_io);

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal mengambil detail data", "error");
    } finally {
        $("#loading").hide();
    }
}

// renderStatusBadge sekarang menerima no_io untuk klik approve semua
function renderStatusBadge(isApproved, no_io) {
    const statusDiv = $("#status_io");

    if (isApproved) {
        statusDiv.html(`
            <span class="badge bg-success" style="cursor:pointer;">
                Io Approved 😄
            </span>
        `);
    } else {
        statusDiv.html(`
            <span class="badge bg-danger" style="cursor:pointer;">
                Io belum disetujui 😞
            </span>
        `);

        // klik untuk approve semua
        statusDiv.find("span").off("click").on("click", async function () {
            Swal.fire({
                title: "Konfirmasi",
                text: "Apakah Anda yakin ingin menyetujui semua record IO ini?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Ya, Setujui",
                cancelButtonText: "Batal"
            }).then(async (result) => {
                if (!result.isConfirmed) return;

                $("#loading").show();

                try {
                    const allRecords = await pb.collection("sales_order").getFullList({
                        filter: `no_io="${no_io}"`,
                        sort: "-created"
                    });

                    let successCount = 0;
                    for (const record of allRecords) {
                        try {
                            await pb.collection("sales_order").update(record.id, {
                                setujui_io: "approved"
                            });
                            successCount++;
                        } catch (err) {
                            console.error("Gagal update:", record.id, err);
                        }
                    }

                    renderStatusBadge(true, no_io);
                    Swal.fire("Berhasil", `${successCount} record berhasil disetujui ✅`, "success");

                } catch (err) {
                    console.error(err);
                    Swal.fire("Error", "Gagal update status IO", "error");
                } finally {
                    $("#loading").hide();
                }
            });
        });
    }
}

loginUser()