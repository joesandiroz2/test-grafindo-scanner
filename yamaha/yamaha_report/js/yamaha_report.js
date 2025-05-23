const pb = new PocketBase(pocketbaseUrl);
let currentPage = 1;
const perPage = 500;



async function fetchReportData() {
  $("#loading").show();
  $("#report-container").empty();
  $("#current-page").text(`Halaman: ${currentPage}`);

  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    const result = await pb.collection("yamaha_kartu_stok").getList(currentPage, perPage, {
      sort: "-created",
      filter:"status ='keluar'"
    });

    const grouped = {};

    result.items.forEach(item => {
      if (!grouped[item.no_do]) grouped[item.no_do] = {};
      const group = grouped[item.no_do];

      if (!group[item.part_number]) {
        group[item.part_number] = {
          ...item,
          qty_scan: parseInt(item.qty_scan) || 0,
          qty_do: parseInt(item.qty_do) || 0,
            lot: item.lot || 0 
        };
      } else {
        group[item.part_number].qty_scan += parseInt(item.qty_scan) || 0;
        group[item.part_number].qty_do += parseInt(item.qty_do) || 0;
      }
    });

    renderReport(grouped);

    // Atur ulang tombol next/prev
    $("#prev-page").prop("disabled", currentPage <= 1);
    $("#next-page").prop("disabled", currentPage >= result.totalPages);

  } catch (error) {
    console.error("Gagal mengambil data:", error);
    Swal.fire("Gagal", "Gagal mengambil data laporan!", "error");
  } finally {
    $("#loading").hide();
  }
}

function renderReport(data) {
  let html = "";

  for (const no_do in data) {
    const partno = Object.keys(data[no_do]);
const firstItem = data[no_do][partno[0]];
const kodeDepan = firstItem.kode_depan;

    html += `
      <div class="card mb-4">
        <div class="card-header fw-bold bg-grey text-black">
          ${kodeDepan}  ${no_do}
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-bordered mb-0">
              <thead class="table-secondary">
                <tr>
                  <th>No</th>
                  <th>Part Number</th>
                  <th>Nama Barang</th>
                  <th>Qty DO</th>
                  <th>Qty Scan</th>
                  <th>Lot</th>
                  <th>Remarks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
    `;

    const partNumbers = Object.keys(data[no_do]);
    partNumbers.forEach((part_number, index) => {
      const item = data[no_do][part_number];
      const status = item.qty_do === item.qty_scan ? "ok" : "not ok";
      console.log(item)
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.part_number}</td>
          <td>${item.nama_barang}</td>
          <td>${item.qty_do}</td>
          <td>${item.qty_scan}</td>
          <td>${item.lot}</td>
          <td>${item.remarks}</td>
          <td class="fw-bold ${status === "ok" ? "text-success" : "text-danger"}">
            ${status}
          </td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  $("#report-container").html(html);
}

// Event tombol paginasi
$(document).on("click", "#next-page", () => {
  currentPage++;
  fetchReportData();
});
$(document).on("click", "#prev-page", () => {
  if (currentPage > 1) currentPage--;
  fetchReportData();
});

fetchReportData()