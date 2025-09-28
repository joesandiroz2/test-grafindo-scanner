/**
 * Tampilkan data kartu_stok berdasarkan no_do di tabel #tbl_scan
 * @param {string} noDo
 */
async function showScanTableByDo(noDo) {
    try {
        const result = await pb.collection("kartu_stok").getFullList({
            filter: `no_dn="${noDo}"`,
            sort: "-created"
        });

        const tbody = $("#tbl_scan tbody");
        tbody.empty();

        result.forEach(item => {
            const row = `
                <tr>
                    <td>${new Date(item.tgl_pb).toLocaleString()}</td>
                    <td>${item.no_dn || ""}</td>
                    <td>${item.part_number}</td>
                    <td>${item.qty_ambil}</td>
                </tr>
            `;
            tbody.append(row);
        });
    } catch (err) {
        console.error("Gagal menampilkan data scan by DO:", err);
        showMessage("Gagal menampilkan data scan!", "error");
    }
}


/**
 * Kurangi stok di collection kartu_stok
 */
async function reduceStock(partNumber, lot, qtyScan, merk, doNumber = "", namaBarang = "") {
    try {
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

        if (merk.toLowerCase() !== "honda") {
            console.warn("Merk bukan Honda, skip pengurangan stok");
            return;
        }

        // Ambil total permintaan dari tabel DO
        let totalPermintaan = 0;
        $("#tbl_do_list tbody tr").each(function () {
            const tdPart = $(this).find("td:eq(3)").text().trim();  // kolom part_number
            const tdQty = parseInt($(this).find("td:eq(5)").text().replace("Pcs", "").trim(), 10); // kolom qty
            const tdDo = $(this).find("td:eq(2)").text().trim();      // kolom no_do

            if (tdPart.toLowerCase() === partNumber.toLowerCase() && tdDo === doNumber) {
                totalPermintaan += tdQty;
            }
        });

        // Ambil total qty sudah keluar di kartu_stok untuk partNumber & doNumber
        const stokKeluar = await pb.collection("kartu_stok").getFullList({
            filter: `part_number="${partNumber}" && no_dn="${doNumber}"`,
        });

        let totalKeluar = stokKeluar.reduce((sum, item) => sum + (parseInt(item.qty_ambil || 0, 10)), 0);

        const sisaQty = totalPermintaan - totalKeluar;

        if (qtyScan > sisaQty) {
            showMessage(`Qty part number ${partNumber} sudah penuh (${totalPermintaan} Pcs)`, "error");
            playSound("../../suara/kuantiti_sudah_full.mp3");
            return; // jangan create
        }

        // ambil data kartu_stok terakhir untuk part_number dan lot yang sama
        const result = await pb.collection("kartu_stok").getList(1, 1, {
            filter: `part_number="${partNumber}" && lot="${lot}"`,
            sort: "-created"
        });

        let lastBalance = 0;
        if (result.items.length > 0) {
            lastBalance = parseInt(result.items[0].balance || 0, 10);
        }

        const newBalance = lastBalance - qtyScan;


        // Hitung jumlah part_number unik untuk DO ini
        let jumlahBarangDo = 0;
        const partNumbers = new Set();
        $("#tbl_do_list tbody tr").each(function () {
            const tdDo = $(this).find("td:eq(2)").text().trim(); // kolom no_do
            const tdPart = $(this).find("td:eq(3)").text().trim(); // kolom part_number
            if (tdDo === doNumber) {
                partNumbers.add(tdPart);
            }
        });
        jumlahBarangDo = partNumbers.size;

        let qtyMinta = 0;
        $("#tbl_do_list tbody tr").each(function () {
            const tdDo = $(this).find("td:eq(2)").text().trim();       // no_do
            const tdPart = $(this).find("td:eq(3)").text().trim();     // part_number
            const tdQty = parseInt($(this).find("td:eq(5)").text().replace("Pcs","").trim(), 10); // qty DO

            if (tdDo === doNumber && tdPart.toLowerCase() === partNumber.toLowerCase()) {
                qtyMinta += tdQty;
            }
        });


        const newData = {
            part_number: partNumber,
            lot: lot,
            qty_ambil: qtyScan,
            status: "keluar",
            balance: newBalance,
            no_dn: doNumber,
            jumlah_barang_do:jumlahBarangDo,
            nama_barang: namaBarang,
            qty_minta:qtyMinta,
            tgl_pb: new Date().toISOString(),
            merk: merk,
            budian:"budian",
            id: Math.random().toString(36).substr(2, 6),
        };

        await pb.collection("kartu_stok").create(newData);

        console.log(`Stok ${partNumber} dikurangi ${qtyScan}`);
        showMessage(`Stok ${partNumber} dikurangi ${qtyScan}, sisa ${sisaQty - qtyScan} dari Do ini`, "success");
       
        await showScanTableByDo(doNumber);
        
        // update total scan di DO list
        await updateDoScanQty(partNumber, doNumber);

        playSound("../../suara/suara_ok.mp3");

    } catch (err) {
        console.error("Gagal mengurangi stok:", err);
        showMessage(`Gagal mengurangi stok ${partNumber}`, "error");
        playSound("../../suara/error_scan.mp3");
    }
}


// update total scan di tbl_do_list untuk part_number tertentu
async function updateDoScanQty(partNumber, noDo) {
    try {
        // ambil semua scan terbaru dari kartu_stok untuk DO ini
        const scanResult = await pb.collection("kartu_stok").getFullList({
            filter: `no_dn="${noDo}" && part_number="${partNumber}"`,
            sort: "-created"
        });

        let totalScan = 0;
        scanResult.forEach(item => {
            totalScan += parseInt(item.qty_ambil || 0, 10);
        });

        // update kolom Qty / Scan di tbl_do_list
        $("#tbl_do_list tbody tr").each(function () {
            const tdPart = $(this).find("td:eq(3)").text().trim(); // kolom part_number
            if (tdPart.toLowerCase() === partNumber.toLowerCase()) {
                const tdQty = parseInt($(this).find("td:eq(5)").text().split(" Pcs")[0].trim(), 10); // ambil qty DO
                $(this).find("td:eq(5)").text(`${tdQty} Pcs -> scan: ${totalScan}`);

                // ganti warna background
                if (totalScan < tdQty) {
                    $(this).css("background-color", "orange");
                } else if (totalScan === tdQty) {
                    $(this).css("background-color", "green");
                } else {
                    $(this).css("background-color", "red"); // optional: kalau lebih dari DO
                }
            }
        });
    } catch (err) {
        console.error("Gagal update total scan:", err);
    }
}

