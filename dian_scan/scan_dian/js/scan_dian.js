let typingTimer;
const typingDelay = 500;

// fokus input
function keepFocus() {
    const input = document.getElementById("scan_other");
    if (input) input.focus();
}

// tampilkan pesan
function showMessage(msg, type = "info") {
    const colors = { info: "blue", success: "green", error: "red", warning: "orange" };
    $("#showinfo").html(`<div style="color:${colors[type]};font-weight:bold;margin:5px 0">${msg}</div>`);
}

async function showScanTableByDo(noDo, merk) {
    let collectionName, doColumn;

    if (merk.toLowerCase() === "honda") {
        collectionName = "kartu_stok";
        doColumn = "no_dn";
    } else if (merk.toLowerCase() === "yamaha") {
        collectionName = "yamaha_kartu_stok";
        doColumn = "no_do";
    } else {
        showMessage(`Merk Ga Sesuai : ${merk}`, "danger");
        
        console.warn("Merk tidak dikenali:", merk);
        return;
    }

    try {
        const result = await pb.collection(collectionName).getFullList({
            filter: `${doColumn}="${noDo}"`,
            sort: "-created"
        });

        const tbody = $("#tbl_scan tbody");
        tbody.empty();

       result.forEach(item => {
        console.log(item)
            const rowId = `${item.part_number}_${item.lot || ""}_${item[doColumn] || ""}`;
            if (tbody.find(`tr[data-id="${rowId}"]`).length === 0) {
                // pilih field qty sesuai merk
                const qty = merk.toLowerCase() === "honda" ? item.qty_ambil || 0 : item.qty_scan || 0;

                const row = `
                    <tr data-id="${rowId}">
                        <td>${new Date(item.tgl_pb).toLocaleString()}</td>
                        <td>${item[doColumn] || ""}</td>
                        <td>${item.part_number || ""}</td>
                        <td>${qty}</td>
                    </tr>
                `;
                tbody.append(row);
            }
        });

    } catch (err) {
        console.error("Gagal menampilkan data scan by DO:", err);
        showMessage("Gagal menampilkan data scan!", "error");
    }
}


async function searchByNoDo(no_do_value) {
    try {
        showMessage("Sedang mencari DO...", "info");

        const result = await pb.collection("dian_scan").getFullList({
            filter: `no_do="${no_do_value}"`,
            sort: "-created"
        });

        // kosongkan tabel DO list dan tabel scan
        let tbodyDO = $("#tbl_do_list tbody");
        tbodyDO.empty();

        let tbodyScan = $("#tbl_scan tbody");
        tbodyScan.empty();

        if (result.length === 0) {
            tbodyDO.append(`<tr><td colspan="7" class="text-danger">Data tidak ditemukan / belom upload</td></tr>`);
            showMessage("Data tidak ditemukan", "danger");
            return;
        }

        const merk = result[0].merk?.toLowerCase() || "honda"; // default honda

        // tentukan collection & kolom filter berdasarkan merk
        let collectionName, doColumn, qtyField;
        if (merk === "honda") {
            collectionName = "kartu_stok";
            doColumn = "no_dn";
            qtyField = "qty_ambil";
        } else if (merk === "yamaha") {
            collectionName = "yamaha_kartu_stok";
            doColumn = "no_do";
            qtyField = "qty_scan";
        } else {
        showMessage(`Merk Ga Sesuai : ${merk}`, "danger");

            console.warn("Merk tidak dikenali:", merk);
            return;
        }

        // ambil semua scan untuk DO ini sesuai merk
        const scanResult = await pb.collection(collectionName).getFullList({
            filter: `${doColumn}="${no_do_value}"`,
            sort: "-created"
        });

        // buat map total scan per part_number
        const scanMap = {};
        scanResult.forEach(item => {
            const pn = item.part_number;
            const qty = parseInt(item[qtyField] || 0, 10);
            if (!scanMap[pn]) scanMap[pn] = 0;
            scanMap[pn] += qty;
        });

        // tampilkan DO list
        result.forEach((item, i) => {
            const totalScan = scanMap[item.part_number] || 0;
            const tdQty = Number(String(item.qty || "0").trim());

            let bgcolor = "white", color = "black";
            if (totalScan < tdQty) {
                bgcolor = "orange"; color = "black";
            } else if (totalScan === tdQty) {
                bgcolor = "green"; color = "white";
            } else if (totalScan > tdQty) {
                bgcolor = "red"; color = "white";
            }

            const row = `
                <tr>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${i + 1}</td>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${item.kode_depan}</td>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${item.no_do}</td>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${item.part_number || ""}</td>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${item.nama_barang || ""}</td>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${tdQty} Pcs -> Scan: ${totalScan}</td>
                    <td style="font-weight:bold;background-color:${bgcolor};color:${color}">${item.merk || ""}</td>
                </tr>
            `;
            tbodyDO.append(row);
        });

        showMessage("DO berhasil ditemukan", "success");

        // tampilkan tabel scan detail
        await showScanTableByDo(no_do_value, merk);

    } catch (err) {
        console.error("Error saat cari data:", err);
        showMessage("Gagal mencari data!", "error");
    }
}



