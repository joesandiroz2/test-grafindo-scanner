// Fungsi generate UID unik
function generateUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'uid-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

$(document).ready(function () {
  $("#buatdo").on("click", async function () {

     const $btn = $(this);
    const originalText = $btn.text();

    try {
        // disable tombol & ubah teks
      $btn.prop("disabled", true).text("Sedang membuat DO...");

      let kodeDepan = $("#pilih_kode_depan").val();
      let noDo = $("#no_do_generate").text().trim();
      let customerId = $("#search_customer").val();
      let noPo = $("#select_po_list").val();
      let driver = $("#select_driver_list").val();
      let sales = $("#input_sales").val().trim();
      let tglSchedule = $("#tgl_schedule_div").text().trim();

      // ✅ Validasi field wajib
      let errors = [];
      if (!noDo) errors.push("Nomor DO belum digenerate");
      if (!kodeDepan) errors.push("Kode Depan belum dipilih");
      if (!customerId) errors.push("Customer belum dipilih");
      if (!noPo) errors.push("No PO belum dipilih");
      if (!driver) errors.push("Driver belum dipilih");
      if (!sales) errors.push("Nama Sales belum diisi");
      if (!tglSchedule) errors.push("Tanggal Schedule belum ada");

      if (errors.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Ada Inputan Form Belum keisi",
          html: `<ul style="text-align:left">${errors
            .map((e) => `<li>${e}</li>`)
            .join("")}</ul>`,
        });
        return; // stop proses
      }

      // --- Ambil data dari tabel ---
      let dataBarang = [];
      $("#list_daftar_part tbody tr").each(function () {
        let row = $(this);
        let qty = parseInt(row.find("td:eq(4)").text().trim()) || 0;
        let shipped = parseInt(row.find("td:eq(5) input").val()) || 0;
        let backorder = parseInt(row.find("td:eq(6) input").val()) || 0;

        let obj = {
          uid: generateUID(),
          no_po: row.find("td:eq(1)").text().trim(),
          part_number: row.find("td:eq(2)").text().trim(),
          nama_barang: row.find("td:eq(3)").text().trim(),
          qty: qty,
          shipped: shipped,
          backorder: backorder || (qty - shipped),
        };
        dataBarang.push(obj);
      });

      // --- Data untuk PocketBase ---
      const data = {
        kode_depan: kodeDepan,
        no_do: noDo,
        customer_name: $("#search_customer option:selected").text(),
        no_po: noPo,
        sales: sales,
        driver: driver,
        tgl_schedule: tglSchedule,
        data_barang: JSON.stringify(dataBarang),
      };

      await pb.collection("sales_order_do").create(data);

      Swal.fire("Sukses", "Delivery Order berhasil dibuat!", "success").then(
        () => {
          location.reload();
        }
      );
    } catch (err) {
      console.error("Gagal buat DO:", err);
      Swal.fire("Error", "Tidak bisa membuat Delivery Order", "error");
    }finally {
      // kembalikan tombol ke normal
      $btn.prop("disabled", false).text(originalText);
    }
  });
});
