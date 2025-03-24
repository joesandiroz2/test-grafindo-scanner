let currentPage = 1; // Halaman saat ini
const perPage = 60; // Jumlah item per halaman

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', options).replace(',', ''); // Format sesuai dengan yang diinginkan
}

async function fetchData(partNumber, noLot) {
    try {
        // Tampilkan loading indicator
        Swal.fire({
            title: 'Loading...',
            text: 'Mengambil data, harap tunggu...',
            allowOutsideClick: false,
            onBeforeOpen: () => {
                Swal.showLoading();
            }
        });

        // Autentikasi
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);

        // Ambil data dari koleksi kartu_stok
        const filter = `part_number = "${partNumber}" `; // Filter pencarian
        const resultList = await pb.collection('kartu_stok').getList(1, 1, {
            sort: '-created', // Mengurutkan berdasarkan tanggal terbaru
            filter: filter, // Ganti dengan filter yang sesuai
        });

        // Hapus loading indicator
        Swal.close();

        // Tampilkan data di tabel
        displayResults(resultList.items, partNumber, noLot);
        // Memutar suara
        const audio = new Audio('../../suara/suara_ok.mp3');
        audio.play();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Terjadi kesalahan saat mengambil data.', 'error');
    }
}

async function displayResults(items, partNumber, noLot) {
    const resultContainer = $("#result-container");
    const latestDataContainer = $("#latest-data-container");
    const errorContainer = $("#error-container");
    
    resultContainer.empty(); // Kosongkan hasil sebelumnya
    latestDataContainer.empty(); // Kosongkan data terbaru sebelumnya
    errorContainer.hide(); // Sembunyikan pesan kesalahan

    if (items.length > 0) {
       document.getElementById("namabarang").value = items[0].nama_barang;

        // Tampilkan hasil pencarian
        let tableRows = items.map(item => {
            const lastDate = formatDate(item.created); // Format tanggal terakhir
            const balanceStyle = item.balance < 0 ? 'color: red; font-weight: bold;' : ''; // Gaya untuk balance
            return `
                <tr>
                    <td>${item.no_dn}</td>
                    <td>${item.part_number}</td>
                    <td>${item.lot}</td>
                    <td style="font-weight:bold">${item.nama_barang}</td>
                    <td style="${balanceStyle}">${item.balance}</td>
                    <td style="font-style:italic">${lastDate}</td> <!-- Menampilkan tanggal terakhir -->
                </tr>
            `;
        }).join('');

        let table = `
            <h6>Data Ditemukan: ${items.length} item</h6>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>No DN</th>
                        <th>Part Number</th>
                        <th>Lot</th>
                        <th>Nama Barang</th>
                        <th>Balance</th>
                        <th>Terakhir Scan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>`;
        
        resultContainer.html(table);
    } else {
       const latestItems = await getLatestItems(partNumber, currentPage);
        await error_ga_ditemukan(latestItems,partNumber, noLot); // Panggil fungsi untuk menampilkan data terbaru
    }
    $("#inputan_pb_baru").show(); // Tampilkan inputan tambahan setelah pencarian
}
async function error_ga_ditemukan(resultList, partNumber, noLot) {
    console.log(resultList)
    const latestItems = resultList.items;
    const totalPages = resultList.totalPages;
    
    const latestDataContainer = $("#latest-data-container");
    const errorContainer = $("#error-container");

    if (latestItems.length > 0) {
        let tableRows = latestItems.map(item => {
            const lastDate = new Date(item.created).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + 
                ' ' + 
                new Date(item.created).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

            const balanceStyle = parseInt(item.balance) < 0 ? 'color: red; font-weight: bold;' : '';
            
            return `
                <tr>
                    <td>${item.no_dn}</td>
                    <td>${item.part_number}</td>
                    <td>${item.lot}</td>
                    <td>${item.balance}</td>
                    <td style="font-weight:bold">${item.nama_barang}</td>
                    <td style="font-style:italic">${lastDate}</td>
                </tr>
            `;
        }).join('');

        let table = `
            <table class="table table-bordered" >
                <thead>
                    <tr>
                        <th>No DN</th>
                        <th>Part Number</th>
                        <th>Lot</th>
                        <th>Balance</th>
                        <th>Nama Barang</th>
                        <th>Terakhir Scan</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>`;
        
        // Tambahkan elemen pagination dengan batas `totalPages`
        let pagination = `
            <div id="pagination">
                <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button>
                <span>Halaman ${currentPage} dari ${totalPages}</span>
                <button id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Selanjutnya</button>
            </div>
        `;
        latestDataContainer.html(pagination);
        latestDataContainer.append(table);
        latestDataContainer.show();
        errorContainer.hide();

        // Event listener untuk pagination
        $("#prev-page").on("click", () => changePage(currentPage - 1, partNumber, noLot, totalPages));
        $("#next-page").on("click", () => changePage(currentPage + 1, partNumber, noLot, totalPages));
    } else {
        errorContainer.html('<h6>Tidak ada data yang ditemukan.</h6>').show();
        latestDataContainer.hide();
    }
}



async function changePage(page, partNumber, noLot) {
    if (page < 1) return; // Cegah halaman negatif
    currentPage = page; // Update currentPage
    const latestItems = await getLatestItems(partNumber, currentPage);
    await error_ga_ditemukan(latestItems,partNumber, noLot); // Panggil fungsi untuk menampilkan data terbaru
}


async function getLatestItems(partNumber, page = 1) {
    const filter = `part_number = "${partNumber}" `;
    const resultList = await pb.collection('kartu_stok').getList(1, 1, {
        sort: '-created',
        filter: filter,
    });
    return resultList;
}

// Event listener untuk tombol cari
$("#search-button").on("click", function() {
    let partNumber = $("#part-number").val().trim();
    let noLot = $("#no-lot").val().trim();

    // Mengubah Part Number menjadi huruf besar dan menghilangkan spasi
    partNumber = partNumber.toUpperCase().replace(/\s+/g, '');

    // Menghilangkan spasi dan angka nol di depan untuk No Lot
    noLot = noLot.replace(/\s+/g, '').replace(/^0+/, '');

    if (partNumber === "" || noLot === "") {
        Swal.fire('Warning', 'Silakan masukkan Part Number dan No Lot.', 'warning');
        return;
    }
     $(this).prop('disabled', true).text('Sedang Mencari...');

     fetchData(partNumber, noLot)
        .then(() => {
            // Mengembalikan tombol ke keadaan semula
            $("#search-button").prop('disabled', false).text('Cari');
        })
        .catch((error) => {
            console.error(error);
            // Mengembalikan tombol ke keadaan semula jika terjadi kesalahan
            $("#search-button").prop('disabled', false).text('Cari');
        });
});