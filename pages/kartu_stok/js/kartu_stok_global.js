    const pb = new PocketBase(pocketbaseUrl);
        let currentPage = 1;
        let totalPages = 0;

        async function authenticate() {
            try {
                const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
                return authData;
            } catch (error) {
                console.error("Authentication failed:", error);
            }
        }

        async function fetchData(page) {
            try {
                const resultList = await pb.collection('kartu_stok').getList(page, 10, {
                    sort: '-created' // Mengurutkan berdasarkan field 'created' secara menurun
                });
                return resultList;
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        }

        function renderTable(data) {
            const tableBody = document.getElementById('data-table-body');
            tableBody.innerHTML = '';
            data.items.forEach(item => {
                const row = `<tr>
                    <td>${item.no_dn}</td>
                    <td>${item.part_number}</td>
                    <td>${item.nama_barang}</td>
                    <td>${item.qty_minta}</td>
                    <td>${item.qty_ambil}</td>
                    <td>${item.status}</td>
                </tr>`;
                tableBody.innerHTML += row;
            });
        }

        function renderPagination() {
            const pagination = document.getElementById('pagination');
            pagination.innerHTML = '';

            const prevButton = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(currentPage - 1)">Previous</a>
            </li>`;
            pagination.innerHTML += prevButton;

            for (let i = 1; i <= totalPages; i++) {
                const pageItem = `<li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>`;
                pagination.innerHTML += pageItem;
            }

            const nextButton = `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(currentPage + 1)">Next</a>
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