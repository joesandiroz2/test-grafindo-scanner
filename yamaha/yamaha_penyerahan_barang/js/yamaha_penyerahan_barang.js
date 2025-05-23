const pb = new PocketBase(pocketbaseUrl);

document.getElementById('pbForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sedang menambahkan...`;

  try {
    // Login
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // Normalisasi input
    const rawPartNumber = document.getElementById("part_number").value;
    const part_number = rawPartNumber.replace(/\s+/g, '').toUpperCase();

    const lotRaw = document.getElementById("lot").value.trim();
    const lot = parseInt(lotRaw, 10).toString();  // Buang leading zero

   const nama_barang = document.getElementById("nama_barang").value.trim().toUpperCase();
   const rawDate = document.getElementById("tgl_pb").value;
    const dateObj = new Date(rawDate);

    // Format menjadi: 12 January 2025
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const tgl_pb = dateObj.toLocaleDateString('en-GB', options);


    const no_pb = document.getElementById("no_pb").value.trim();
    const qtyInput = parseInt(document.getElementById("qty_masuk").value);

    // Cek apakah part_number + lot sudah ada
    const existing = await pb.collection("yamaha_penyerahan_barang").getFullList({
      filter: `part_number="${part_number}" && lot="${lot}"`,
    });

    if (existing.length > 0) {
      // Jika ada, update qty_masuk
      const record = existing[0];
      const updatedQty = parseInt(record.qty_masuk) + qtyInput;

      await pb.collection("yamaha_penyerahan_barang").update(record.id, {
        qty_masuk: updatedQty
      });
    } else {
      // Jika tidak ada, buat baru
      await pb.collection("yamaha_penyerahan_barang").create({
        part_number,
        lot,
        nama_barang,
        tgl_pb,
        no_pb,
        qty_masuk: qtyInput
      });
    }

    // write ke kartu stok masukan
    // Update/Create yamaha_kartu_stok
    const kartuStokExisting = await pb.collection("yamaha_kartu_stok").getFullList({
      filter: `part_number="${part_number}"`,
      sort: "-created",
      limit: 1
    });

    let lastBalance = 0;
    if (kartuStokExisting.length > 0) {
      lastBalance = parseInt(kartuStokExisting[0].balance) || 0;
    }

    const newBalance = lastBalance + qtyInput;
    const tgl_pb_id = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    await pb.collection("yamaha_kartu_stok").create({
      kode_depan: "",
      no_do: no_pb,
      part_number,
      nama_barang,
      qty_scan: "",
      qty_do: "",
      status: "masuk",
      remarks: "",
      balance: newBalance.toString(),
       qty_masuk: qtyInput.toString(),
      tgl_pb: tgl_pb_id
    });

    // Sukses
    Swal.fire({
      icon: 'success',
      title: 'Berhasil ditambahkan!',
      showConfirmButton: false,
      timer: 1200
    }).then(() => {
      window.location.href = "/yamaha/yamaha_penyerahan_barang/yamaha_penyerahan_barang.html";
    });

  } catch (error) {
    console.error(error);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan.", "error");
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-box-arrow-in-down"></i> Tambahkan`;
  }
});
