
async function initDriverSelect() {
  try {
    // login dulu (opsional, kalau sudah login di tempat lain, bisa di-skip)

    // ambil semua driver
    const drivers = await pb.collection("sales_order_driver").getFullList({
      sort: "nama" // biar urut alfabetis
    });

    // render ke select
    let $driverSelect = $("#select_driver_list");
    $driverSelect.empty();

    if (drivers.length === 0) {
      $driverSelect.append(`<option value="">Belum ada driver</option>`);
    } else {
      drivers.forEach(d => {
        $driverSelect.append(
          `<option value="${d.id}">${d.nama}</option>`
        );
      });
    }

    // aktifkan select2 biar enak dipakai
    $driverSelect.select2({
      placeholder: "Pilih Driver...",
      allowClear: true,
      width: "100%"
    });

  } catch (err) {
    console.error("Gagal ambil driver:", err);
    Swal.fire("Error", "Tidak bisa ambil data driver", "error");
  }
}

// panggil pas halaman siap
$(document).ready(() => {
  initDriverSelect();
});
