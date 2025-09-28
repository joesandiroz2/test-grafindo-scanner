/**
 * Tampilkan data kartu_stok berdasarkan no_do di tabel #tbl_scan
 * @param {string} noDo
 */

/**
 * Kurangi stok di collection kartu_stok
 */
async function reduceStock(partNumber, lot, qtyScan, merk, doNumber = "", namaBarang = "") {
        merk = merk || "honda"; // default
    try {
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

        let collectionName = "";
        let doColumn = "";
        if (merk.toLowerCase() === "honda") {
            collectionName = "kartu_stok";
            doColumn = "no_dn";
        } else if (merk.toLowerCase() === "yamaha") {
            collectionName = "yamaha_kartu_stok";
            doColumn = "no_do";
        } else {
            console.warn("Merk tidak dikenali, skip pengurangan stok");
            return;
        }

        // Ambil total permintaan dari tabel DO
        let totalPermintaan = 0;
        $("#tbl_do_list tbody tr").each(function () {
            const tdPart = $(this).find("td:eq(3)").text().trim();
            const tdQty = parseInt($(this).find("td:eq(5)").text().replace("Pcs", "").trim(), 10);
            const tdDo = $(this).find("td:eq(2)").text().trim();
            if (tdPart.toLowerCase() === partNumber.toLowerCase() && tdDo === doNumber) {
                totalPermintaan += tdQty;
            }
        });
        // Ambil total qty sudah keluar
        const stokKeluar = await pb.collection(collectionName).getFullList({
            filter: `part_number="${partNumber}" && ${doColumn}="${doNumber}"`,
        });

        // pilih field qty sesuai merk
        let qtyField = merk.toLowerCase() === "honda" ? "qty_ambil" : "qty_scan";

        let totalKeluar = stokKeluar.reduce((sum, item) => {
            return sum + (parseInt(item[qtyField] || 0, 10));
        }, 0);

        const sisaQty = totalPermintaan - totalKeluar;

        // validasi supaya tidak boleh lebih
        if (qtyScan > sisaQty) {
            showMessage(
                `Qty part number ${partNumber} sudah penuh (${totalPermintaan} Pcs)`,
                "error"
            );
            playSound("../../suara/kuantiti_sudah_full.mp3");
            return; // stop, jangan create
        }


        // Ambil balance terakhir
        const result = await pb.collection(collectionName).getList(1, 1, {
            filter: `part_number="${partNumber}" && lot="${lot}"`,
            sort: "-created"
        });

        let lastBalance = 0;
        if (result.items.length > 0) lastBalance = parseInt(result.items[0].balance || 0, 10);

        const newBalance = lastBalance - qtyScan;

        // Hitung jumlah part_number unik untuk DO ini
        const partNumbers = new Set();
        $("#tbl_do_list tbody tr").each(function () {
            const tdDo = $(this).find("td:eq(2)").text().trim();
            const tdPart = $(this).find("td:eq(3)").text().trim();
            if (tdDo === doNumber) partNumbers.add(tdPart);
        });
        const jumlahBarangDo = partNumbers.size;

        // Hitung qty minta
        let qtyMinta = 0;
        $("#tbl_do_list tbody tr").each(function () {
            const tdDo = $(this).find("td:eq(2)").text().trim();
            const tdPart = $(this).find("td:eq(3)").text().trim();
            const tdQty = parseInt($(this).find("td:eq(5)").text().replace("Pcs","").trim(), 10);
            if (tdDo === doNumber && tdPart.toLowerCase() === partNumber.toLowerCase()) qtyMinta += tdQty;
        });

       let newData = {
                part_number: partNumber,
                lot: lot,
                status: "keluar",
                balance: newBalance,
                [doColumn]: doNumber,
                jumlah_barang_do: jumlahBarangDo,
                nama_barang: namaBarang,
                tgl_pb: new Date().toISOString(),
                merk: merk,
                budian: "budian",
            };

            // untuk Honda
            if (merk.toLowerCase() === "honda") {
                newData.qty_ambil = qtyScan;
                newData.qty_minta = qtyMinta;
                newData.id = Math.random().toString(36).substr(2, 6);
            }
            // untuk Yamaha
            else if (merk.toLowerCase() === "yamaha") {
                newData.qty_scan = qtyScan;
                newData.qty_do = qtyMinta;
            }



        await pb.collection(collectionName).create(newData);

        showMessage(`Stok ${partNumber} dikurangi ${qtyScan}`, "success");
        await showScanTableByDo(doNumber, merk);
        await updateDoScanQty(partNumber, doNumber, merk);

        playSound("../../suara/suara_ok.mp3");

    } catch (err) {
        console.error("Gagal mengurangi stok:", err);
        showMessage(`Gagal mengurangi stok ${partNumber}`, "error");
        playSound("../../suara/error_scan.mp3");
    }
}

