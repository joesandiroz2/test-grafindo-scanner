let pb;

function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// login dulu sebelum query
async function loginUser() {
    try {
        pb = new PocketBase(pocketbaseUrl);

        // auth password
        const authData = await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
        console.log("Login sukses", authData);

        // setelah login → load detail
        loadDetail_surat_jalan();
    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal login ke PocketBase", "error");
    }
}

// 🔹 Render ulang tabel utama dengan data DO tertentu
function renderTableByDO(no_do_id, data) {
  const tbody = $("#detail-body");
  tbody.empty();

  if (!data || data.length === 0) {
    tbody.append(`<tr><td colspan="13" class="text-center">Data tidak ditemukan</td></tr>`);
    return;
  }

  data.forEach((item, index) => {
    const shippedVal = parseInt(item.shipped) || 0;
    const backOrderVal = item.back_order || (item.qty - shippedVal);

    const qtyVal = parseInt(item.qty) || 0;
    
    const isFull = qtyVal === shippedVal;

    const qtyStyle = isFull ? "color:green; font-weight:bold;" : "";
    const shippedStyle = isFull ? "color:green; font-weight:bold;" : "";
    const fullText = isFull
      ? `<span style="color:green; font-weight:bold;">Full</span>`
      : `<span style="color:red; font-weight:bold;">Blm</span>`;
    const updatedFormatted = formatDate(item.updated);

    const row = `
   <tr data-id="${item.id || item.uid}" data-qty="${item.qty}">
          <td>${index + 1}</td>
          <td>${item.nama_barang || ""}</td>
          <td>${item.part_number || ""}</td>
          <td style="${qtyStyle}">${item.qty ? item.qty.toLocaleString('id-ID') : ""}</td>
          
          <td style="${shippedStyle}">
            <input type="number" class="form-control form-control-sm shipped-input" 
                   value="${shippedVal}" min="0" max="${item.qty}">
            <div class="text-danger small error-message" style="display:none;">
              anda input shipped melebihi qty
            </div>
          </td>
          
          <td>
            <input type="number" class="form-control form-control-sm backorder-input" 
                   value="${backOrderVal}"
                   style="color:red;font-weight:bold" readonly>
          </td>
          <td>${updatedFormatted || "-"}</td>
          <td class="full-status">${fullText}</td>
          <td>
            <button class="btn btn-info btn-update">Perbarui</button>
          </td>
      </tr>`;
    tbody.append(row);
  });

  $("#no_do").text(no_do_id); // update judul di header
}


