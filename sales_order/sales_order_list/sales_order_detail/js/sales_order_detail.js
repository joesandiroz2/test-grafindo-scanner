let pb;

// login dulu sebelum query
async function loginUser() {
    try {
        pb = new PocketBase(pocketbaseUrl);

        // auth password
        const authData = await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("Login sukses", authData);

        // setelah login → load detail
        loadDetailSO();
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal login ke PocketBase", "error");
    }
}

async function loadDetailSO() {
    const params = new URLSearchParams(window.location.search);
    const no_so = params.get("id"); // ambil dari ?id=...

    if (!no_so) {
        Swal.fire("Error", "Parameter no_so tidak ditemukan di URL", "error");
        return;
    }


    $("#no_so").text(no_so);
    $("#loading").show();
    $("#detail-body").html(`<tr><td colspan="13" class="text-center">Loading...</td></tr>`);

    try {
        // ambil data sales_order dengan filter no_so
        const records = await pb.collection("sales_order").getFullList({
            filter: `no_so="${no_so}"`,
            sort: "-created"
        });

        const tbody = $("#detail-body");
        tbody.empty();
        let grandTotal = 0; // ← deklarasi grandTotal sebelum loop

        if (records.length === 0) {
            tbody.append(`<tr><td colspan="13" class="text-center">Data tidak ditemukan</td></tr>`);
        } else {

          // tampilkan no_po dan salesman dari record pertama
        const firstItem = records[0];
        $("#no_po").text(firstItem.no_po || "-");
        $("#salesman").text(firstItem.sales || "-");


            // === ambil data customer berdasarkan customer_id ===
    if (firstItem.customer_id) {
        try {
            const customer = await pb.collection("sales_customer").getOne(firstItem.customer_id);
            $("#cust_pt").text(customer.nama_pt || "-");
            $("#cust_alamat").text(customer.alamat || "-");
            $("#cust_telp").text(customer.no_telp || "-");
        } catch (err) {
            console.warn("Customer tidak ditemukan:", err);
        }
    }


          records.forEach((item, index) => {

    const amount = item.qty && item.unit_price ? item.qty * item.unit_price : 0;
    const row = `
        <tr>
            <td>${index + 1}</td> <!-- Nomor urut -->
            <td>${item.nama_barang || ""}</td>
            <td>${item.part_number || ""}</td>
           <td>${item.qty ? item.qty.toLocaleString('id-ID') : ""}</td>
            <td>${item.unit_price ? item.unit_price.toLocaleString('id-ID') : ""}</td>
           <td>${(item.qty * item.unit_price).toLocaleString('id-ID')}</td>
            <td style="${item.is_batal === 'batal' 
                          ? 'color:red; font-weight:bold;' 
                          : 'color:green; font-weight:bold;'}">
              ${item.is_batal === "batal" 
                  ? "❌ Batal" 
                  : "✅ Ok"}
            </td>

        </tr>`;
    tbody.append(row);

        grandTotal += amount;
});
    // setelah semua rows ditambahkan
    const ppn11 = grandTotal * 0.11; // 11% PPN
    const netTotal = grandTotal + ppn11;

    // tampilkan di DOM
    $("#grandtotal").text(`Grand Total : ${grandTotal.toLocaleString('id-ID')}`);
    $("#ppn_11\\%").text(`PPN 11% : ${ppn11.toLocaleString('id-ID')}`);
    $("#grandtotal_ppn").text(netTotal.toLocaleString('id-ID'));


        }
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal mengambil detail data", "error");
    } finally {
        $("#loading").hide();
    }
}
loginUser()