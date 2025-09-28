const pb = new PocketBase(pocketbaseUrl);

$(document).ready(function () {
  $("#navbar-container").load("../../component/nav.html", async function () {
    try {
      // login dulu
      await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

      // ambil id dari query string
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");

      if (!id) {
        Swal.fire("Error", "Parameter ?id tidak ditemukan!", "error");
        return;
      }

      // tampilkan preloader

      const records = await pb.collection("sales_order_do").getFullList({
        filter: `no_do="${id}"`
      });

     
      if (!records || records.length === 0) {
        Swal.fire("Not Found", `Sales Order dengan no_do ${id} tidak ditemukan`, "warning");
        return;
      }

      // ambil record pertama
      const record = records[0];

      // === generate barcode dari no_do ===
      $("#bar_code_do").html(`<svg id="barcodeDO"></svg>`);
      JsBarcode("#barcodeDO", record.no_do, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: true
      });

      // default sementara
      let driverName = "menunggu data driver...";
      let alamatText = "menunggu data alamat...";

      // tampilkan header awal
      $("#soHeader").html(`
        <div style="display:flex; gap:10px; margin:10px 0;">
          <!-- Kotak 1 -->
          <div style="flex:1; border:1px solid black;padding:5px">
            <p> 
              <strong>Ship to:</strong> ${record.customer_name} <br/>
              <span id="customer_alamat">${alamatText}</span>
            </p>
          </div>

          <!-- Kotak 2 -->
          <div style="flex:1; border:1px solid black;padding:5px ">
            <p><strong>No PO:</strong> ${record.no_po}</p>
            <p><b>Sales :</b> ${record.sales}</p>
            <p><strong>Invoice to:</strong> <br/> ${record.customer_name}</p>
          </div>

          <!-- Kotak 3 -->
          <div style="flex:1; border:1px solid black; ">
            <h5 style="text-align:center"><strong>Delivery Order: <br/> ${record.kode_depan} ${record.no_do}</strong></h5>
          <strong>Tgl Schedule:</strong> ${record.tgl_schedule} <br/>
              <strong>Driver:</strong> <span id="driver_name">${driverName}</span><br/>
              
          </div>
        </div>
      `);

      // disable tombol print
      $("#btnPrint").prop("disabled", true);

      // === ambil driver ===
      try {
        const driverRecord = await pb.collection("sales_order_driver").getOne(record.driver);
        if (driverRecord && driverRecord.nama) {
          driverName = driverRecord.nama;
          $("#driver_name").text(driverName);
        }
      } catch (err) {
        console.error("Gagal load driver:", err);
      }

      // === ambil alamat customer ===
      try {
        const customerRecords = await pb.collection("sales_customer").getFullList({
          filter: `nama_pt="${record.customer_name}"`
        });

        if (customerRecords && customerRecords.length > 0) {
          const customer = customerRecords[0];
          alamatText = `${customer.alamat} ${customer.no_telp ? "Telp: " + customer.no_telp : ""}`;
          $("#customer_alamat").html(alamatText);
        } else {
          $("#customer_alamat").html("<em>Alamat tidak ditemukan</em>");
        }
      } catch (err) {
        console.error("Gagal load alamat customer:", err);
        $("#customer_alamat").html("<em>Error load alamat</em>");
      }

      // aktifkan tombol print setelah driver & alamat selesai
      $("#btnPrint").prop("disabled", false);

      // tampilkan data_barang di tabel
      let rows = "";
      let dataBarang = record.data_barang;

      // jika masih string, parse JSON
      if (typeof dataBarang === "string") {
        try {
          dataBarang = JSON.parse(dataBarang);
        } catch (e) {
          console.error("Gagal parse data_barang:", e);
          Swal.fire("Error", "Format data_barang tidak valid", "error");
          return;
        }
      }

      dataBarang.forEach((item, index) => {
        rows += `
          <tr>
            <td>${index + 1}</td>
            <td>${item.part_number}</td>
            <td>${item.nama_barang}</td>
            <td>${item.qty}</td>
            <td>${item.shipped}</td>
            <td>${item.backorder}</td>
          </tr>
        `;
      });

      $("#dataBarangBody").html(rows);
       // sembunyikan preloader setelah data didapat
      $("#preloader").hide();

    } catch (err) {
      console.error("Error load detail:", err);
      Swal.fire("Error", "Gagal memuat data", "error");
    }
  });
});
