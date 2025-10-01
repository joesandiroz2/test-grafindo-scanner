// fungsi render tabel hasil scan
function renderSudahScan(records) {
    if (!records.length) {
        $("#tbl_sudah_scan").html("<tr><td colspan='6'>Belum ada data</td></tr>");
        return;
    }

    let html = `
        <table border="1" class="table table-bordered table-striped">
          <thead class="thead-dark">
            <tr>
              <th>No</th>
              <th>Part No</th>
              <th>Qty scan</th>
              <th>Lot</th>
            </tr>
          </thead>
          <tbody>
    `;

    records.forEach((item, i) => {
        html += `
            <tr>
              <td>${i + 1}</td>
              <td>${item.part_number}</td>
              <td style="font-weight:bold">${item.qty}</td>
              <td>${item.lot}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    $("#tbl_sudah_scan").html(html);
}


function formatScanDisplay(scannedQty, qtyDO) {
    if (scannedQty === qtyDO) {
        return `<span style="color:green; font-weight:bold">${scannedQty} FULL</span>`;
    } else {
        return `<span style="color:blue; font-weight:bold">sudah scan ${scannedQty} dari ${qtyDO}</span>`;
    }
}

// proses kartu stok untuk format multi
// proses kartu stok untuk format multi
async function prosesKartuStok(part_number, qty, lot) {
    try {
        // 1. Cari data DO yang sesuai dari lastDORecords
        const doRecord = lastDORecords.find(
            rec => rec.part_number.replace(/\s+/g, "").toUpperCase() === part_number
        );

        if (!doRecord) {
            Swal.fire({
                icon: "error",
                title: "Part Number tidak ditemukan di DO",
                text: `Part ${part_number} belum ada di tabel DO`
            });
            return;
        }

        const qtyDO = parseInt(doRecord.qty, 10) || 0;

        // 2. Hitung total scan sebelumnya di others_kartu_stok
        const stokRecords = await pb.collection("others_kartu_stok").getFullList({
            filter: `part_number = "${part_number}" && no_do = "${doRecord.no_do}"`,
            sort: "-created"
        });

        let totalScan = 0;
        if (stokRecords.length > 0) {
            totalScan = stokRecords.reduce((sum, rec) => sum + (parseInt(rec.qty, 10) || 0), 0);
        }

        // 3. Validasi apakah qty sudah full
        if (totalScan + qty > qtyDO) {
            Swal.fire({
                icon: "warning",
                title: `${part_number} Kuantiti sudah full`,
                timer:1200,
                text: `Part ${part_number} sudah discan ${totalScan}/${qtyDO}. Tidak bisa lebih.`
            });
            $("#scan_part").val("").focus();
            return;
        }

        // 4. Hitung balance baru
        let balanceAwal = 0;
        if (stokRecords.length > 0) {
            balanceAwal = parseInt(stokRecords[0].balance, 10) || 0;
        }
        const balanceBaru = balanceAwal - qty;

        // 5. Create data baru
        await pb.collection("others_kartu_stok").create({
            no_do: doRecord.no_do,
            part_number: part_number,
            nama_barang: doRecord.nama_barang,
            qty: qty,
            qty_minta:qtyDO,
            lot: lot,
            kode_depan: doRecord.kode_depan,
            balance: balanceBaru,
            no_po: doRecord.po_no,   // 🔥 tambahkan ini
            status: "keluar"
        });

        // 6. Ambil ulang data scan utk part_number ini
        const updatedRecords = await pb.collection("others_kartu_stok").getFullList({
            filter: `part_number = "${part_number}" && no_do = "${doRecord.no_do}"`,
            sort: "-created"
        });

        // 7. Render tabel scan detail
        renderSudahScan(updatedRecords);

        // 8. 🔥 Update tabel DO (hitung ulang semua qty scan utk DO ini)
        const scannedAll = await pb.collection("others_kartu_stok").getFullList({
            filter: `no_do = "${doRecord.no_do}"`,
            sort: "-created"
        });

        // hitung total scan per part_number
        const scanTotals = {};
        scannedAll.forEach(item => {
            const pn = item.part_number.trim().toUpperCase();
            scanTotals[pn] = (scanTotals[pn] || 0) + (parseInt(item.qty, 10) || 0);
        });

        // rebuild tbl_do
        let html = `
            <table border="1" class="table table-bordered table-responsive table-striped">
              <thead class="thead-dark">
                <tr>
                  <th>No</th>
                  <th>No DO</th>
                  <th>Part Number</th>
                  <th>Nama Barang</th>
                  <th>Qty DO</th>
                  <th>Qty Scan</th>
                  <th>PO No</th>
                  <th>Merk</th>
                </tr>
              </thead>
              <tbody>
        `;

        lastDORecords.forEach((item, i) => {
        const pn = item.part_number.trim().toUpperCase();
        const scannedQty = scanTotals[pn] || 0;
        const qtyDO = parseInt(item.qty, 10) || 0;   // ✅ ambil qtyDO dari masing-masing item

        html += `
            <tr>
              <td>${i + 1}</td>
              <td>${item.kode_depan + item.no_do}</td>
              <td style="font-weight:bold">${item.part_number}</td>
              <td>${item.nama_barang}</td>
              <td style="font-weight:bold">${qtyDO}</td>
              <td>${formatScanDisplay(scannedQty, qtyDO)}</td>
              <td>${item.po_no}</td>
              <td>${item.merk}</td>
            </tr>
        `;
    });


        html += "</tbody></table>";
        $("#tbl_do").html(html);

        $("#showmessage").html(
            `<span class="text-success font-weight-bold">Stok Berhasil Dikurangi</span>`
        );
        $("#scan_part").val("").focus();

    } catch (err) {
        console.error("Error proses kartu stok:", err);
        Swal.fire("Error", "Gagal memproses kartu stok", "error");
    }
}
