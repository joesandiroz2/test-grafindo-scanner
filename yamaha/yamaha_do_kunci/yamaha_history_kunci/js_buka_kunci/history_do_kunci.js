
const pb = new PocketBase(pocketbaseUrl);

let currentPage = 1;
const perPage = 5;
let totalPages = 1;

async function loginPocketBase() {
  try {
    const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
    console.log("Login berhasil:", authData);
  } catch (err) {
    console.error("Gagal login:", err);
  }
}

async function fetchData(page = 1) {
  try {
    await loginPocketBase();

    const result = await pb.collection('yamaha_do_kuncian').getList(page, perPage, {
      sort: '-created',
    });

    const items = result.items;
    totalPages = result.totalPages;
    currentPage = result.page;

    const container = document.getElementById("do-list");
    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = "Tidak ada data.";
      return;
    }

    let tableHTML = `
      <table class="table table-responsive">
        <thead>
          <tr>
        <th>No</th>
            <th>No DO</th>
            <th>Alasan</th>
            <th>Tanggal Terbuka</th>
          </tr>
        </thead>
        <tbody>
    `;

    items.forEach((item,index) => {
       const nomorUrut = (currentPage - 1) * perPage + index + 1;
  
      tableHTML += `
        <tr>
          <td>${nomorUrut}</td>
          <td>${item.no_do}</td>
          <td>${item.alasan}</td>

      <td>${formatTanggal(item.created)}</td>
        </tr>
      `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;

    document.getElementById("pageInfo").innerText = `Halaman ${currentPage} dari ${totalPages}`;
    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages;

  } catch (error) {
    console.error("Gagal mengambil data:", error);
    document.getElementById("do-list").innerText = "Gagal mengambil data.";
  }
}



window.addEventListener("DOMContentLoaded", () => {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        fetchData(currentPage - 1);
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        fetchData(currentPage + 1);
      }
    });
  } else {
    console.warn("Pagination buttons not found in the DOM.");
  }

  fetchData();
});



function formatTanggal(isoDateStr) {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const date = new Date(isoDateStr);
  const tgl = date.getDate();
  const bln = bulan[date.getMonth()];
  const thn = date.getFullYear();
  const jam = String(date.getHours()).padStart(2, '0');
  const menit = String(date.getMinutes()).padStart(2, '0');

  return `${tgl} ${bln} ${thn} ${jam}:${menit}`;
}
