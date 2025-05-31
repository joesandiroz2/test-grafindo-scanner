document.getElementById("downloadexcel").addEventListener("click", async function () {
    const button = document.getElementById("downloadexcel");
    const progressBarContainer = document.getElementById("progressBarContainer");
    const progressBar = document.getElementById("progressBar");

    button.disabled = true;
    button.innerText = "Sedang menyiapkan data excel...";
    progressBarContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.innerText = "0%";

    try {
        const authRes = await fetch(`${pocketbaseUrl}/api/collections/users/auth-with-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identity: username_pocket, password: user_pass_pocket })
        });

        const authData = await authRes.json();
        const token = authData.token;

        const data = await fetchData(currentPage);

        const groupedData = {};
        for (const item of data.items) {
            const key = `${item.part_number}-${item.lot}`;
            const qtyAmbil = Number(item.qty_scan);

            if (!groupedData[key]) {
                groupedData[key] = {
                    ...item,
                    qty_scan: qtyAmbil,
                    balance: item.balance,
                    qty_masuk: item.qty_masuk,
                    count: 1
                };
            } else {
                groupedData[key].qty_scan += qtyAmbil;
                groupedData[key].count += 1;
            }
        }

        const finalData = Object.values(groupedData);

        async function getStokAwal(part_number, lot) {
            const url = `${pocketbaseUrl}/api/collections/yamaha_kartu_stok/records?page=1&perPage=1&filter=part_number="${part_number}"`;
            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();
             if (result.items && result.items.length > 0) {
                return result.items[0].balance || 0;  // ⬅️ ini mengambil 'balance' dari record awal
            } else {
                return 0;
            }
                }

        const excelData = [];
        for (let i = 0; i < finalData.length; i++) {
            const item = finalData[i];
            const stokAwal = await getStokAwal(item.part_number, item.lot);

            excelData.push({
                "No": (currentPage - 1) * 30 + i + 1,
                "Part Number": item.part_number,
                "Nama Barang": item.nama_barang,
                "Stok Awal": stokAwal,
                "Masuk": item.qty_masuk,
                "Balance": item.balance,
                "Keluar": item.qty_scan,
                "No Do / pb": item.no_do,
                "Lot": item.lot,
                "Created": formatDate(item.created)
            });

            // Update progress
            const progress = Math.round(((i + 1) / finalData.length) * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.innerText = `${progress}%`;
        }

        const ws = XLSX.utils.json_to_sheet(excelData, { origin: "A3" });

        ws['A1'] = { t: 's', v: 'FRM-INV-06' };
        ws['C1'] = { t: 's', v: 'KARTU STOK' };

        ws['!merges'] = ws['!merges'] || [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
        ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 9 } });

        ws['C1'].s = { font: { bold: true, sz: 30 }, alignment: { horizontal: "center" } };
        ws['A1'].s = { alignment: { horizontal: "center" } };

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kartu Stok");

        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = today.toLocaleDateString('id-ID', options).replace(/ /g, '_');

        XLSX.writeFile(wb, `kartu_stok_${formattedDate}.xlsx`);
    } catch (err) {
        console.error("Terjadi kesalahan:", err);
        alert("Gagal menyiapkan data Excel.");
    } finally {
        button.disabled = false;
        button.innerText = "Download Excel";
        progressBarContainer.style.display = "none";
    }
});
