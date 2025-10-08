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
            qty_minta: parseInt(item.qty_minta, 10) || 0
          };
        }
  mapParts[key].total_qty += parseInt(item.qty && item.qty !== "" ? item.qty : item.qty_masuk, 10) || 0;

      });

      let i = 1;
      Object.values(mapParts).forEach(p => {
        html += `
          <tr>
            <td>${i++}</td>
            <td style="font-weight:bold">${p.part_number}</td>
            <td style="font-weight:bold">${p.nama_barang}</td>
            <td>${p.lot}</td>
            <td>${p.qty_minta}</td>
            <td class="fw-bold">${p.total_qty}</td>
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

  } catch (err) {
    console.error("Error load report:", err);
    Swal.fire("Error", "Gagal load report", "error");
    $("#progress_bar").hide();
  }
}

loginUser();
