const pb = new PocketBase(pocketbaseUrl);
  const statusText = document.getElementById("status-text");

// --- Ambil semua part unik ---
async function fetchAllParts() {
  let allParts = [];
  let page = 1;
  let totalPages = 1;
    statusText.innerText = `Sedang mengambil semua part .......`;

  while (page <= totalPages) {
    const res = await fetch(
      `${pocketbaseUrl}/api/collections/yamaha_unik_part_number/records?page=${page}&perPage=30`
    );
    const data = await res.json();

    totalPages = data.totalPages;
    allParts = allParts.concat(data.items);
    page++;
  }
  return allParts;
}

// --- Ambil balance & created terakhir per part_number ---
async function getLastBalance(partNumber) {
  try {
    const res = await pb.collection("yamaha_kartu_stok").getList(1, 1, {
      filter: `part_number = "${partNumber}"`,
      sort: "-created",
    });

    if (res.items.length > 0) {
      return {
        balance: res.items[0].balance || 0,
        created: res.items[0].created,
      };
    }
    return { balance: 0, created: null };
  } catch (err) {
    console.error("Error ambil balance:", err);
    return { balance: 0, created: null };
  }
}

// --- Format tanggal ---
function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Render ke tabel ---
async function renderStock() {
  const parts = await fetchAllParts();
  const total = parts.length;
  let count = 0;

  const tableBody = document.getElementById("stock-table-body");
  const progressBar = document.getElementById("progress-bar");

  for (const part of parts) {
    // update status sementara
    statusText.innerText = `Sedang mengambil part , Proses Ke ${count + 1} dari ${total}...`;

    // ambil balance + created
    const { balance, created } = await getLastBalance(part.part_number);

    // style balance
    const balanceStyle =
      balance < 0
        ? `style="color:red; font-weight:bold;"`
        : `style="font-weight:bold;"`;

    // render row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${++count}</td>
      <td>${part.part_number}</td>
      <td>${part.nama_barang}</td>
      <td ${balanceStyle}>${balance}</td>
      <td>${formatTanggal(created)}</td>
    `;
    tableBody.appendChild(row);

    // update progress bar
    const progress = Math.round((count / total) * 100);
    progressBar.style.width = `${progress}%`;
    progressBar.innerText = `${progress}%`;
  }

  // setelah selesai
  progressBar.classList.remove("progress-bar-animated");
  progressBar.innerText = `Selesai ✔️ Total part number: ${total}`;
  statusText.innerText = ""; // hapus tulisan h6
}

renderStock();
