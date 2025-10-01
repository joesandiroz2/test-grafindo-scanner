$(document).ready(async function () {
  const apiUrl = `${pocketbaseUrl}/api/collections/other_unik_partnumber/records`;
  const pb = new PocketBase(pocketbaseUrl);

  // fungsi fetch semua halaman untuk select2
  async function fetchAllParts() {
    let allItems = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(`${apiUrl}?page=${page}&perPage=50`);
      const data = await res.json();

      allItems = allItems.concat(data.items);
      totalPages = data.totalPages;

       // update loading text
      $("#loadingText").text(`Sedang memuat partnumber... ${allItems.length} dari ${data.totalItems}`);

      page++;
    } while (page <= totalPages);
     $("#loadingText").hide(); // atau .remove();

    return allItems;
  }

  // render select2
  const items = await fetchAllParts();
 const formattedData = [
  { id: "", text: "Pilih part nomor" }, // default
  ...items.map(item => ({
    id: item.part_number,
    text: `${item.part_number} - ${item.nama_barang}`
  }))
];


  // inisialisasi select2
  $("#partSelect").select2({
    placeholder: "Cari part number...",
    data: formattedData,
    allowClear: true,
    width: "100%"
  });

  // ✅ pilih default part_number pertama (kalau ada)
  if (formattedData.length > 0) {
    const defaultPart = formattedData[0].id;

    // set val + trigger supaya select2 bener-bener update tampilan
    $("#partSelect")
      .val(defaultPart)
      .trigger("change")          // untuk event kita
      .trigger("change.select2"); // untuk tampilan select2
  }

  // event ketika select berubah
  $("#partSelect").on("change", async function () {
    const partNumber = $(this).val();
    if (!partNumber) {
      $("#resultTable tbody").empty();
      return;
    }

      const perPage = parseInt($("#limitSelect").val()) || 50; // ambil limit dari select
  

    try {
      // ambil data dari others_kartu_stok dengan filter part_number
     // ambil data dari others_kartu_stok dengan filter part_number
      const records = await pb.collection("others_kartu_stok").getList(1,perPage, {
        filter: `part_number="${partNumber}"`,
        sort: "-created"
      });


      // render ke tabel
      renderTable(records);
    } catch (err) {
      console.error("Error ambil data kartu stok:", err);
    }
  });

  function renderTable(records) {
    const tbody = $("#resultTable tbody");
    tbody.empty();

    if (records.length === 0) {
      tbody.append(`<tr><td colspan="8" class="text-center text-muted">Tidak ada data</td></tr>`);
      return;
    }

    records.items.forEach((rec, i) => {
      // 🎨 style untuk status
      let statusClass = "";
      if (rec.status?.toLowerCase() === "keluar") {
        statusClass = 'style="color:red;font-weight:bold"';
      } else if (rec.status?.toLowerCase() === "masuk") {
        statusClass = 'style="color:green;font-weight:bold"';
      }

      // 🎨 style untuk balance
      let balanceClass = "";
      if (parseFloat(rec.balance) < 0) {
        balanceClass = 'style="color:red;font-weight:bold"';
      }

      tbody.append(`
        <tr>
          <td>${i + 1}</td>
          <td ${statusClass}>${rec.status} ${rec.qty}</td>
          <td ${balanceClass}>${rec.balance}</td>
          <td>${rec.part_number}</td>
          <td>${rec.nama_barang}</td>
          <td>${rec.lot}</td>
          <td>${rec.no_po}</td>
          <td>${rec.kode_depan + rec.no_do}</td>
        </tr>
      `);
    });
  }
});
