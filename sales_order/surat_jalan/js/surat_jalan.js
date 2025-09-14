let pb;

function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// login dulu sebelum query
async function loginUser() {
    try {
        pb = new PocketBase(pocketbaseUrl);

        // auth password
        const authData = await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("Login sukses", authData);

        // setelah login → load detail
        loadDetail_surat_jalan();
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal login ke PocketBase", "error");
    }
}

async function loadDetail_surat_jalan() {
    const params = new URLSearchParams(window.location.search);
    const no_do = params.get("id");

    if (!no_do) {
        Swal.fire("Error", "Parameter no_do tidak ditemukan di URL", "error");
        return;
    }

    $("#no_do").text(no_do);
    $("#loading").show();
    $("#detail-body").html(`<tr><td colspan="13" class="text-center">Loading...</td></tr>`);

    let onlyNumber = no_do.includes("-") ? no_do.split("-")[1] : no_do;

    JsBarcode("#bar_code", onlyNumber, {
      format: "CODE128",
      lineColor: "#000",
      width: 2,
      height: 50,
      displayValue: true
    });

    try {
        // ambil semua record dengan no_do
        const records = await pb.collection("sales_order").getFullList({
            filter: `no_do="${no_do}"`,
            sort: "-created"
        });

        const tbody = $("#detail-body");
        tbody.empty();

        if (records.length === 0) {
            tbody.append(`<tr><td colspan="13" class="text-center">Data tidak ditemukan</td></tr>`);
            return;
        }

        // tampilkan no_po dan salesman dari record pertama
        const firstItem = records[0];
        $("#no_po").text(firstItem.no_po || "-");
        $("#salesman").text(firstItem.sales || "-");
        $("#tgl_schedule").text(firstItem.tgl_schedule || "-");

        // ---- ambil data customer berdasarkan customer_id ----
        if (firstItem.customer_id) {
          try {
            const customer = await pb.collection("sales_customer").getOne(firstItem.customer_id);
            $("#cust_pt").text(customer.nama_pt || "-");
            $("#cust_alamat").text(customer.alamat || "-");
            $("#cust_telp").text(customer.no_telp || "-");
          } catch (err) {
            console.error("Gagal ambil customer:", err);
            $("#cust_pt").text("-");
            $("#cust_alamat").text("-");
            $("#cust_telp").text("-");
          }
        }

        // render tabel
        records.forEach((item, index) => {
            const shippedVal = item.shipped || 0;
            const backOrderVal = item.back_order || (item.qty - shippedVal);

            const isFull = item.qty === shippedVal;
            const qtyStyle = isFull ? "color:green; font-weight:bold;" : "";
            const shippedStyle = isFull ? "color:green; font-weight:bold;" : "";
            const fullText = isFull
                ? `<span style="color:green; font-weight:bold;">Full</span>`
                : `<span style="color:red; font-weight:bold;">Blm</span>`;
             const updatedFormatted = formatDate(item.updated);

            const row = `
                <tr data-id="${item.id}" data-qty="${item.qty}">
                    <td>${index + 1}</td>
                    <td>${item.nama_barang || ""}</td>
                    <td>${item.part_number || ""}</td>
                    <td style="${qtyStyle}">${item.qty ? item.qty.toLocaleString('id-ID') : ""}</td>
                    
                    <!-- Input shipped + error -->
                    <td style="${shippedStyle}">
                      <input type="number" class="form-control form-control-sm shipped-input" 
                             value="${shippedVal}" min="0" max="${item.qty}">
                      <div class="text-danger small error-message" style="display:none;">
                        anda input shipped melebihi qty
                      </div>
                    </td>
                    
                    <!-- Back order otomatis -->
                    <td>
                      <input type="number" class="form-control form-control-sm backorder-input" 
                             value="${backOrderVal}"
                    style="color:red;font-weight:bold"
                              readonly>
                    </td>
                    <td>${updatedFormatted}</td>

                    <!-- Kolom Full -->
                    <td class="full-status">${fullText}</td>
                    
                    <td>
                      <button class="btn btn-info btn-update">Perbarui</button>
                    </td>
                </tr>`;
            tbody.append(row);
        });

        // event listener untuk hitung back_order otomatis + validasi + update kolom Full
        $("#detail-body").on("input", ".shipped-input", function () {
            const row = $(this).closest("tr");
            const qty = parseInt(row.data("qty")) || 0;
            let shipped = parseInt($(this).val()) || 0;
            const errorMsg = row.find(".error-message");

            if (shipped > qty) {
                shipped = qty;
                $(this).val(qty);
                errorMsg.show();
            } else {
                errorMsg.hide();
            }

            const backOrder = qty - shipped;
            row.find(".backorder-input").val(backOrder >= 0 ? backOrder : 0);

            // update style dan kolom Full
            if (shipped === qty) {
                row.find("td:eq(3)").css({"color":"green","font-weight":"bold"});
                row.find(".shipped-input").css({"color":"green","font-weight":"bold"});
                row.find(".full-status").html(`<span style="color:green; font-weight:bold;">Full</span>`);
            } else {
                row.find("td:eq(3)").css({"color":"","font-weight":""});
                row.find(".shipped-input").css({"color":"","font-weight":""});
                row.find(".full-status").html(`<span style="color:red; font-weight:bold;">Blm</span>`);
            }
        });

        // event listener tombol perbarui
        $("#detail-body").on("click", ".btn-update", async function () {
            const row = $(this).closest("tr");
            const id = row.data("id");
            const shipped = parseInt(row.find(".shipped-input").val()) || 0;
            const backOrder = parseInt(row.find(".backorder-input").val()) || 0;

            try {
                await pb.collection("sales_order").update(id, {
                    shipped: shipped,
                    back_order: backOrder
                });

                Swal.fire("Sukses", "Data berhasil diperbarui", "success");
            } catch (err) {
                console.error(err);
                Swal.fire("Error", "Gagal update data", "error");
            }
        });

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal mengambil detail data", "error");
    } finally {
        $("#loading").hide();
    }
}

loginUser();