async function loadDetail_surat_jalan() {
    const params = new URLSearchParams(window.location.search);
    const no_do = params.get("id");

    if (!no_do) {
        Swal.fire("Error", "Parameter no_do tidak ditemukan di URL", "error");
        return;
    }

    $("#no_do").text(no_do);
    $("#loading").show();
    $("#detail-body").html(`<tr><td colspan="13" class="text-center">Loading...</td></tr>`);

    let onlyNumber = no_do.includes("-") ? no_do.split("-")[1] : no_do;

    JsBarcode("#bar_code", onlyNumber, {
      format: "CODE128",
      lineColor: "#000",
      width: 2,
      height: 50,
      displayValue: true
    });

    try {
        // ambil semua record dengan no_do
        const records = await pb.collection("sales_order").getFullList({
            filter: `no_do="${no_do}"`,
            sort: "-created"
        });

        const tbody = $("#detail-body");
        tbody.empty();

        if (records.length === 0) {
            tbody.append(`<tr><td colspan="13" class="text-center">Data tidak ditemukan</td></tr>`);
            return;
        }

        // tampilkan no_po dan salesman dari record pertama
        const firstItem = records[0];
        $("#no_po").text(firstItem.no_po || "-");
        $("#salesman").text(firstItem.sales || "-");
        $("#tgl_schedule").text(firstItem.tgl_schedule || "-");

        // ---- ambil data customer berdasarkan customer_id ----
        if (firstItem.customer_id) {
          try {
            const customer = await pb.collection("sales_customer").getOne(firstItem.customer_id);
            $("#cust_pt").text(customer.nama_pt || "-");
            $("#cust_alamat").text(customer.alamat || "-");
            $("#cust_telp").text(customer.no_telp || "-");

            $("#inv_cust_pt").text(customer.nama_pt || "-");
            $("#inv_cust_alamat").text(customer.alamat || "-");
            $("#inv_cust_telp").text(customer.no_telp || "-");
          } catch (err) {
            console.error("Gagal ambil customer:", err);
            $("#cust_pt").text("-");
            $("#cust_alamat").text("-");
            $("#cust_telp").text("-");
          }
        }

        // render tabel
        records.forEach((item, index) => {
            const shippedVal = item.shipped || 0;
            const backOrderVal = item.back_order || (item.qty - shippedVal);

            const isFull = item.qty === shippedVal;
            const qtyStyle = isFull ? "color:green; font-weight:bold;" : "";
            const shippedStyle = isFull ? "color:green; font-weight:bold;" : "";
            const fullText = isFull
                ? `<span style="color:green; font-weight:bold;">Full</span>`
                : `<span style="color:red; font-weight:bold;">Blm</span>`;
             const updatedFormatted = formatDate(item.updated);

            const row = `
                <tr data-id="${item.id}" data-qty="${item.qty}">
                    <td>${index + 1}</td>
                    <td>${item.nama_barang || ""}</td>
                    <td>${item.part_number || ""}</td>
                    <td style="${qtyStyle}">${item.qty ? item.qty.toLocaleString('id-ID') : ""}</td>
                    
                    <!-- Input shipped + error -->
                    <td style="${shippedStyle}">
                      <input type="number" class="form-control form-control-sm shipped-input" 
                             value="${shippedVal}" min="0" max="${item.qty}">
                      <div class="text-danger small error-message" style="display:none;">
                        anda input shipped melebihi qty
                      </div>
                    </td>
                    
                    <!-- Back order otomatis -->
                    <td>
                      <input type="number" class="form-control form-control-sm backorder-input" 
                             value="${backOrderVal}"
                    style="color:red;font-weight:bold"
                              readonly>
                    </td>
                    <td>${updatedFormatted}</td>

                    <!-- Kolom Full -->
                    <td class="full-status">${fullText}</td>
                    
                    <td>
                      <button class="btn btn-info btn-update">Perbarui</button>
                    </td>
                </tr>`;
            tbody.append(row);
        });

        // event listener untuk hitung back_order otomatis + validasi + update kolom Full
        $("#detail-body").on("input", ".shipped-input", function () {
            const row = $(this).closest("tr");
            const qty = parseInt(row.data("qty")) || 0;
            let shipped = parseInt($(this).val()) || 0;
            const errorMsg = row.find(".error-message");

            if (shipped > qty) {
                shipped = qty;
                $(this).val(qty);
                errorMsg.show();
            } else {
                errorMsg.hide();
            }

            const backOrder = qty - shipped;
            row.find(".backorder-input").val(backOrder >= 0 ? backOrder : 0);

            // update style dan kolom Full
            if (shipped === qty) {
                row.find("td:eq(3)").css({"color":"green","font-weight":"bold"});
                row.find(".shipped-input").css({"color":"green","font-weight":"bold"});
                row.find(".full-status").html(`<span style="color:green; font-weight:bold;">Full</span>`);
            } else {
                row.find("td:eq(3)").css({"color":"","font-weight":""});
                row.find(".shipped-input").css({"color":"","font-weight":""});
                row.find(".full-status").html(`<span style="color:red; font-weight:bold;">Blm</span>`);
            }
        });

        // event listener tombol perbarui
        // event listener tombol perbarui
        $("#detail-body").on("click", ".btn-update", async function () {
            const row = $(this).closest("tr");
            const shipped = parseInt(row.find(".shipped-input").val()) || 0;
            const backOrder = parseInt(row.find(".backorder-input").val()) || 0;

            // cek tab aktif
            const activeNoDo = document.querySelector("#list_anak_do .nav-link.active").dataset.nodo;
            const params = new URLSearchParams(window.location.search);
            const no_do_induk = params.get("id");

            try {
                if (activeNoDo === no_do_induk) {
                    // === INDUK ===
                    const id = row.data("id");
                    await pb.collection("sales_order").update(id, {
                        shipped: shipped,
                        back_order: backOrder
                    });
                } else {
                    // === ANAK ===
                    // ambil record induk
                    const records = await pb.collection("sales_order").getFullList({
                        filter: `no_do="${no_do_induk}"`,
                        sort: "-created"
                    });

                    if (records.length === 0) {
                        Swal.fire("Error", "Record induk tidak ditemukan", "error");
                        return;
                    }

                    const indukRecord = records[0];
                    let do_kiriman_ulang = Array.isArray(indukRecord.do_kiriman_ulang) ? indukRecord.do_kiriman_ulang : [];

                    // cari group anak sesuai no_do_id aktif
                    const groupIndex = do_kiriman_ulang.findIndex(g => g.no_do_id === activeNoDo);
                    if (groupIndex === -1) {
                        Swal.fire("Error", "Data anak DO tidak ditemukan", "error");
                        return;
                    }

                    // update data di dalam group.data sesuai part_number
                    const partNumber = row.find("td:eq(2)").text().trim();
                    const uid = row.data("id");
                    const itemIndex = do_kiriman_ulang[groupIndex].data.findIndex(d => d.uid === uid);



                    if (itemIndex !== -1) {
                      do_kiriman_ulang[groupIndex].data[itemIndex].shipped = shipped;
                      do_kiriman_ulang[groupIndex].data[itemIndex].back_order = backOrder;
                      // 🔹 tambahkan timestamp manual
                      do_kiriman_ulang[groupIndex].data[itemIndex].updated = new Date().toISOString();
                    }


                    // simpan kembali ke record induk
                    await pb.collection("sales_order").update(indukRecord.id, {
                        do_kiriman_ulang: do_kiriman_ulang
                    });
                }

                Swal.fire("Sukses", "Data berhasil diperbarui", "success");
            } catch (err) {
                console.error(err);
                Swal.fire("Error", "Gagal update data", "error");
            }
        });

      // di loadDetail_surat_jalan
    renderAnakDO(records[0].do_kiriman_ulang || [], records, no_do);

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal mengambil detail data", "error");
    } finally {
        $("#loading").hide();
    }
}


