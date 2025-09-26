const pb = new PocketBase(pocketbaseUrl);
let typingTimer; // timer untuk debounce
const typingDelay = 500; // 500ms

// pastikan input selalu fokus
function keepFocus() {
  const input = document.getElementById("scan_other");
  if (input) input.focus();
}

// fungsi cari berdasarkan no_do
async function searchByNoDo(no_do_value) {
  try {
    // login sekali (bisa dioptimalkan di awal aplikasi)
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // cari di dian_scan berdasarkan no_do
    const result = await pb.collection("dian_scan").getList(1, 50, {
      filter: `no_do="${no_do_value}"`,
      sort: "-created"
    });

    let tbody = $("#tbl_do_list tbody");
    tbody.empty();

    if (result.items.length === 0) {
      tbody.append(`<tr><td colspan="7" class="text-center">Data tidak ditemukan</td></tr>`);
      return;
    }

    result.items.forEach((item, i) => {
      let row = `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight:bold">${item.kode_depan} ${item.no_do}</td>
          <td style="font-weight:bold">${item.part_number || ""}</td>
          <td>${item.nama_barang || ""}</td>
          <td style="font-weight:bold">${item.qty || ""} Pcs</td>
          <td>${item.merk || ""}</td>
        </tr>
      `;
      tbody.append(row);
    });

  } catch (err) {
    console.error("Error saat cari data:", err);
    alert("Gagal mencari data!");
  }
}

// ✅ Fungsi validasi format "part qty lot"
function validateInput(scanValue) {
  const parts = scanValue.split(" ");
  if (parts.length < 3) {
    alert("Format salah. Gunakan format: part qty lot");
    return false;
  }

  const partNumber = parts[0].trim();
  const qtyInput = parseInt(parts[1].trim(), 10);
  const lot = parts[2].trim();

  let found = false;
  let valid = true;

  $("#tbl_do_list tbody tr").each(function () {
    const tdPart = $(this).find("td:eq(2)").text().trim(); // kolom part_number
    const tdQty = parseInt($(this).find("td:eq(4)").text().replace("Pcs", "").trim(), 10);

    if (tdPart.toLowerCase() === partNumber.toLowerCase()) {
      found = true;
      if (qtyInput > tdQty) {
        alert("qty kelebihan atau ga sesuai");
        valid = false;
      }
    }
  });

  if (!found) {
    alert("partnumber ga ditemukan");
    valid = false;
  }

  return valid;
}

// event listener input
$(document).ready(function () {
  const input = $("#scan_other");

  // langsung fokus begitu halaman dibuka
  keepFocus();

  // jalankan search atau validasi 500ms setelah user berhenti mengetik/scan
  input.on("input", function () {
    clearTimeout(typingTimer);
    const value = $(this).val().trim();

    if (value !== "") {
      typingTimer = setTimeout(() => {
        // cek apakah input punya 3 bagian → format scan part qty lot
        if (value.split(" ").length >= 3) {
          validateInput(value);
        } else {
          // kalau 1 kata → cari berdasarkan no_do
          searchByNoDo(value);
        }

        $(this).val(""); // kosongkan input setelah diproses
        keepFocus();
      }, typingDelay);
    }
  });

  // kalau kehilangan fokus → balikin fokus lagi
  input.on("blur", keepFocus);
});
