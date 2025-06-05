const pb = new PocketBase(pocketbaseUrl);
let currentPage = 1;
const perPage = 500;


async function fetchReportData() {
  $("#loading").show();
  $("#progress-bar").css("width", "0%").attr("aria-valuenow", 0).text("0%");
  $(".progress").show();
  $("#loading-text").text("Sedang Mengambil Report data...");
  $("#report-container").empty();
  $("#current-page").text(`Halaman: ${currentPage}`);

  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    const unikNoDoResult = await pb.collection("yamaha_unik_no_do").getList(currentPage, perPage,{
      sort:"-created"
    });
    console.log(unikNoDoResult)
    const grouped = {};
    const totalItems = unikNoDoResult.items.length;

    for (let i = 0; i < totalItems; i++) {
      const unikItem = unikNoDoResult.items[i];
      const no_do = unikItem.no_do;

      // Ambil data dari kartu stok dengan filter status=keluar dan no_do = item.no_do
      const kartuStokItems = await pb.collection("yamaha_kartu_stok").getFullList({
        filter: `no_do="${no_do}"`
      });

      if (!grouped[no_do]) grouped[no_do] = {};

      for (const stok of kartuStokItems) {
        const part_number = stok.part_number;

        if (!grouped[no_do][part_number]) {
          grouped[no_do][part_number] = {
            ...stok,
            qty_scan: parseInt(stok.qty_scan) || 0,
            qty_do: parseInt(stok.qty_do) || 0,
            lot: stok.lot || 0
          };
        } else {
          grouped[no_do][part_number].qty_scan += parseInt(stok.qty_scan) || 0;
        }
      }

      // Update progress bar
      const progressPercent = Math.round(((i + 1) / totalItems) * 100);
      $("#progress-bar").css("width", progressPercent + "%").attr("aria-valuenow", progressPercent).text(progressPercent + "%");
    }

    renderReport(grouped);

    $("#prev-page").prop("disabled", currentPage <= 1);
    $("#next-page").prop("disabled", currentPage >= unikNoDoResult.totalPages);

  } catch (error) {
    console.error("Gagal mengambil data:", error);
    Swal.fire("Gagal", "Gagal mengambil data laporan! coba refresh dan coba lagi", "error");
  } finally {
    // Sembunyikan loading dan progress bar saat selesai
    $("#loading").hide();
    $(".progress").hide();
  }
}



function renderReport(data) {
  let html = "";

  for (const no_do in data) {
    const partno = Object.keys(data[no_do]);
const firstItem = data[no_do][partno[0]];
const jumlah_barang = parseInt(firstItem.jumlah_barang) || 0;
const kodeDepan = firstItem.kode_depan;
const tgl_do = firstItem.tgl_do;

// Cek status OK/NG untuk DO ini
  let countOk = 0;
  partno.forEach(key => {
    const item = data[no_do][key];
    if (item.qty_do === item.qty_scan) countOk++;
  });
const statusDo = countOk === jumlah_barang ? "OK" : "Not FULL";
const statusColor = statusDo === "OK" ? "text-success" : "text-danger";

    html += `
      <div class=" mt-2">
        <div class="fw-bold " style="background-color:#e0e0e0 !important">
          <div class="row">
              <div class="col-md-3 col-xl-3 col-sm-12">
                <h4 style="font-weight:bold">${kodeDepan}  ${no_do}</h4>
              </div>
          <div class="col-md-3 col-xl-3 col-sm-12">
                <h6 style="font-weight:bold"> Tgl DO : ${tgl_do}</h6>
              </div>
            <div class="col-md-3 col-xl-3 col-sm-12">
                jumlah barang  : ${jumlah_barang}
              </div>
           <div class="col-md-3 col-xl-3 col-sm-12 fw-bold ${statusColor}">
             <h4 style="font-weight:bold">${statusDo}</h4>
            </div>
          <div>
        </div>
        <div>
          <div class="table-responsive">
            <table 
            style="border-bottom:3px solid black"
            class="table table-bordered">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Part Number</th>
                  <th>Nama Barang</th>
                  <th>Qty DO</th>
                  <th>Qty Scan</th>
                  <th>Lot</th>
                  <th>Remarks</th>
                  <th>Tgl Scan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
    `;

    const partNumbers = Object.keys(data[no_do]);
    partNumbers.forEach((part_number, index) => {
      const item = data[no_do][part_number];
      const status = item.qty_do === item.qty_scan ? "ok" : "not Full";
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.part_number}</td>
          <td>${item.nama_barang}</td>
          <td>${item.qty_do}</td>
          <td>${item.qty_scan}</td>
          <td>${item.lot}</td>
          <td>${item.remarks}</td>
          <td><i>${formatTanggal(item.created)}</i></td>

          <td >
            <h6 style="font-size:17px" class="fw-bold ${status === "ok" ? "text-white text-center bg-success" : "text-danger"}">${status}</h6>
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


function formatTanggal(tgl) {
  if (!tgl) return "";
  const date = new Date(tgl);
  if (isNaN(date)) return tgl;

  const hari = date.getDate(); // tanggal
  const bulan = date.toLocaleString("id-ID", { month: "long" }); // nama bulan bahasa Indonesia
  const tahun = date.getFullYear();

  const jam = date.getHours().toString().padStart(2, "0");
  const menit = date.getMinutes().toString().padStart(2, "0");

  return `${hari} ${bulan} ${tahun} ${jam}:${menit}`;
}


fetchReportData()
