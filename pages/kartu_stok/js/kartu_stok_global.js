const pb = new PocketBase(pocketbaseUrl);
let currentPage = 1;
let totalPages = 0;

// Function to format the date
function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Define options for formatting
    const options = { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };

    // Format the date
    const formattedDate = date.toLocaleString('id-ID', options);
    
    // Remove the comma and format the output
    return formattedDate.replace(',', '').replace(' ', ' '); // Adjust space if needed
}

async function authenticate() {
    try {
        const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
        return authData;
    } catch (error) {
        console.error("Authentication failed:", error);
    }
}

async function fetchData(page) {
    Swal.fire({
        title: 'Sedang memuat kartu stok...',
        didOpen: () => {
            Swal.showLoading();
        }
    });
    try {
        const resultList = await pb.collection('kartu_stok').getList(page, 60, {
            sort: '-created' // Mengurutkan berdasarkan field 'created' secara menurun
        });
        Swal.close();
        return resultList;
    } catch (error) {
        console.error("Failed to fetch data:", error);
        Swal.close();
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = '';
    data.items.forEach(item => {
        const formattedDate = formatDate(item.created);

        // Determine the status style and icon
        let statusStyle = '';
        let statusIcon = '';
        
        if (item.status === 'keluar') { // Assuming 'keluar' means out
            statusStyle = 'color: red; font-weight: bold;';
            statusIcon = '❌'; // Minus icon
        } else if (item.status === 'masuk') { // Assuming 'masuk' means in
            statusStyle = 'color: green; font-weight: bold;';
            statusIcon = '✅'; // Plus icon
        } else {
            statusStyle = 'color: black;'; // Default style for other statuses
            statusIcon = ''; // No icon for other statuses
        }

        const row = `<tr>
            <td>${item.no_dn.toUpperCase()}</td>
            <td style="background-color:yellow;font-weight:bold">${item.part_number}</td>
            <td style="font-weight:bold">${item.nama_barang}</td>
            <td style="background-color:black;font-weight:bold;color:white">${item.lot}</td>
            <td>${item.qty_minta}</td>
            <td>${item.tgl_pb}</td>
            <td style="background-color: green; font-weight:bold;text-align:center; color:white">${item.qty_masuk}</td>
            <td style="background-color: red; font-weight:bold;text-align:center; color:white">${item.qty_ambil}</td>
            <td style="${statusStyle}">${statusIcon} ${item.status}</td>
            <td><i>${formattedDate}</i></td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevButton = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(currentPage - 1)">Sebelumnya</a>
    </li>`;
    pagination.innerHTML += prevButton;

    // Current page indicator
    const pageInfo = `<li class="page-item disabled">
        <span class="page-link">Halaman ${currentPage} dari ${totalPages}</span>
    </li>`;
    pagination.innerHTML += pageInfo;

    // Next button
    const nextButton = `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="changePage(currentPage + 1)">Halaman Selanjutnya</a>
    </li>`;
    pagination.innerHTML += nextButton;
}

async function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    const data = await fetchData(currentPage);
    totalPages = data.totalPages; // Update total pages based on fetched data
    renderTable(data);
    renderPagination();
}

(async () => {
    await authenticate();
    const data = await fetchData(currentPage);
    totalPages = data.totalPages; // Set total pages from fetched data
    renderTable(data);
    renderPagination();
})();