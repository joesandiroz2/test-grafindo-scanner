let currentPage = 1;
let perPage = 50; // jumlah baris per halaman



async function loadDianScanData(page = 1) {
  try {
    // login sekali aja kalau belum
      await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil data paginated
    const result = await pb.collection("dian_scan").getList(page, perPage, {
      sort: "-created",
    });
    console.log(result)
    let tbody = $("#tbl_data_excel tbody");

    result.items.forEach(item => {
      let row = `
        <tr>
          <td>${item.kode_depan} ${item.no_do}</td>
          <td>${item.part_number}</td>
          <td>${item.nama_barang}</td>
          <td>${item.qty}</td>
          <td>${item.po_no}</td>
          <td>${item.merk}</td>
        </tr>
      `;
      tbody.append(row);
    });

    renderPagination(result.page, result.totalPages);

  } catch (err) {
    console.error("Error load data:", err);
    alert("Gagal load data dari PocketBase!");
  }
}

function renderPagination(current, total) {
  let pagination = $("#pagination");
  pagination.empty();

  // tombol prev
  let prevDisabled = current === 1 ? "disabled" : "";
  pagination.append(`
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" data-page="${current - 1}">Previous</a>
    </li>
  `);

  // info halaman (tanpa tombol)
  pagination.append(`
    <li class="page-item disabled">
      <a class="page-link">Halaman ${current} dari ${total}</a>
    </li>
  `);

  // tombol next
  let nextDisabled = current === total ? "disabled" : "";
  pagination.append(`
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" data-page="${current + 1}">Next</a>
    </li>
  `);

  // event klik
  $("#pagination a").click(function (e) {
    e.preventDefault();
    let page = parseInt($(this).data("page"));
    if (!isNaN(page) && page >= 1 && page <= total) {
      currentPage = page;
      loadDianScanData(page);
    }
  });
}


  loadDianScanData(currentPage);
