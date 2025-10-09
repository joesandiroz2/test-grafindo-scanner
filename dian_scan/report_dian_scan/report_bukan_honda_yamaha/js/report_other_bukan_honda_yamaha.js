// fungsi login
async function loginUser() {
  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
    console.log("Login success!");
    loadReportOther(1, 50); // mulai dari page 1, 50 data
  } catch (err) {
    console.error("Login gagal:", err);
    Swal.fire("Error", "Gagal login ke server", "error");
  }
}


// Format tanggal ke gaya Indonesia: 22 Mei 2025 05:40
function formatTanggalIndo(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);

  // Nama bulan dalam bahasa Indonesia
  const bulanIndo = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const hari = String(date.getDate()).padStart(2, "0");
  const bulan = bulanIndo[date.getMonth()];
  const tahun = date.getFullYear();

  const jam = String(date.getHours()).padStart(2, "0");
  const menit = String(date.getMinutes()).padStart(2, "0");

  return `${hari} ${bulan} ${tahun} ${jam}:${menit}`;
}


// ambil data dari others_kartu_stok
async function loadReportOther(page = 1, perPage = 50) {
  try {
    const progressBar = $("#progress_bar");
    const progressInner = $("#progress_bar_inner");

    // reset progress bar
    progressBar.show();
    progressInner.css("width", "0%")
      .attr("aria-valuenow", 0)
      .text("0%");

    // 1. Ambil daftar awal DO
    const list = await pb.collection("others_kartu_stok").getList(page, perPage, {
      sort: "-created"
    });

    if (list.items.length === 0) {
      $("#list_report_other").html(
        `<div class="alert alert-warning">Belum ada data report</div>`
      );
      progressBar.hide();
      return;
    }

    // 2. Ambil no_do unik dari page ini
    const noDOs = [...new Set(list.items.map(item => item.no_do))];
    let allGroups = {};

    // 3. Loop setiap no_do → ambil semua detail
    for (let i = 0; i < noDOs.length; i++) {
      const noDO = noDOs[i];

      const details = await pb.collection("others_kartu_stok").getFullList({
        filter: `no_do="${noDO}"`,
        sort: "created"
      });

      if (details.length > 0) {
        const key = details[0].kode_depan + details[0].no_do;
        allGroups[key] = details;
      }

      // update progress bar
      let percent = Math.round(((i + 1) / noDOs.length) * 100);
      progressInner.css("width", percent + "%")
        .attr("aria-valuenow", percent)
        .text(percent + "%");
    }

    // 4. Render hasil
    let html = "";

    Object.keys(allGroups).forEach(noDO => {
      html += `
        <div class="card my-3">
          <div class="card-header bg-dark text-white fw-bold">
            <h4>${noDO}</h4>
          </div>
          <div class="card-body p-0">
            <table class="table table-bordered table-striped m-0">
              <thead class="table-secondary">
                <tr>
                  <th>No</th>
                  <th>Part Number</th>
                  <th>Nama Barang</th>
                  <th>Lot</th>
                  <th>Qty DO</th>
                  <th>Total Qty</th>
                  <th>created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
      `;

      const mapParts = {};
      allGroups[noDO].forEach(item => {
        const key = item.part_number + "|" + (item.lot || "");
        if (!mapParts[key]) {
          mapParts[key] = {
            part_number: item.part_number,
            nama_barang: item.nama_barang,
            lot: item.lot || "-",
            total_qty: 0,
            status: item.status,
            created:item.created,
            qty_minta: parseInt(item.qty_minta, 10) || 0
          };
        }
  mapParts[key].total_qty += parseInt(item.qty && item.qty !== "" ? item.qty : item.qty_masuk, 10) || 0;

      });

      let i = 1;
      Object.values(mapParts).forEach(p => {
        console.log(p)
        html += `
          <tr>
            <td>${i++}</td>
            <td style="font-weight:bold">${p.part_number}</td>
            <td style="font-weight:bold">${p.nama_barang}</td>
            <td>${p.lot}</td>
            <td>${p.qty_minta}</td>
            <td class="fw-bold">${p.total_qty}</td>
          <td class="fw-italic">${formatTanggalIndo(p.created)}</td>

           <td style="${
            p.status
              ? p.status.toLowerCase() === 'masuk'
                ? 'background-color:green;color:white;font-weight:bold'
                : p.status.toLowerCase() === 'keluar'
                  ? 'background-color:red;color:white;font-weight:bold'
                  : ''
              : ''
          }">
            Barang ${p.status || ''}
          </td>


          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    $("#list_report_other").html(html);

    // hide progress setelah selesai
    setTimeout(() => progressBar.fadeOut(), 800);


    // === pagination ===
    let paginationHtml = `
      <div class="d-flex justify-content-center align-items-center my-3">
        <button class="btn btn-outline-primary me-2" id="prevPage" ${list.page === 1 ? "disabled" : ""}>
          <i class="bi bi-arrow-left"></i> Sebelumnya
        </button>
        <span>Halaman ${list.page} dari ${list.totalPages}</span>
        <button class="btn btn-outline-primary ms-2" id="nextPage" ${list.page === list.totalPages ? "disabled" : ""}>
          Selanjutnya <i class="bi bi-arrow-right"></i>
        </button>
      </div>
    `;



    // Gabungkan pagination + tabel (pagination di atas)
    $("#list_report_other").html(paginationHtml + html);

    $("#prevPage").off("click").on("click", function () {
      if (list.page > 1) {
        loadReportOther(list.page - 1, list.perPage);
      }
    });

    $("#nextPage").off("click").on("click", function () {
      if (list.page < list.totalPages) {
        loadReportOther(list.page + 1, list.perPage);
      }
    });
  } catch (err) {
    console.error("Error load report:", err);
    Swal.fire("Error", "Gagal load report", "error");
    $("#progress_bar").hide();
  }
}

loginUser();
