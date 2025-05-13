document.addEventListener("DOMContentLoaded", async function () {
const pb = new PocketBase(pocketbaseUrl);
let currentPage = 1;
const perPage = 15;

function formatDate(dateString) {
const options = {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: 'Asia/Jakarta'
};

const date = new Date(dateString);
return date.toLocaleString('id-ID', options);
}



async function fetchDataByNoDn(no_dn) {
    Swal.fire({
        title: "Mengambil data report...",
        didOpen: () => Swal.showLoading(),
    });

    try {
        const resultList = await pb.collection("kartu_stok").getList(1, perPage, {
            sort: "-created",
            filter: `no_dn = '${no_dn}' && status = 'keluar'`
        });

        renderTable(resultList.items);
        

    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        Swal.close();
    }
}



async function authenticateUser() {
    try {
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
    } catch (error) {
        console.error("Authentication failed:", error);
        Swal.fire({
            icon: "error",
            title: "Authentication Failed",
            text: "Gagal masuk ke sistem. Periksa kembali kredensial Anda."
        });
    }
}

async function fetchData(page) {
    document.getElementById("loading_report").style.display = "block";
    const progressBar = document.getElementById("progressBar");
    const loadingText = document.getElementById("loading_text");

    try {
        const response = await fetch(`${pocketbaseUrl}/api/collections/unik_no_dn_kartu_stok/records?page=${page}&perPage=${perPage}&sort=-created`);
        const resultList = await response.json();

        const uniqueNoDns = resultList.items.map(item => item.no_dn); // ambil field no_dn

        const total = uniqueNoDns.length;
        let completed = 0;
        // Step 2: Ambil data lengkap untuk setiap no_dn
        const allData = [];
        for (const no_dn of uniqueNoDns) {
            const records = await pb.collection("kartu_stok").getFullList({
                sort: "-created",
                filter: `no_dn = '${no_dn}' && status = 'keluar'`
            });
            allData.push(...records);
            completed++;
            const percent = Math.round((completed / total) * 100);
            progressBar.style.width = percent + "%";
            progressBar.setAttribute("aria-valuenow", percent);
            progressBar.innerText = percent + "%";
            loadingText.textContent = "Report detail berhasil didapat, tunggu sedang menampilkan...";
        }

        renderTable(allData);
        updatePagination(resultList.page, resultList.totalPages);
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
          document.getElementById("loading_report").style.display = "none"; // Sembunyikan spinner
    }
}

function renderTable(data) {
    const container = document.getElementById("data-container");
    container.innerHTML = "";

    const groupedData = {};
    data.forEach(item => {
        const key = `${item.no_dn}-${item.part_number}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                ...item,
                qty_ambil: parseInt(item.qty_ambil, 10) || 0, // Ensure numeric value
            };
        } else {
            groupedData[key].qty_ambil += parseInt(item.qty_ambil, 10) || 0;
        }
    });

    const groupedArray = Object.values(groupedData);

    const noDnGroups = {};
    groupedArray.forEach(item => {
        if (!noDnGroups[item.no_dn]) {
            noDnGroups[item.no_dn] = [];
        }
        noDnGroups[item.no_dn].push(item);
    });
   


    Object.keys(noDnGroups).forEach(no_dn => {

        let rowIndex = 1;
        const dataHead = noDnGroups[no_dn][0];
        const totalItemsOk = noDnGroups[no_dn].filter(item => item.qty_minta == item.qty_ambil).length;

        const tableHtml = `
            <hr style="border:2px solid black"/>
            <div style="border:1px solid black">
                <div class="row">
                <div class="col-sm-12 col-md-2 col-lg-2">
                    <h6 class="mt-4" id="no_dn_print" style="background-color:black;color:white;padding:3px;font-weight:bold;text-align:center">${no_dn}</h6>
                </div>
                <div class="col-sm-12 col-md-2 col-lg-2">
                    <h6>Tanggal DO : </h6>
                    <b>${dataHead.dn_date}</b>
                </div>
                <div class="col-sm-12 col-md-2 col-lg-2">
                    <h6>Nama Cust:</h6>
                </div>
                <div class="col-sm-12 col-md-2 col-lg-2">
                        <h6>Jumlah barang:</h6>
                    <b style="text-align:center">${dataHead.jumlah_barang_do}</b>

                    </div>
                <div class="col-sm-12 col-md-2 col-lg-2">
                    <b style="font-size:13px;text-align:center">Plant ID : ${dataHead.plant_id}</b><br/>
                    <b style="font-size:13px;text-align:center">${dataHead.plant_desc}</b><br/>
                    <b style="font-size:13px;text-align:center">Gate : ${dataHead.gate_id}</b>

                    </div>
                <div class="col-sm-12 col-md-2 col-lg-2">
                    <h5 style="font-weight:bold">Status</h5>
                      <h5 style="font-weight:bold">
            ${totalItemsOk === Number(dataHead.jumlah_barang_do) 
            ? '<span style="color: green;">OK</span>'
            : '<span style="color: red;">Tidak Full Scan</span>'}

            </h5>
                </div>
            </div>
            </div>
            <table class="table table-bordered table-responsive w-100 d-block d-md-table" >
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Part Number</th>
                        <th>Nama Barang</th>
                        <th>Lot</th>
                        <th>Scan Terakhir</th>
                        <th>Qty Do</th>
                        <th>Qty Scan</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${noDnGroups[no_dn].map(item => {
                        const status = item.qty_minta == item.qty_ambil 
                            ? '<span style="color: green; font-weight: bold; text-align: center;">OK</span>'
                            : '<span style="color: red; font-weight: bold; text-align: center;">Tidak Full Scan</span>';
                        return `
                        <tr>
                            <td>${rowIndex++}</td>
                            <td style="font-weight:bold">${item.part_number}</td>
                            <td style="font-weight:bold">${item.nama_barang}</td>
                            <td><i>${item.lot}</i></td>
                            <td><i>${formatDate(item.created)}</i></td>
                            <td style="font-weight:bold">${item.qty_minta}</td>
                            <td style="font-weight:bold">${item.qty_ambil}</td>
                            <td style="text-align:center">${status}</td>
                        </tr>
                            `;
                    }).join("")}
                </tbody>
            </table>


        `;
        container.innerHTML += tableHtml;
    });
}

function updatePagination(page, totalPages) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = `
        <button class="btn btn-primary" ${page <= 1 ? "disabled" : ""} onclick="changePage(${page - 1})">Previous</button>
        <span class="mx-2">Halaman ${page} dari ${totalPages}</span>
        <button class="btn btn-primary" ${page >= totalPages ? "disabled" : ""} onclick="changePage(${page + 1})">Next</button>
    `;
}

window.changePage = function (newPage) {
    if (newPage < 1) return;
    currentPage = newPage;
    document.getElementById("loading_report").style.display = "block"; // Sembunyikan spinner
    fetchData(currentPage);
};


document.getElementById("search-btn").addEventListener("click", function () {
    let inputNoDn = document.getElementById("input-no-dn").value;
     inputNoDn = inputNoDn.toUpperCase().replace(/\s+/g, '');

    if (inputNoDn) {
        fetchDataByNoDn(inputNoDn);
    } else {
        Swal.fire({
            icon: "warning",
            title: "Input No Dn dahulu",
            text: "Silakan input no dn  dahulu."
        });
    }
});

await authenticateUser();
fetchData(currentPage);

});