// validasi scan input
function validateInput(scanValue) {
    const parts = scanValue.split("|");
    if (parts.length < 4) {
        playSound("../../suara/partnumber_ga_standar_scan.mp3");
        showMessage("Format label tidak standar: part_number|supplier_id|qty|lot", "error");
        return false;
    }

    const partNumber = parts[0].trim();
    const qtyInput = parseInt(parts[2].trim(), 10);

    let found = false;
    let valid = true;

    $("#tbl_do_list tbody tr").each(function () {
            const tdPart = $(this).find("td:eq(3)").text().trim();   // part_number ada di kolom 3
            const tdQty = parseInt($(this).find("td:eq(5)").text().replace("Pcs","").trim(), 10); // qty di kolom 5

            if (tdPart.toLowerCase() === partNumber.toLowerCase()) {
                found = true;
                if (qtyInput > tdQty) {
                    showMessage("Qty kelebihan atau tidak sesuai", "error");
                    valid = false;
                }
            }
        });


    if (!found) {
        playSound("../../suara/barang_kagak_ada_di_do_ini.mp3");
        showMessage(`Part number ${partNumber} tidak ada di daftar DO`, "error");
        valid = false;
    }

    return valid;
}

// scan input
$(document).ready(async function () {
       await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
  
    const input = $("#scan_other");
    keepFocus();

    input.on("input", function () {
        clearTimeout(typingTimer);
        const value = $(this).val().trim();
        if (!value) return;

        typingTimer = setTimeout(async () => {
            if (/^\d+$/.test(value)) {
                // nomor DO
                await searchByNoDo(value);
                playSound("../../suara/scan_do.wav");
            } else if (value.includes("|")) {
                if (validateInput(value)) {
                    const [partNumber, supplierId, qtyInputStr, lot] = value.split("|");
                    const qtyInput = parseInt(qtyInputStr.trim(), 10);

                    // ambil merk, namaBarang, noDo dari tabel DO
                   let merk = "", namaBarang = "", noDo = "";
                    $("#tbl_do_list tbody tr").each(function () {
                        const tdPart = $(this).find("td:eq(3)").text().trim();  // part_number di kolom 3
                        if (tdPart.toLowerCase() === partNumber.toLowerCase()) {
                            merk = $(this).find("td:eq(6)").text().trim();       // merk di kolom 6
                            namaBarang = $(this).find("td:eq(4)").text().trim();  // nama_barang di kolom 4
                            noDo = $(this).find("td:eq(2)").text().trim();        // no_do di kolom 2
                        }
                    });


                    await reduceStock(partNumber, lot, qtyInput, merk, noDo, namaBarang);
                }
            } else {
                showMessage("Input harus berupa nomor DO atau format: part_number|supplier_id|qty|lot", "danger");
            }

            $(this).val("");
            keepFocus();
        }, typingDelay);
    });

    input.on("blur", keepFocus);
});

