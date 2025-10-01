const pb = new PocketBase(pocketbaseUrl);
let lastDORecords = []; // simpan hasil cariDO terakhir untuk validasi


// selalu fokus walau blur
function keepFocus() {
    const scanInput = document.getElementById("scan_part");

    function refocus() {
        if (document.activeElement !== scanInput) {
            scanInput.focus();
        }
    }

    // saat blur → langsung refocus
    scanInput.addEventListener("blur", () => {
        setTimeout(refocus, 50);
    });

    // klik di mana saja di document → tetap refocus
    document.addEventListener("click", () => {
        setTimeout(refocus, 50);
    });

    // load awal → fokus
    scanInput.focus();
}


// fungsi login user
async function loginUser() {
    try {
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("Login success!");
        initScan();
    } catch (err) {
        console.error("Login gagal:", err);
        Swal.fire("Error", "Gagal login ke server", "error");
    }
}

function normalizePartNumber(input) {
    return input
        .replace(/\s+/g, "")      // hapus semua spasi
        .replace(/-+/g, "-")      // rapikan strip ganda
        .toUpperCase();
}

// render tabel hasil scan
function renderSudahScan(records) {
    if (!records.length) {
        $("#tbl_sudah_scan").html("<tr><td colspan='6'>Belum ada data scan</td></tr>");
        return;
    }

    let html = `
        <table border="1" class="table table-bordered table-striped">
          <thead class="thead-dark">
            <tr>
              <th>No</th>
              <th>No DO</th>
              <th>Part No</th>
              <th>Qty scan</th>
              <th>Lot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    records.forEach((item, i) => {
        html += `
            <tr>
              <td>${i + 1}</td>
              <td>${item.no_do}</td>
              <td>${item.part_number}</td>
              <td style="font-weight:bold">${item.qty}</td>
              <td>${item.lot || "-"}</td>
              <td>${item.status || "-"}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    $("#tbl_sudah_scan").html(html);
}


// inisialisasi input scan
function initScan() {
    let typingTimer;
    const doneTypingInterval = 500;

    $("#scan_part").on("input", function () {
        clearTimeout(typingTimer);
        let inputVal = $(this).val().trim();
        if (!inputVal) {
            $("#tbl_do").html("");
            $("#showmessage").html("");
            return;
        }

        typingTimer = setTimeout(async () => {
            if (inputVal.includes("|")) {
                // format multi
                const parts = inputVal.split("|");

                let part_number = normalizePartNumber(parts[0]);
                const qty = parseInt(parts[2], 10) || 0;  
                const lot = parts[3] ? parts[3].trim() : "";

                const found = lastDORecords.some(
                    rec => normalizePartNumber(rec.part_number) === part_number
                );

                if (!found) {
                    $("#showmessage").html(
                        `<span class="text-danger font-weight-bold">Part Number ${part_number} tidak ditemukan / belum upload</span>`
                    );
                    $("#scan_part").val("").focus();
                    return;
                }

                await prosesKartuStok(part_number, qty, lot);
                $("#scan_part").val("").focus();
            } else {
                // single DO → langsung cari
                await cariDO(inputVal.trim());
            }
        }, doneTypingInterval);

    });
}


// cari DO di PocketBase
// cari DO di PocketBase
async function cariDO(noDo) {
    try {
        const records = await pb.collection("dian_scan").getFullList({
            filter: `no_do = "${noDo}"`,
            sort: "-created"
        });

        if (records.length === 0) {
            lastDORecords = []; 
            $("#tbl_do").html("");
            $("#tbl_sudah_scan").html(""); 
            $("#showmessage").html(
                `<span class="text-danger font-weight-bold">DO ga ditemukan / belum upload</span>`
            );
            Swal.fire({
                icon: "warning",
                title: "DO tidak ditemukan",
                timer: 1200,
                text: "Silakan upload data DO terlebih dahulu."
            });
            return;
        }

        lastDORecords = records;

        $("#showmessage").html("");
        $("#scan_part").val("").focus();

        // 🔥 ambil semua hasil scan utk no_do ini
        const scanned = await pb.collection("others_kartu_stok").getFullList({
            filter: `no_do = "${records[0].no_do}"`,
            sort: "-created"
        });

        // hitung total scan per part_number
        const scanTotals = {};
        scanned.forEach(item => {
            const pn = item.part_number.trim().toUpperCase();
            scanTotals[pn] = (scanTotals[pn] || 0) + (parseInt(item.qty, 10) || 0);
        });

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

        records.forEach((item, i) => {
            const pn = item.part_number.trim().toUpperCase();
            const scannedQty = scanTotals[pn] || 0; // qty yg sudah discan
            let scannedDisplay;
            if (scannedQty === parseInt(item.qty, 10)) {
                scannedDisplay = `<span style="color:green; font-weight:bold">${scannedQty}  FULL</span>`;
            } else {
                scannedDisplay = `<span style="color:blue; font-weight:bold">${scannedQty}</span>`;
            }


            html += `
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.kode_depan + item.no_do}</td>
                  <td style="font-weight:bold">${item.part_number}</td>
                  <td>${item.nama_barang}</td>
                  <td style="font-weight:bold">${item.qty}</td>
                    <td>${scannedDisplay}</td>
                  <td>${item.po_no}</td>
                  <td>${item.merk}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        $("#tbl_do").html(html);

        // render detail scan di tabel bawah
        renderSudahScan(scanned);

    } catch (err) {
        console.error("Error cari DO:", err);
        Swal.fire("Error", "Terjadi kesalahan saat mencari DO", "error");
    }
}

keepFocus();   // 🔥 tambahkan ini

loginUser();
