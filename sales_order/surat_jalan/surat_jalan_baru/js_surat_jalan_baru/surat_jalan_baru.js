
async function generateNoDo() {
  const target = document.getElementById("no_do_generate");
  target.innerHTML = `<div class="text-muted">
    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
    Sedang mencari nomor DO baru...
  </div>`;

  try {
    // Login ke PocketBase
    await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);

    // Ambil tahun & bulan sekarang
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // 25
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 09
    const prefix = year + month; // 2509

    // Query ke sales_order_do untuk cari nomor terbesar di bulan ini
    const result = await pb.collection("sales_order_do").getList(1, 1, {
      filter: `no_do ~ "${prefix}"`,
      sort: "-no_do", // urutkan dari terbesar
    });

    let nextNumber = 1; // default kalau belum ada data
    if (result.items.length > 0) {
      const lastNoDo = result.items[0].no_do; // contoh 250900005
      const lastSeq = parseInt(lastNoDo.slice(-5)); // ambil 00005
      nextNumber = lastSeq + 1;
    }

    const newNoDo = prefix + String(nextNumber).padStart(6, "0"); // 250900006
    target.textContent = newNoDo;

    return newNoDo;
  } catch (err) {
    console.error("Gagal generate no_do:", err);
    target.innerHTML = `<span class="text-danger">Gagal generate no_do</span>`;
  }
}

/////////////////////////////////////// load semua unik customer
async function fetchAllCustomers() {
  let url = `${pocketbaseUrl}/api/collections/sales_customer_unik/records`;
  let page = 1;
  let perPage = 50;
  let allItems = [];
  let infoEl = document.getElementById("loading_customer");

  try {
    // ambil dulu totalPages
    let firstRes = await fetch(`${url}?page=1&perPage=${perPage}`);
    let firstData = await firstRes.json();
    let totalPages = firstData.totalPages || 1;
    let totalItems = firstData.totalItems || 0;

    // simpan hasil pertama
    if (firstData?.items?.length > 0) {
      allItems = allItems.concat(firstData.items);
    }
    infoEl.textContent = `Memuat customer: halaman 1 dari ${totalPages} (${allItems.length}/${totalItems})`;

    // lanjutkan halaman berikutnya
    for (page = 2; page <= totalPages; page++) {
      let res = await fetch(`${url}?page=${page}&perPage=${perPage}`);
      let data = await res.json();

      if (data?.items?.length > 0) {
        allItems = allItems.concat(data.items);
      }

      infoEl.textContent = `Memuat customer: halaman ${page} dari ${totalPages} (${allItems.length}/${totalItems})`;
    }

    infoEl.textContent = ``;

    return allItems;
  } catch (err) {
    console.error("Gagal fetch data customer:", err);
    Swal.fire("Error", "Tidak bisa ambil data customer", "error");
    infoEl.textContent = "Gagal memuat data customer.";
    return [];
  }
}


// jalankan otomatis saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  generateNoDo();
});
