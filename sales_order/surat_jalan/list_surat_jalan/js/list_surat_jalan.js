const pb = new PocketBase(pocketbaseUrl);

let currentPage = 1;
const perPage = 50; // jumlah data per halaman

async function loadSalesOrders(page = 1) {
  try {
    $("#loadingText").show();
    $("#salesOrderTableBody").empty();
    $("#pagination").empty();

    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    const result = await pb.collection("sales_order_do").getList(page, perPage, {
      sort: "-created"
    });

    // filter supaya no_do tidak duplikat
    let seenNoDo = new Set();
    let uniqueItems = result.items.filter(item => {
      if (seenNoDo.has(item.no_do)) {
        return false;
      } else {
        seenNoDo.add(item.no_do);
        return true;
      }
    });


    // render table
    let rows = "";
    uniqueItems.forEach((item, index) => {
     let statusBadge = "";
  if (item.is_batal !== "") {
    statusBadge = `<span class="badge bg-danger fs-6">BATAL</span>`;
  } else {
    statusBadge = `<span class="badge bg-success fs-6">OK</span>`;
  }

  // tombol hapus hanya untuk index 0
  let btnHapus = "";
  if (index === 0) {
    btnHapus = `<button class="btn btn-danger" onclick="hapusOrder('${item.no_do}')">Hapus</button>`;
  }
      rows += `
        <tr>
          <td>${(page - 1) * perPage + (index + 1)}</td>
          <td style="font-weight:bold;color:purple">${item.kode_depan || "-"}-${item.no_do || "-"}</td>
          <td style="font-weight:bold;color:black">${item.customer_name || "-"}</td>
          <td>${item.no_po || "-"}</td>
          <td>${item.sales || "-"}</td>
          <td>${item.data_barang.length}</td>
          <td>${item.tgl_schedule || "-"}</td>
          <td>${statusBadge}</td>
          <td>
              <button class="btn btn-warning" onclick="editOrder('${item.no_do}', this)">Edit Brg</button>

              <button class="btn btn-danger" onclick="batalOrder('${item.no_do}')">Batalin</button>
        <button class="btn btn-success" onclick="buatDoBaru('${item.no_do}')">DO Baru</button>

        <button class="btn btn-info" onclick="lihatOrder('${item.no_do}')">Lihat</button>
      
           ${btnHapus}
          </td>
        </tr>
      `;
    });
    $("#salesOrderTableBody").html(rows);

    // render pagination
    renderPagination(result.page, result.totalPages);

  } catch (err) {
    console.error("Error load sales order:", err);
    $("#salesOrderTableBody").html(`<tr><td colspan="8" class="text-danger">Gagal mengambil data</td></tr>`);
  } finally {
    $("#loadingText").hide();
  }
}


function lihatOrder(no_do) {
  window.location.href = `/sales_order/surat_jalan/surat_jalan.html?id=${encodeURIComponent(no_do)}`;
}



function renderPagination(page, totalPages) {
  let paginationHTML = "";

  // tombol prev
  paginationHTML += `
    <li class="page-item ${page === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="loadSalesOrders(${page - 1})">Previous</a>
    </li>
  `;

  // nomor halaman
  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `
      <li class="page-item ${i === page ? "active" : ""}">
        <a class="page-link" href="#" onclick="loadSalesOrders(${i})">${i}</a>
      </li>
    `;
  }

  // tombol next
  paginationHTML += `
    <li class="page-item ${page === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="loadSalesOrders(${page + 1})">Next</a>
    </li>
  `;

  $("#pagination").html(paginationHTML);
}


