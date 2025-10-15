const pb = new PocketBase(pocketbaseUrl);

let currentPage = 0;
let totalPages = 0;
let currentQuery = "";



async function authenticate() {
    try {
        const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
        return authData;
    } catch (error) {
        console.error("Authentication failed:", error);
    }
}

async function fetchData(query, fetchSemua, page = null) {
  Swal.fire({
    title: 'Sedang memuat data...',
    didOpen: () => Swal.showLoading()
  });

  try {
    await authenticate();
    currentQuery = query;

    if (fetchSemua) {
      // --- Ambil halaman terakhir dulu kalau page belum ditentukan ---
        if (page === null) {
          // hanya ambil totalPages kalau belum pernah diambil
          if (totalPages === 0) {
            const firstResult = await pb.collection('yamaha_kartu_stok').getList(1, 100, {
              filter: `part_number = "${query}"`,
            });
            totalPages = firstResult.totalPages || 1;
          }
          page = totalPages;
        }

      currentPage = page;

      // Ambil halaman sesuai currentPage
      const resultList = await pb.collection('yamaha_kartu_stok').getList(currentPage, 100, {
        filter: `part_number = "${query}"`,
      });

      const jumlahData = currentPage === totalPages
        ? 100
        : (totalPages - currentPage + 1) * 100;

      document.getElementById("keteranganstok").textContent =
        `${jumlahData} Transaksi Terakhir (Page ${currentPage} dari ${totalPages})`;

      // Munculkan tombol “Lihat Stok Sebelumnya” hanya kalau masih ada halaman sebelumnya
      const btnPrev = document.getElementById("lihat-stok-sebelumnya");
      if (currentPage > 1) {
        btnPrev.style.display = "inline-block";
      } else {
        btnPrev.style.display = "none";
      }

      Swal.close();
      return resultList.items;

    } else {
      // --- Ambil hanya 1 data terakhir ---
      const resultList = await pb.collection('yamaha_kartu_stok').getList(1, 1, {
        filter: `part_number = "${query}"`,
        sort: '-created',
      });
      document.getElementById("keteranganstok").textContent = "Stok Terakhir Saja";
      Swal.close();
      return resultList.items;
    }

  } catch (error) {
    console.error("Gagal mengambil data:", error);
    Swal.close();
    return [];
  }
}

document.getElementById('lihat-stok-sebelumnya').addEventListener('click', async function() {
  if (currentPage > 1) {
    currentPage--; // mundur satu halaman
    const data = await fetchData(currentQuery, true, currentPage);
    renderTablePrepend(data);

    renderDetailBarang(currentQuery);
  } else {
    Swal.fire("anda harus klik Tampilkan stok detailnya dahulu", "Tidak ada data lebih lama lagi.", "info");
  }
});

function renderTablePrepend(data) {
  const tableBody = document.getElementById('data-table-body');

  if (data.length === 0) return;

  let newRows = '';

  data.forEach((item, index) => {
    const userGrafindo = localStorage.getItem("user-grafindo");
    const bgColor = item.status.toLowerCase() === "keluar" ? "red" : "green";
    const balanceColor = Number(item.balance) < 0 ? 'red' : 'black';
    const penandaOk = item.penanda_stok === "ok";
    const showHighlight = userGrafindo === "pika@gmail.com" && penandaOk;
    const highlightStyle = showHighlight ? "background-color:#81c784" : "";
    const balanceEmoji = showHighlight ? " ✔️" : "";

    const balanceCell = userGrafindo === "pika@gmail.com"
      ? `<td style="font-weight:bold;text-align:center;color:${balanceColor};cursor:pointer;${highlightStyle}" 
           onclick="showPenandaModal('${item.id}', '${item.balance}')">
           ${item.balance}${balanceEmoji}
         </td>`
      : `<td style="font-weight:bold;text-align:center;color:${balanceColor};${highlightStyle}">
           ${item.balance}${balanceEmoji}
         </td>`;

    newRows += `
      <tr>
        <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">#</td>
        <td style="font-weight:bold;text-align:center;color:blue">${item.qty_masuk}</td>
        ${balanceCell}
        <td style="font-weight:bold;text-align:center;color:red">${item.qty_scan}</td>
        <td>${item.lot}</td>
        <td style="font-weight:bold;text-align:center">${item.kode_depan} ${item.no_do.toUpperCase()}</td>
        <td>${item.tgl_do}</td>
        <td style="font-weight:bold;text-align:center">${item.nama_barang}</td>
        <td>${item.tgl_pb}</td>
        <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">${item.status}</td>
        <td><i>${formatDate(item.created)}</i></td>
      </tr>`;
  });

  // 🚀 Tambahkan efek shadow merah kelap-kelip ke tabel
  const tableContainer = document.querySelector('.table-container') || tableBody.closest('table');
  if (tableContainer) {
    tableContainer.classList.add('red-blink-shadow');
    // ⏳ Hapus efek setelah 15 detik
    setTimeout(() => {
      tableContainer.classList.remove('red-blink-shadow');
    }, 15000);
  }

  // prepend data baru di atas data lama
  tableBody.insertAdjacentHTML('afterbegin', newRows);
}




