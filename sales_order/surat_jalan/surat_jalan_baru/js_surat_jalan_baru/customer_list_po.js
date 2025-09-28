async function initCustomerSelect() {
  let customers = await fetchAllCustomers();
  $("#search_customer").select2({
    placeholder: "Cari Customer...",
    allowClear: true,
    data: customers.map(c => ({
      id: c.id,
      text: c.nama_pt
    }))
  });
}


initCustomerSelect();
// listener kalau user pilih customer
// listener kalau user pilih customer
$("#search_customer").on("change", async function () {
  let customerId = $(this).val();
  if (!customerId) {
    $("#select_po_list").empty().append(`<option value="">Tidak ada PO</option>`);
    return;
  }

  // kasih indikator loading dulu
  $("#select_po_list").empty().append(`<option>Memuat PO...</option>`);

      try {
        // login dulu
        await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

        // ambil sales_order berdasarkan customer_id
       // ambil semua sales_order berdasarkan customer_id
    const result = await pb.collection("sales_order").getFullList({
      filter: `customer_id = "${customerId}"`,
      sort: "-created"
    });

    // kosongin dulu select_po_list
    let $poSelect = $("#select_po_list");
    $poSelect.empty();

    if (result.length === 0) {
      $poSelect.append(`<option value="">Belum ada PO</option>`);
      return;
    }
  
   // --- tambahkan default option ---
    $poSelect.append(`<option value="">Pilih No PO</option>`);


    // filter PO unik
    let uniquePo = [...new Set(result.map(item => item.no_po))];

    // tambahkan option berdasarkan no_po unik
    uniquePo.forEach(no_po => {
      $poSelect.append(
        `<option value="${no_po}">${no_po || "(No PO kosong)"}</option>`
      );
    });

    // aktifkan select2 biar bagus
    $poSelect.select2({
      placeholder: "Pilih Nomor PO...",
      allowClear: true,
      width: "100%"
    });


  } catch (err) {
    console.error("Gagal ambil sales_order:", err);
    $("#select_po_list").empty().append(`<option value="">Gagal memuat PO</option>`);
  }
});




// listener kalau user pilih PO
$("#select_po_list").on("change", async function () {
  let noPo = $(this).val();
  let customerId = $("#search_customer").val();
  let $table = $("#list_daftar_part");

  if (!noPo || !customerId) {
    $table.html(`<tr><td colspan="6" class="text-center text-muted">Belum ada data</td></tr>`);
    $("#tgl_schedule_div").text("-");
    return;
  }

  try {

     // --- tampilkan preloader dulu ---
  $table.html(`
    <tr>
      <td colspan="7" class="text-center">
         <div class="spinner-border text-primary" role="status" ></div>
        <br/>
        <h5>Sedang mengambil data tabel...</h5>
      </td>
    </tr>
  `);

    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil semua part berdasarkan no_po
    const parts = await pb.collection("sales_order").getFullList({
      filter: `customer_id = "${customerId}" && no_po = "${noPo}"`,
      sort: "-created"
    });

    if (parts.length === 0) {
      $table.html(`<tr><td colspan="6" class="text-center text-muted">Tidak ada data part untuk PO ini</td></tr>`);
      $("#tgl_schedule_div").text("-");
      return;
    }

    // --- Ambil 1 tgl_schedule dari data pertama ---
    let firstSchedule = parts[0].tgl_schedule;
    if (firstSchedule) {
      let d = new Date(firstSchedule);
      let formattedDate = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      $("#tgl_schedule_div").text(formattedDate);
    } else {
      $("#tgl_schedule_div").text("-");
    }

    // --- Render tabel ---
   // --- Render tabel ---
      let html = `
        <thead class="table-primary">
          <tr>
            <th>No</th>
            <th>No PO</th>
            <th>Part Number</th>
            <th>Nama Barang</th>
            <th>Qty</th>
            <th>Shipped</th>
            <th>Back Order</th>
          </tr>
        </thead>
        <tbody>
      `;

      parts.forEach((item, index) => {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td style="font-weight:bold">${item.no_po || "-"}</td>
            <td style="font-weight:bold">${item.part_number || "-"}</td>
            <td>${item.nama_barang || "-"}</td>
            <td>${item.qty || "-"}</td>
            <td>
              <input type="number" 
                     class="form-control shipped-input"
                     data-qty="${item.qty || 0}" 
                     min="0" 
                     max="${item.qty || 0}"
                     style="width:100px"/>
            </td>
            <td>
              <input type="number" 
                     class="form-control backorder-input" 
                     value="${item.qty || 0}" 
                     disabled 
                     style="width:100px;color:red;font-weight:bold"/>
            </td>
          </tr>
        `;
      });

      html += `</tbody>`;
      $table.html(html);

      // --- Event listener untuk hitung otomatis ---
      $(".shipped-input").on("input", function () {
        let qty = parseInt($(this).data("qty")) || 0;
        let shipped = parseInt($(this).val()) || 0;
        let $backorder = $(this).closest("tr").find(".backorder-input");

        if (shipped > qty) {
          Swal.fire("input Shiped kebanyakan dari qty order", "Shipped tidak boleh lebih dari Qty", "error");
          shipped = qty;
          $(this).val(qty);
        }

        let backorder = qty - shipped;
        $backorder.val(backorder);
      });


  } catch (err) {
    console.error("Gagal ambil part by PO:", err);
    Swal.fire("Error", "Tidak bisa ambil data part", "error");
    $table.html(`<tr><td colspan="6" class="text-center text-danger">Error ambil data</td></tr>`);
    $("#tgl_schedule_div").text("-");
  }
});
