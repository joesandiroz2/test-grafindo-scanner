
// cari DO
async function searchDo(no_do) {
  $("#loading").show();
  $("#report-container").empty();

  try {
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    const kartuStokItems = await pb.collection("yamaha_kartu_stok").getFullList({
      filter: `no_do="${no_do}"`,
      sort: "-created"
    });

    if (kartuStokItems.length === 0) {
      Swal.fire("Tidak Ditemukan", "DO tidak ditemukan dalam data kartu stok.", "warning");
      return;
    }

    const grouped = {};
    grouped[no_do] = {};

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

    renderReport(grouped);

  } catch (error) {
    console.error("Gagal cari DO:", error);
    Swal.fire("Error", "Gagal mencari data DO.", "error");
  } finally {
    $("#loading").hide();
  }
}

// Tombol cari
$(document).on("click", "#btn-cari-do", () => {
   let doValue = $("#do-input").val().trim().replace(/\s+/g, ""); // hapus semua spasi
  if (doValue === "") {
    Swal.fire("Peringatan", "Masukkan nomor DO untuk dicari!", "warning");
    return;
  }
  searchDo(doValue);
});

// Tombol reset
$(document).on("click", "#btn-reset", () => {
  $("#do-input").val("");
  currentPage = 1;
  fetchReportData(); // kembali ke data awal
});