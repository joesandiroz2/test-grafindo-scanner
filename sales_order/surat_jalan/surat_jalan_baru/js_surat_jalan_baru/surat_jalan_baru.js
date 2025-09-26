// Pastikan sudah ada pocket_config.js & pocketbase.umd.js diload di HTML
const pb = new PocketBase(pocketbaseUrl);

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

// jalankan otomatis saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  generateNoDo();
});
