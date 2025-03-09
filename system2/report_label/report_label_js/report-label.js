let currentLoadPage = 1; // Current page
const itemsPerPageLoad = 100; // Items per page

// Function to load input data
async function loadInputData(page = 1) {
    document.getElementById('loadinput').innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';

    try {
        const response = await fetch(`${pocketbaseUrl}/api/collections/system2_scan_input/records?page=${page}&perPage=${itemsPerPageLoad}&sort=-created`);

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        const items = result.items;
        const totalItems = result.totalItems; // Total items for pagination

        // Display data in table
        displayDataInTable(items);
        // Display pagination
        displayPagination(totalItems, page);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('loadinput').innerHTML = '<p>Error loading data.</p>';
    }
}

// Function to display data in table
// Function to display data in table
function displayDataInTable(items) {
    // Group items by operator
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.operator]) {
            acc[item.operator] = [];
        }
        acc[item.operator].push(item);
        return acc;
    }, {});

    let tableHTML = '';

    // Iterate over each operator group
    for (const operator in groupedItems) {
        const operatorItems = groupedItems[operator];

        // Add operator header
        tableHTML += `
            <div style="background-color:#eeeeee;">
            <h5 style="font-weight: bold;">OP: ${operator}</h5>
            <table class="table table-bordered table-responsive">
                <thead>
                    <tr>
                        <th>Merk</th>
                        <th>Part Number</th>
                        <th>Nama Barang</th>
                        <th>Qty</th>
                        <th>Satuan</th>
                        <th>Lot</th>
                        <th>Depo</th>
                        <th>Supplier ID</th>
                        <th>Tgl Inspeksi</th>
                        <th>Dibuat</th>
                    </tr>
                </thead>
                <tbody>
        `;

        operatorItems.forEach(item => {
            // Format the created date
            const createdDate = new Date(item.created).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            tableHTML += `
                <tr>
                    <td>${item.merk}</td>
                    <td>${item.part_number}</td>
                    <td>${item.nama_barang}</td>
                    <td>${item.qty}</td>
                    <td>${item.satuan}</td>
                    <td>${item.lot}</td>
                    <td>${item.depo}</td>
                    <td>${item.supplier_id}</td>
                    <td>${new Date(item.tgl_inspeksi).toLocaleDateString()}</td>
                    <td>${createdDate}</td> <!-- Display the created date -->
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
            </div>
        `;
    }

    document.getElementById('loadinput').innerHTML = tableHTML;
}

// Function to display pagination
function displayPagination(totalItems, currentLoadPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPageLoad);
    let paginationHTML = `<nav aria-label="Page navigation"><ul class="pagination">`;

    // Previous button
    if (currentLoadPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadInputData(${currentLoadPage - 1})">Previous</a></li>`;
    } else {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">Previous</span></li>`;
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentLoadPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadInputData(${i})">${i}</a>
            </li>
        `;
    }

    // Next button
    if (currentLoadPage < totalPages) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="loadInputData(${currentLoadPage + 1})">Next</a></li>`;
    } else {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">Next</span></li>`;
    }

    paginationHTML += `</ul></nav>`;
    paginationHTML += `<p>Halaman ${currentLoadPage} dari ${totalPages} | Total Items: ${totalItems}</p>`;

    document.getElementById('pagination').innerHTML = paginationHTML;
}

// Load data when the document is ready
$(document).ready(() => loadInputData(currentLoadPage));