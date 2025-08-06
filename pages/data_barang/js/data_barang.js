const pb = new PocketBase(pocketbaseUrl);

let currentPage = 1; // Halaman saat ini
const pageSize = 100; // Jumlah item per halaman

async function authenticate() {
    try {
        const authData = await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
        console.log('Authenticated:', authData);
        loadData(currentPage);

    } catch (error) {
        console.error('Authentication failed:', error);
    }
}

async function loadData(pageini) {
   
    await loadIkutSetOptions('ikut_set'); // Pastikan opsi diisi sebelum menampilkan modal

    try {
        // Ambil data dengan pagination
        const result = await pb.collection('data_barang').getList(pageini, pageSize, {
            sort: "-updated"
        });
        console.log(result)
        console.log(pageini, pageSize)
        const records = result.items; // Ambil data item
        const totalItems = result?.totalItems ?? 0;
        let totalPages = Math.ceil(totalItems / pageSize);
        updatePagination(pageini, totalPages);

        const dataBody = document.getElementById('dataBody');
        dataBody.innerHTML = '';

        records.forEach(record => {
            const imageUrl = `${pocketbaseUrl}/api/files/data_barang/${record.id}/${record.gambar}`;
            const imageCell = record.gambar ? 
                `<img src="${imageUrl}" alt="${record.nama_barang}" style="width:300px;height:180px">` : 
                'Tidak ada gambar'; // Teks jika tidak ada gambar

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${imageCell}</td>
                <td>${record.nama_barang}</td>
                <td>${record.part_number}</td>
                <td>${record.ikut_set}</td>
                <td>
                    <button class="btn btn-warning" onclick="editData('${record.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteData('${record.id}')">Delete</button>
                </td>
            `;
            dataBody.appendChild(row);
        });
         currentPage = pageini;
        // Update pagination
        updatePagination(currentPage, totalPages);
    } catch (error) {
        console.error('Error loading data:', error);
        Swal.fire({
            icon:"error",
            title:"tidak dapat ambil data barang coba refresh",
            timer:1500
        })
    }finally {
        // Sembunyikan preloader setelah data selesai dimuat
        document.getElementById('loadingSpinner').style.display = 'none';
    }
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ambil nilai dari input
    const nama_barang = document.getElementById('nama_barang').value;
    const part_number = document.getElementById('part_number').value.trim().toUpperCase(); // Normalisasi input
   let ikut_set = '';
    if (document.getElementById('toggle_set_input').checked) {
        ikut_set = document.getElementById('ikut_set_input').value.trim();
    } else {
        ikut_set = document.getElementById('ikut_set').value;
    }


    const gambar = document.getElementById('gambar').files[0];

    // Cek apakah part_number sudah ada
    const existingRecords = await pb.collection('data_barang').getFullList();
    const partNumbers = existingRecords.map(record => record.part_number.trim().toUpperCase());

    if (partNumbers.includes(part_number)) {
        Swal.fire(`Part number "${part_number}" sudah pernah dimasukkan!`, `janga masukkan partnumber yg sudah pernah dimasukkan`, 'error');
        // Clear input fields
        document.getElementById('part_number').value = '';
        document.getElementById('nama_barang').value = '';
        document.getElementById('ikut_set').value = '';
        document.getElementById('gambar').value = ''; // Clear file input
        return; // Hentikan eksekusi lebih lanjut
    }

    // Jika part_number belum ada, lanjutkan untuk menambahkan data
    const formData = new FormData();
    formData.append('nama_barang', nama_barang);
    formData.append('part_number', part_number);
    formData.append('ikut_set', ikut_set);
if (gambar) {
    formData.append('gambar', gambar);
}

    try {
        await pb.collection('data_barang').create(formData);
        Swal.fire('Success', 'Data barang berhasil ditambahkan!', 'success');
        loadData();
        $('#addModal').modal('hide');
    } catch (error) {
        console.error('Error adding data:', error);
        Swal.fire('Error', 'Gagal menambahkan data barang!', 'error');
    }
});

async function editData(id) {
    try {

        const record = await pb.collection('data_barang').getOne(id);
      
          await loadIkutSetOptions('edit_ikut_set');

        // Gunakan setTimeout agar eksekusi menunggu dropdown terisi
        setTimeout(() => {
            document.getElementById('edit_nama_barang').value = record.nama_barang;
            document.getElementById('edit_part_number').value = record.part_number;
            document.getElementById('edit_ikut_set').value = record.ikut_set;
            document.getElementById('edit_record_id').value = record.id;

         // Deteksi apakah 'ikut_set' ada di dropdown
            const dropdownOptions = [...document.getElementById('edit_ikut_set').options].map(opt => opt.value.trim());
            const ikutSetTrimmed = record.ikut_set ? record.ikut_set.trim() : '';

            if (dropdownOptions.includes(ikutSetTrimmed)) {
                // Pakai dropdown
                document.getElementById('toggle_edit_set_input').checked = false;
                document.getElementById('edit_ikut_set').value = ikutSetTrimmed;
                document.getElementById('edit_ikut_set_input').style.display = 'none';
                document.getElementById('edit_ikut_set').style.display = 'block';
                document.getElementById('edit_ikut_set_input').value = '';
            } else {
                // Pakai input teks
                document.getElementById('toggle_edit_set_input').checked = true;
                document.getElementById('edit_ikut_set_input').value = ikutSetTrimmed;
                document.getElementById('edit_ikut_set').style.display = 'none';
                document.getElementById('edit_ikut_set_input').style.display = 'block';
                document.getElementById('edit_ikut_set').value = '';
            }

            // Tampilkan modal setelah semua data siap
            $('#editModal').modal('show');
        }, 300); // Delay 300ms agar opsi dropdown terisi lebih dulu
    } catch (error) {
        console.error('Error fetching record for edit:', error);
    }
}

async function deleteData(id) {
    const confirmDelete = await Swal.fire({
        title: 'Yakin DI hapus ?',
        text: "Data ini akan dihapus!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirmDelete.isConfirmed) {
        try {
            await pb.collection('data_barang').delete(id);
            Swal.fire('Deleted!', 'Data barang telah dihapus.', 'success');
            loadData();
        } catch (error) {
            console.error('Error deleting data:', error);
            Swal.fire('Error', 'Gagal menghapus data barang!', 'error');
        }
    }
}

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerText = 'Sebelumnya';
    prevButton.className = 'btn btn-secondary';
    prevButton.disabled = currentPage <= 1; // Disable jika di halaman pertama
    prevButton.onclick = () => {
        if (currentPage > 1) {
            loadData(currentPage - 1);
        }
    };

    paginationContainer.appendChild(prevButton);

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.innerText = `Halaman ${currentPage} dari ${totalPages}`;
    pageInfo.style.margin = "0 10px";
    paginationContainer.appendChild(pageInfo);

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerText = 'Selanjutnya';
    nextButton.className = 'btn btn-secondary';
    nextButton.disabled = currentPage == totalPages; // Disable jika di halaman terakhir
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++
            loadData(currentPage);
        }
    };

    paginationContainer.appendChild(nextButton);
}


authenticate();




document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = document.getElementById('submitButton'); // Ambil tombol submit
    submitButton.disabled = true; // Nonaktifkan tombol
    submitButton.textContent = "Sedang mengupdate..."; // Ubah teks tombol


    const id = document.getElementById('edit_record_id').value; // Ambil ID record
    const nama_barang = document.getElementById('edit_nama_barang').value;
    const part_number = document.getElementById('edit_part_number').value.trim().toUpperCase();
    const ikut_set = document.getElementById('edit_ikut_set').value;
    const gambar = document.getElementById('edit_gambar').files[0];

    const formData = new FormData();
    formData.append('nama_barang', nama_barang);
    formData.append('part_number', part_number);
    formData.append('ikut_set', ikut_set);
    if (gambar) {
        formData.append('gambar', gambar); // Hanya tambahkan gambar jika ada
    }

    try {
        await pb.collection('data_barang').update(id, formData);
         Swal.fire({
            title: 'Success',
            text: 'Data barang berhasil diperbarui!',
            icon: 'success',
            timer: 1200, // Swal akan otomatis tertutup setelah 1.2 detik
            showConfirmButton: false // Hilangkan tombol OK agar otomatis tertutup
        });
        loadData(currentPage); // Muat ulang data setelah pembaruan
        $('#editModal').modal('hide'); // Sembunyikan modal setelah berhasil
    } catch (error) {
        console.error('Error updating data:', error);
        Swal.fire('Error', 'Gagal memperbarui data barang!', 'error');
    }finally {
        submitButton.disabled = false; // Aktifkan kembali tombol
        submitButton.textContent = "Update Data"; // Kembalikan teks tombol
    }
});


// cari barang
document.getElementById('cari_part').addEventListener('click', async () => {
    let partNumberInput = document.getElementById('input_cari_part').value.trim();
    
    if (!partNumberInput) {
        Swal.fire('Error', 'Masukkan nomor part terlebih dahulu!', 'error');
        return;
    }

    partNumberInput = partNumberInput.replace(/\s+/g, '').toUpperCase();

    await searchPart(partNumberInput);
});


async function searchPart(partNumber) {
    try {
        document.getElementById('loadingSpinner').style.display = 'block';
       

        const result = await pb.collection('data_barang').getList(1, 50, {
            filter: `part_number = "${partNumber}"`
        });

        if (result.items.length === 0) {
            Swal.fire('Hasil Tidak Ditemukan', `Tidak ada barang dengan nomor part "${partNumber}"`, 'warning');
            return;
        }

        const dataBody = document.getElementById('dataBody');
        dataBody.innerHTML = '';

        result.items.forEach(record => {
            const imageUrl = `${pocketbaseUrl}/api/files/data_barang/${record.id}/${record.gambar}`;
            const imageCell = record.gambar ? `<img src="${imageUrl}" alt="${record.nama_barang}" style="width:350px;height:250px">` : 'Tidak ada gambar';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${imageCell}</td>
                <td>${record.nama_barang}</td>
                <td>${record.part_number}</td>
                <td>${record.ikut_set}</td>
                <td>
                    <button class="btn btn-warning" onclick="editData('${record.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteData('${record.id}')">Delete</button>
                </td>
            `;
            dataBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error searching data:', error);
        Swal.fire('Error', 'Gagal mencari data barang!', 'error');
    } finally {
    document.getElementById('loadingSpinner').style.display = 'none';

    }
}