//buat do baru
// Event tombol buat DO baru lagi
// Event tombol buat DO baru lagi
document.getElementById("buat_do_baru").addEventListener("click", async (e) => {
  const btn = e.target;
  const params = new URLSearchParams(window.location.search);
  const no_do = params.get("id");



    btn.disabled = true;
    const oldText = btn.innerHTML;
    btn.innerHTML = `sedang membuat nomor do .....`;



  if (!no_do) {
    Swal.fire("Error", "Nomor DO tidak ditemukan di URL", "error");
    return;
  }

  try {
    const records = await pb.collection("sales_order").getFullList({
      filter: `no_do="${no_do}"`,
      sort: "-created"
    });

    if (records.length === 0) {
      Swal.fire("Error", "Tidak ada data untuk DO ini", "error");
      return;
    }

    const idPertama = records[0].id;
    const existing = Array.isArray(records[0].do_kiriman_ulang) 
      ? records[0].do_kiriman_ulang 
      : [];

    // Tentukan sumber data
    let sourceData;
    if (existing.length > 0) {
      // 🔹 ada anak DO → ambil data anak DO terakhir
      sourceData = existing[existing.length - 1].data;
    } else {
      // 🔹 belum ada anak DO → pakai data induk
      sourceData = records;
    }

    // nomor DO baru
    const urut = existing.length + 1;
    const newNoDoId = `${no_do}D${urut}`;

    btn.innerHTML = `Sedang membuat DO baru ${newNoDoId}...`;

    
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // bentuk data array
    const detailData = sourceData.map(item => ({
      uid: generateUUID(),
      part_number: item.part_number,
      nama_barang: item.nama_barang,
      qty: item.qty,
      unit_price: item.unit_price,
      tgl_schedule: item.tgl_schedule,
      no_po: item.no_po,
      no_so: item.no_so,
      no_io: item.no_io,
      shipped: item.shipped,
      back_order: item.back_order,
      sales: item.sales,
      is_batal: item.is_batal,
      no_do: item.no_do,
      setujui_io: item.setujui_io,
      customer_id: item.customer_id,
      kode_depan: item.kode_depan,
       created: new Date().toISOString(),  // 🔹 tambahkan created
  updated: new Date().toISOString()   // 🔹 tambahkan updated
    }));

    // objek baru
    const newDoGroup = {
      no_do_id: newNoDoId,
      data: detailData
    };

    // simpan
    const updated = await pb.collection("sales_order").update(idPertama, {
      do_kiriman_ulang: [...existing, newDoGroup]
    });

    renderAnakDO(updated.do_kiriman_ulang || [], records, no_do);

    Swal.fire("Sukses", `DO baru (${newNoDoId}) berhasil ditambahkan`, "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Gagal membuat DO baru", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Buat DO Baru";
  }
});



//render anak do

// --- fungsi render anak DO ---
function renderAnakDO(existing, indukData, indukNoDo) {
  const container = document.getElementById("list_anak_do");
  container.innerHTML = "";

  // selalu buat tab list (induk + anak)
  const list = document.createElement("ul");
  list.className = "nav nav-tabs mt-3";

  // Tab induk utama
  let firstActive = "active"; // default aktif di induk
  const liInduk = document.createElement("li");
  liInduk.className = "nav-item";
  liInduk.innerHTML = `
    <button class="nav-link ${firstActive}" data-nodo="${indukNoDo}" type="button">
      ${indukNoDo}
    </button>`;
  list.appendChild(liInduk);

  // Tab anak-anak DO
  existing.forEach((doGroup) => {
    const li = document.createElement("li");
    li.className = "nav-item";
    li.innerHTML = `
      <button class="nav-link" data-nodo="${doGroup.no_do_id}" type="button">
        ${doGroup.no_do_id}
      </button>`;
    list.appendChild(li);
  });

  container.appendChild(list);

  // event klik tab
  container.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const no_do_id = btn.dataset.nodo;
      if (no_do_id === indukNoDo) {
        renderTableByDO(no_do_id, indukData);
      } else {
        const doGroup = existing.find(d => d.no_do_id === no_do_id);
        renderTableByDO(no_do_id, doGroup.data);
      }
    });
  });

  // render pertama kali → induk
  renderTableByDO(indukNoDo, indukData);
}

loginUser();