// showScanTableByDo menyesuaikan merk
async function showScanTableByDo(noDo, merk) {
    let collectionName = merk.toLowerCase() === "honda" ? "kartu_stok" : "yamaha_kartu_stok";
    let doColumn = merk.toLowerCase() === "honda" ? "no_dn" : "no_do";

    try {
        const result = await pb.collection(collectionName).getFullList({
            filter: `${doColumn}="${noDo}"`,
            sort: "-created"
        });

        const tbody = $("#tbl_scan tbody");
        tbody.empty();

        result.forEach(item => {
         const qty = merk.toLowerCase() === "honda" ? item.qty_ambil || 0 : item.qty_scan || 0;

            const row = `
                <tr>
                    <td>${new Date(item.tgl_pb).toLocaleString()}</td>
                    <td>${item[doColumn] || ""}</td>
                    <td>${item.part_number}</td>
                    <td>${qty}</td>
                </tr>
            `;
            tbody.append(row);
        });

    } catch (err) {
        console.error("Gagal menampilkan data scan by DO:", err);
        showMessage("Gagal menampilkan data scan!", "error");
    }
}



async function updateDoScanQty(partNumber, noDo, merk = "honda") {
    try {
        let collectionName = merk.toLowerCase() === "honda" ? "kartu_stok" : "yamaha_kartu_stok";
        let qtyField = merk.toLowerCase() === "honda" ? "qty_ambil" : "qty_scan";
        let doColumn = merk.toLowerCase() === "honda" ? "no_dn" : "no_do";

        // ambil semua scan terbaru untuk DO ini
        const scanResult = await pb.collection(collectionName).getFullList({
            filter: `${doColumn}="${noDo}" && part_number="${partNumber}"`,
            sort: "-created"
        });

        let totalScan = 0;
        scanResult.forEach(item => {
            totalScan += parseInt(item[qtyField] || 0, 10);
        });

        // update kolom Qty / Scan di tbl_do_list
        // update kolom Qty / Scan di tbl_do_list
            $("#tbl_do_list tbody tr").each(function () {
                const tdPart = $(this).find("td:eq(3)").text().trim(); // kolom part_number
                if (tdPart.toLowerCase() === partNumber.toLowerCase()) {
                    const tdQty = parseInt($(this).find("td:eq(5)").text().split(" Pcs")[0].trim(), 10); // ambil qty DO

                    let textScan = `${tdQty} Pcs -> scan: ${totalScan}`;
                    if (tdQty === totalScan) {
                        textScan += " (Full)";
                    }

                    $(this).find("td:eq(5)").text(textScan);

                    // ganti warna background
                    if (totalScan < tdQty) {
                        $(this).css("background-color", "orange");
                    } else if (totalScan === tdQty) {
                        $(this).css("background-color", "green");
                    } else {
                        $(this).css("background-color", "red"); // kalau lebih dari DO
                    }
                }
            });


    } catch (err) {
        console.error("Gagal update total scan:", err);
    }
}
