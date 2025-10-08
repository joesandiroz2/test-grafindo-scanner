$(document).ready(async function () {
  const apiUrl = `${pocketbaseUrl}/api/collections/other_unik_partnumber/records`;
  const pb = new PocketBase(pocketbaseUrl);
  
  let currentPage = 1;
  let totalPages = 1;
  let lastPartNumber = "";
  let perPage = 150;

  // fetch semua parts untuk select2
  async function fetchAllParts() {
    let allItems = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(`${apiUrl}?page=${page}&perPage=50`);
      const data = await res.json();

      allItems = allItems.concat(data.items);
      totalPages = data.totalPages;

      $("#loadingText").text(
        `Sedang memuat partnumber... ${allItems.length} dari ${data.totalItems}`
      );

      page++;
    } while (page <= totalPages);
    $("#loadingText").hide();

    return allItems;
  }

  // render select2
  const items = await fetchAllParts();
  const formattedData = [
    { id: "", text: "Pilih part nomor" }, // default
    ...items.map((item) => ({
      id: item.part_number,
      text: `${item.part_number} - ${item.nama_barang}`,
    })),
  ];

  $("#partSelect").select2({
    placeholder: "Cari part number...",
    data: formattedData,
    allowClear: true,
    width: "100%",
  });

  // event ketika select berubah
  $("#partSelect").on("change", async function () {
    const partNumber = $(this).val();
    if (!partNumber) {
      $("#resultTable tbody").empty();
      return;
    }

    lastPartNumber = partNumber;

    try {
      Swal.fire({
        title: "Sedang mengecek stok...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Ambil dulu totalPages untuk partNumber ini
      const firstPage = await pb.collection("others_kartu_stok").getList(1, perPage, {
        filter: `part_number="${partNumber}"`,
      });

      totalPages = firstPage.totalPages;
      currentPage = totalPages; // langsung lompat ke page terakhir

      const records = await pb.collection("others_kartu_stok").getList(currentPage, perPage, {
        filter: `part_number="${partNumber}"`,
      });

      renderTable(records);
      Swal.close();
    } catch (err) {
      console.error("Error ambil data kartu stok:", err);
    }
  });

  // Tombol sebelumnya
  $("#prevBtn").on("click", async function () {
    if (!lastPartNumber) return;
    if (currentPage <= 1) return; // sudah di page 1, tidak bisa mundur lagi

    currentPage--;

    try {
      Swal.fire({
        title: "Sedang memuat data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const records = await pb.collection("others_kartu_stok").getList(currentPage, perPage, {
        filter: `part_number="${lastPartNumber}"`,
      });

      renderTable(records);
      Swal.close();
    } catch (err) {
      console.error("Error ambil data kartu stok:", err);
    }
  });

  function renderTable(records) {
  const tbody = $("#resultTable tbody");
  tbody.empty();

  if (records.items.length === 0) {
    tbody.append(
      `<tr><td colspan="8" class="text-center text-muted">Tidak ada data</td></tr>`
    );
    return;
  }

  records.items.forEach((rec, i) => {
    let statusClass = "";
    if (rec.status?.toLowerCase() === "keluar") {
      statusClass = 'style="color:red;font-weight:bold"';
    } else if (rec.status?.toLowerCase() === "masuk") {
      statusClass = 'style="color:green;font-weight:bold"';
    }

    let balanceClass = "";
    if (parseFloat(rec.balance) < 0) {
      balanceClass = 'style="color:red;font-weight:bold"';
    }else{
      balanceClass = 'style="color:black;font-weight:bold"';

    }

    // Format created → "22 Mei 2025 09:50"
    const createdDate = new Date(rec.created);
    const formattedDate = createdDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const formattedTime = createdDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    tbody.append(`
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight:bold;color:purple">${rec.qty_masuk || 0}</td>
        <td ${balanceClass}>${rec.balance}</td>
        <td style="font-weight:bold;color:red">${rec.qty || 0} </td>
        <td>${rec.part_number}</td>
        <td>${rec.nama_barang}</td>
        <td>${rec.lot}</td>
        <td>${rec.no_po}</td>
        <td>${rec.kode_depan + rec.no_do}</td>
        <td>${formattedDate} ${formattedTime}</td>
        <td ${statusClass}>${rec.status}</td>
      </tr>
    `);
  });
}

});
