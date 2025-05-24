const pb = new PocketBase(pocketbaseUrl);
let currentPage = 1;
const perPage = 100;

async function fetchKartuStok(page = 1) {
  $("#loading").show();
  $("#table-container").empty();

  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    const resultList = await pb.collection("yamaha_kartu_stok").getList(page, perPage, {
      sort: "-created"
    });

    renderTable(resultList.items);
    updatePagination(resultList.page, resultList.totalPages);
  } catch (error) {
    console.error("Gagal ambil data kartu stok:", error);
    Swal.fire("Error", "Gagal mengambil data kartu stok!", "error");
  } finally {
    $("#loading").hide();
  }
}

function renderTable(items) {
  if (items.length === 0) {
    $("#table-container").html("<p class='text-center'>Tidak ada data.</p>");
    return;
  }

  const keluarMap = {};
  const otherItems = [];

   const partCount = {};


  items.forEach(item => {
      // Hitung part_number frequency
    partCount[item.part_number] = (partCount[item.part_number] || 0) + 1;

    if (item.status === "keluar") {
      const part = item.part_number;
      const qty = parseInt(item.qty_scan) || 0;

      if (!keluarMap[part]) {
        keluarMap[part] = {
          ...item,
          qty_keluar_total: qty,
          created: item.created // simpan created untuk ambil balance terbaru
        };
      } else {
        keluarMap[part].qty_keluar_total += qty;

        // Ambil balance dari created terbaru
        if (new Date(item.created) > new Date(keluarMap[part].created)) {
          keluarMap[part].created = item.created;
          keluarMap[part].balance = item.balance;
        }
      }
    } else {
      otherItems.push(item);
    }
  });

  const combinedItems = otherItems.concat(Object.values(keluarMap));
  combinedItems.sort((a, b) => new Date(b.created) - new Date(a.created));

  const table = `
    <table class="table table-bordered table-striped">
      <thead class="table-dark">
        <tr>
          <th>No</th>
          <th>No DO</th>
          <th>Part Number</th>
          <th>Nama Barang</th>
          <th>Qty Masuk</th>
          <th>Balance Terakhir</th>
          <th>Qty Keluar</th>
          <th>Status</th>
          <th>Tgl System</th>
        </tr>
      </thead>
      <tbody>
        ${combinedItems.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.kode_depan + item.no_do}</td>
            <td style="
              background-color: ${partCount[item.part_number] > 1 ? 'orange' : 'inherit'};
              color: ${partCount[item.part_number] > 1 ? 'black' : 'inherit'};
            ">
              ${item.part_number}
            </td>
            <td>${item.nama_barang}</td>
            <td class="td_masuk">${item.qty_masuk || ""}</td>
           <td class="balance" style="color: ${item.balance < 0 ? 'red' : 'inherit'};">
            ${item.balance}
          </td>
            <td class="td_keluar">${item.status === "keluar" ? item.qty_keluar_total : ""}</td>
           <td style="font-weight: bold; color: ${item.status === "keluar" ? "red" : "green"};">
            ${item.status === "keluar" ? "barang keluar" : "masuk"}
          </td>
            <td><i>${formatTanggal(item.created)}</i></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  $("#table-container").html(table);
}

function updatePagination(page, totalPages) {
  $("#prevPage").prop("disabled", page <= 1);
  $("#nextPage").prop("disabled", page >= totalPages);

  $("#pageInfo").text(`Halaman ${page} dari ${totalPages}`);

  $("#prevPage").off("click").on("click", () => {
    if (page > 1) {
      currentPage--;
      fetchKartuStok(currentPage);
    }
  });

  $("#nextPage").off("click").on("click", () => {
    if (page < totalPages) {
      currentPage++;
      fetchKartuStok(currentPage);
    }
  });
}


// Panggil saat halaman dimuat
$(document).ready(() => {
  fetchKartuStok(currentPage);
});


function formatTanggal(isoDate) {
  const date = new Date(isoDate);
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  const tanggal = date.toLocaleDateString('id-ID', options);
  const jam = date.getHours().toString().padStart(2, '0');
  const menit = date.getMinutes().toString().padStart(2, '0');
  return `${tanggal} ${jam}:${menit}`;
}