document.getElementById('filter-form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const query = document.getElementById('part-number').value.trim();

  // 🔹 Reset pagination setiap kali ganti part
  currentPage = 0;
  totalPages = 0;
  currentQuery = query;

  await authenticate();
  const data = await fetchData(query, true);
  renderTable(data);
  renderDetailBarang(query);
});

document.getElementById('tampilkan-stok-terakhir').addEventListener('click', async function() {
  const query = document.getElementById('part-number').value.trim();

  // 🔹 Reset pagination setiap kali ganti part
  currentPage = 0;
  totalPages = 0;
  currentQuery = query;

  const data = await fetchData(query, false);
  renderTable(data);
  renderDetailBarang(query);
});



//update cek tanda stok 
// update cek tanda stok 
async function updatePenandaStok(recordId) {
  try {
    await authenticate(); // pastikan user login
    await pb.collection('yamaha_kartu_stok').update(recordId, {
      penanda_stok: "ok"
    });

    // ambil ulang data dari database biar real
    const updatedRecord = await pb.collection('yamaha_kartu_stok').getOne(recordId);

    // Ambil user untuk cek apakah yang login pika
    const userGrafindo = localStorage.getItem("user-grafindo");

    // Cari baris tabel yang sesuai dengan recordId
    const row = document.querySelector(`#data-table-body tr td[onclick*="${recordId}"]`)?.parentElement;

    if (row && updatedRecord) {
      // Ambil sel balance (kolom ke-3 dari tabel kamu)
      const balanceCell = row.children[2];

      // Update nilainya langsung dari database
      balanceCell.textContent = updatedRecord.balance;

      // Jika penanda_stok "ok", tampilkan emoji bulat centang hijau 🟢✅
      if (updatedRecord.penanda_stok === "ok") {
        balanceCell.innerHTML += " ✔️";
        balanceCell.style.backgroundColor = "#81c784"; // hijau lembut
        balanceCell.style.borderRadius = "8px";
      }
    }

    Swal.fire({
      title: "Berhasil!",
      text: "Penanda stok telah diset menjadi OK.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Gagal update penanda_stok:", error);
    Swal.fire("Gagal!", "Tidak bisa mengupdate penanda_stok.", "error");
  }
}



// fungsi modal untuk konfirmasi penanda stok
function showPenandaModal(recordId, balanceValue) {
  Swal.fire({
    title: "Beri Penanda Stok",
    html: `
      <p><strong>Balance:</strong> ${balanceValue}</p>
      <label><input type="checkbox" id="cekOperator"> Sudah cek by operator</label>
    `,
    confirmButtonText: "Simpan",
    showCancelButton: true,
    cancelButtonText: "Batal",
    preConfirm: () => {
      const checked = document.getElementById('cekOperator').checked;
      if (!checked) {
        Swal.showValidationMessage("Harap centang terlebih dahulu");
        return false;
      }
      return checked;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await updatePenandaStok(recordId);
    }
  });
}


function renderTable(data) {
  
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Hapus data sebelumnya

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data ditemukan</td></tr>';
        return;
    }

    data.forEach((item,index) => {
        // Menentukan warna background berdasarkan status
     const userGrafindo = localStorage.getItem("user-grafindo");
        const bgColor = item.status.toLowerCase() === "keluar" ? "red" : "green";
        const balanceColor = Number(item.balance) < 0 ? 'red' : 'black';
      const penandaOk = item.penanda_stok === "ok";

    // hanya tampilkan emoji dan highlight kalau user-nya pika@gmail.com
        const showHighlight = userGrafindo === "pika@gmail.com" && penandaOk;

        // gaya background hanya untuk pika + penanda ok
        const highlightStyle = showHighlight ? "background-color:#81c784" : "";

         // kalau user pika@gmail.com, kolom balance bisa diklik
        const balanceEmoji = showHighlight  ? " ✔️" : "";

        const balanceCell = userGrafindo === "pika@gmail.com"
          ? `<td style="font-weight:bold;text-align:center;color:${balanceColor};cursor:pointer;${highlightStyle}" 
               onclick="showPenandaModal('${item.id}', '${item.balance}')">
               ${item.balance}${balanceEmoji}
             </td>`
          : `<td style="font-weight:bold;text-align:center;color:${balanceColor};${highlightStyle}">
               ${item.balance}${balanceEmoji}
             </td>`;

        const row = `<tr >
            <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">${index + 1}</td> 
            <td style="font-weight:bold;text-align:center;color:blue">${item.qty_masuk}</td>
           ${balanceCell}
            <td style="font-weight:bold;text-align:center;color:red">${item.qty_scan}</td>
            <td>${item.lot}</td>
            <td style="font-weight:bold;text-align:center">${item.kode_depan} ${item.no_do.toUpperCase()}</td>
            <td>${item.tgl_do}</td>
            <td style="font-weight:bold;text-align:center">${item.nama_barang}</td>
            <td>${item.tgl_pb}</td>
            <td style="background-color: ${bgColor}; color: white;font-weight:bold; text-align: center;">${item.status}</td>
            <td><i>${formatDate(item.created)}</i></td>
        </tr>`;
        
        tableBody.innerHTML += row;
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };
    return date.toLocaleString('id-ID', options).replace(',', '').replace(' ', ' '); // Format date
}

async function loadPartNumbers() {
    const loader = document.getElementById('loadpart');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    loader.style.display = 'block';
    progressContainer.style.display = 'block';

    try {
        let allItems = [];
        let page = 1;
        let totalPages = 1; // default sementara

        // Ambil dulu halaman pertama untuk tahu total halamannya
        const firstRes = await fetch(`${pocketbaseUrl}/api/collections/yamaha_unik_part_number/records?page=1&perPage=100&sort=-created`);
        const firstData = await firstRes.json();
        totalPages = firstData.totalPages;
        allItems = allItems.concat(firstData.items);

        // Update progress bar pertama kali
        progressBar.style.width = `${(page / totalPages) * 100}%`;
        progressText.textContent = `Memuat Part ${page} dari ${totalPages}`;

        // Lanjutkan ke halaman berikutnya
        for (page = 2; page <= totalPages; page++) {
            const res = await fetch(`${pocketbaseUrl}/api/collections/yamaha_unik_part_number/records?page=${page}&perPage=100&sort=-created`);
            const data = await res.json();

            allItems = allItems.concat(data.items);

            // Update progress bar
            const percent = Math.round((page / totalPages) * 100);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `Memuat data Part stok : proses ${page} dari ${totalPages} (${percent}%)`;

            // jeda 100ms biar smooth
            await new Promise(r => setTimeout(r, 100));
        }

        // Setelah selesai ambil semua
        const uniqueData = allItems.map(item => ({
            id: item.part_number,
            text: `${item.part_number} - ${item.nama_barang}`
        }));

        $('#part-number').select2({
            data: uniqueData,
            placeholder: 'Cari Part Number...',
            allowClear: true
        });

        console.log("Total part number loaded:", uniqueData.length);

        progressBar.style.background = '#4caf50'; // ganti hijau kalau selesai
        progressText.textContent = `Selesai! Total ${uniqueData.length} part number dimuat.`;

    } catch (error) {
        console.error("Error loading part numbers:", error);
        Swal.fire("Gagal!", "Gagal memuat daftar part number.", "error");
    } finally {
        // Sembunyikan loading text dan progress bar setelah selesai
            loader.style.display = 'none';
            progressContainer.style.display = 'none';
    }
}

async function fetchLastBalance(partNumber) {
    try {
        await authenticate(); // Pastikan user sudah login
        
        const result = await pb.collection('yamaha_kartu_stok').getList(1, 1, {
            filter: `part_number = "${partNumber}"`,
            sort: '-created' // Mengambil data terbaru
        });

        if (result.items.length > 0) {
            return result.items[0].balance; // Mengembalikan balance terakhir
        } else {
            return 'Data tidak ditemukan'; // Jika tidak ada data
        }
    } catch (error) {
        console.error("Error fetching last balance:", error);
        return 'Error fetching data'; // Mengembalikan pesan error
    }
}

async function  renderDetailBarang(query) {
    try {
        await authenticate(); // Pastikan user sudah login
        const result = await pb.collection('yamaha_data_barang').getList(1, 1, {
            filter: `part_number = "${query}"`,
        });

        const detailDiv = document.getElementById("detail_barang");

        if (result.items.length === 0) {
            detailDiv.innerHTML = "<p class='text-center'>Data tidak ditemukan</p>";
            return;
        }

        const item = result.items[0];
        const imageHtml = item.gambar 
        ? `<img src="${pocketbaseUrl}/api/files/yamaha_data_barang/${item.id}/${item.gambar}" 
               alt="${item.nama_barang}" 
               class="img-fluid rounded mb-3" 
               style="max-width: 150px;">` 
        : `<p style="color: red; font-weight: bold;">Tidak ada gambar</p>`;

      
        // Format tanggal ke "22 January 2024"
        
         const lastBalance = await fetchLastBalance(item.part_number);

        detailDiv.innerHTML = `
            <div class="p-3">
                ${imageHtml}
                <h5>${item.nama_barang}</h5>
                <p><strong>Part Number:</strong> ${item.part_number}</p>
                <p><strong>Stok Sekarang:</strong> ${lastBalance}</p> 

            </div>
        `;
    } catch (error) {
        console.error("Error fetching item details:", error);
        document.getElementById("detail_barang").innerHTML = "<p class='text-danger'>Gagal mengambil data</p>";
    }
}


document.getElementById('excel-btn').addEventListener('click', function() {
    const tableBody = document.getElementById('data-table-body');
    const rows = tableBody.querySelectorAll('tr');

    if (rows.length === 0) {
        Swal.fire('Data Kosong', 'Tidak ada data di tabel untuk diunduh.', 'warning');
        return;
    }

    // Ambil semua data dari tabel
    const data = [];
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            data.push({
                No: index + 1,
                qty_masuk: cells[1].innerText,
                balance: cells[2].innerText,
                qty_scan: cells[3].innerText,
                lot: cells[4].innerText,
                no_do: cells[5].innerText,
                tgl_do: cells[6].innerText,
                nama_barang: cells[7].innerText,
                tgl_pb: cells[8].innerText,
                status: cells[9].innerText,
                created: cells[10].innerText
            });
        }
    });

    // Ambil info tambahan
    const query = document.getElementById('part-number').value.trim();
    const userGrafindo = localStorage.getItem("user-grafindo");

    let a1Value = "";
    if (userGrafindo === "kamto@gmail.com") {
        a1Value = "FRM-INV-06";
    } else if (userGrafindo === "pika@gmail.com") {
        a1Value = "FRM-DEPO-02";
    }

    // Buat workbook & worksheet
    const workbook = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A3" });

    // Tambahkan header manual
    ws['A1'] = { t: 's', v: a1Value };
    ws['C1'] = { t: 's', v: 'KARTU STOK' };

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 0, c: 2 }, e: { r: 0, c: 9 } }
    ];

    XLSX.utils.book_append_sheet(workbook, ws, 'Kartu Stok');

    // Nama file berdasarkan part_number + tanggal
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    const partNumber = data[0]?.part_number || query || "data";
    const fileName = `${partNumber}_${formattedDate}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);

    Swal.fire({
        title: 'Berhasil!',
        text: 'File Excel berhasil diunduh dari tabel yang tampil.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
    });
});