//batalorder
async function batalOrder(no_do) {
  const { value: password } = await Swal.fire({
    title: "Konfirmasi Batal Order",
    text: `Masukkan password untuk membatalkan DO ${no_do}:`,
    input: "password",
    inputPlaceholder: "Masukkan password",
    showCancelButton: true,
    confirmButtonText: "Konfirmasi",
    cancelButtonText: "Batal"
  });

  if (!password) return; // user batal input

  if (password !== "sp102103") {
    Swal.fire("Error", "Password salah!", "error");
    return;
  }

  try {
    // tampilkan loading banner
    Swal.fire({
      title: "Proses...",
      text: "Sedang membatalkan order...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // login sekali lagi (jaga-jaga kalau token expired)
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil record by no_do
    const record = await pb.collection("sales_order_do").getFirstListItem(`no_do="${no_do}"`);

    // update is_batal = true
    await pb.collection("sales_order_do").update(record.id, {
      is_batal: "batal"
    });

    Swal.fire("Berhasil", `Order ${no_do} sudah dibatalkan.`, "success");

    // reload data table
    loadSalesOrders(currentPage);

  } catch (err) {
    console.error("Gagal batal order:", err);
    Swal.fire("Error", "Gagal membatalkan order", "error");
  }
}

//edit barng
let currentEditId = null;   // simpan id record PB
let currentBarangData = []; // simpan array barang

// ganti editOrder jadi buka modal
async function editOrder(no_do, btnElement) {
  try {
    // disable tombol & ubah teks
    const $btn = $(btnElement);
    const originalText = $btn.text();
    $btn.prop("disabled", true).text("Mengambil...");

    // login
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil data berdasarkan no_do
    const record = await pb.collection("sales_order_do").getFirstListItem(`no_do="${no_do}"`);
    currentEditId = record.id;
    currentBarangData = record.data_barang || [];

    // set judul modal
    $("#modalNoDo").text(no_do);

    // render tabel
    let rows = "";
    currentBarangData.forEach((item, idx) => {
      rows += `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.part_number}</td>
          <td>${item.nama_barang}</td>
          <td>${item.qty}</td>
          <td>
            <input type="number" class="form-control shipped-input"
                   data-idx="${idx}" value="${item.shipped || 0}"
                   min="0" max="${item.qty}">
          </td>
          <td class="backorder-cell">${item.backorder || (item.qty - (item.shipped || 0))}</td>
        </tr>
      `;
    });
    $("#editBarangTable tbody").html(rows);

    // event listener untuk input shipped
    $(".shipped-input").on("input", function () {
      const idx = $(this).data("idx");
      const shippedVal = parseInt($(this).val()) || 0;
      const qty = currentBarangData[idx].qty;

      currentBarangData[idx].shipped = shippedVal;
      currentBarangData[idx].backorder = qty - shippedVal;

      $(this).closest("tr").find(".backorder-cell").text(qty - shippedVal);
    });

    // buka modal
    const modal = new bootstrap.Modal(document.getElementById("editBarangModal"));
    modal.show();

  } catch (err) {
    console.error("Gagal load data barang:", err);
    Swal.fire("Error", "Tidak bisa load data barang", "error");
  } finally {
    // kembalikan tombol ke normal
    $(btnElement).prop("disabled", false).text("Edit brg");

  }
}


// simpan hasil edit
// simpan hasil edit
async function saveBarang() {
  const $btn = $("#btnSaveBarang"); // ambil tombol simpan
  try {
    if (!currentEditId) return;

    // disable tombol biar gak bisa dobel klik
    $btn.prop("disabled", true).text("Sedang menyimpan...");

    // simpan ke PocketBase
    await pb.collection("sales_order_do").update(currentEditId, {
      data_barang: currentBarangData
    });

    Swal.fire("Berhasil", "Data barang berhasil disimpan", "success");
    $("#editBarangModal").modal("hide");

    // reload tabel utama
    loadSalesOrders(currentPage);

  } catch (err) {
    console.error("Gagal simpan data barang:", err);
    Swal.fire("Error", "Gagal simpan data barang", "error");
  } finally {
    // balikin tombol ke normal
    $btn.prop("disabled", false).text("Simpan");
  }
}


//tombol hapus
// tombol hapus
async function hapusOrder(no_do) {
  const confirm = await Swal.fire({
    title: "Konfirmasi Hapus",
    text: `Apakah Anda yakin ingin menghapus DO ${no_do}?`,
    icon: "warning",
    input: "password",
    inputLabel: "Masukkan Password",
    inputPlaceholder: "Password diperlukan",
    inputAttributes: {
      maxlength: 20,
      autocapitalize: "off",
      autocorrect: "off"
    },
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    preConfirm: (password) => {
      if (password !== "sp102103") {
        Swal.showValidationMessage("Password salah!");
      }
      return password;
    }
  });

  if (!confirm.isConfirmed) return;

  try {
    // login ulang
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil record by no_do
    const record = await pb.collection("sales_order_do").getFirstListItem(`no_do="${no_do}"`);

    // hapus record
    await pb.collection("sales_order_do").delete(record.id);

    Swal.fire("Berhasil", `DO ${no_do} sudah dihapus.`, "success");

    // reload tabel
    loadSalesOrders(currentPage);

  } catch (err) {
    console.error("Gagal hapus DO:", err);
    Swal.fire("Error", "Gagal menghapus DO", "error");
  }
}


//buat do baru
// tombol DO baru
// tombol DO baru
async function buatDoBaru(targetNoDo) {
  const { value: password } = await Swal.fire({
    title: "Konfirmasi DO Baru",
    text: "Masukkan password untuk membuat DO baru:",
    input: "password",
    inputPlaceholder: "Password",
    showCancelButton: true,
    confirmButtonText: "Lanjut",
    cancelButtonText: "Batal"
  });

  if (!password) return;
  if (password !== "sp102103") {
    Swal.fire("Error", "Password salah!", "error");
    return;
  }

  try {
    Swal.fire({
      title: "Proses...",
      text: "Sedang membuat DO baru...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // ambil record berdasarkan DO yang diklik
    const record = await pb.collection("sales_order_do").getFirstListItem(`no_do="${targetNoDo}"`);
    if (!record) {
      Swal.fire("Error", `DO ${targetNoDo} tidak ditemukan`, "error");
      return;
    }

    // buat no_do baru (increment dari DO terakhir)
    const lastRecord = await pb.collection("sales_order_do").getList(1, 1, { sort: "-no_do" });
    const lastNoDo = lastRecord.items.length ? parseInt(lastRecord.items[0].no_do, 10) : 0;
    const newNoDo = (lastNoDo + 1).toString();

    // clone data
    const newData = {
      kode_depan: record.kode_depan,
      no_do: newNoDo,
      customer_name: record.customer_name,
      no_po: record.no_po,
      sales: record.sales,
      driver: record.driver,
      tgl_schedule: record.tgl_schedule,
      data_barang: record.data_barang || [],
      is_batal: ""
    };

    await pb.collection("sales_order_do").create(newData);

    Swal.fire("Berhasil", `DO baru ${newNoDo} berhasil dibuat.`, "success");

    // reload tabel
    loadSalesOrders(currentPage);

  } catch (err) {
    console.error("Gagal buat DO baru:", err);
    Swal.fire("Error", "Gagal membuat DO baru", "error");
  }
}

// initial load
loadSalesOrders(currentPage);
