
const openModalBtn = document.getElementById('openModalBtn');

openModalBtn.addEventListener('click', async () => {
  try {
     // Ubah teks tombol dan disable
    openModalBtn.textContent = 'Sedang mendapatkan data label...';
    openModalBtn.disabled = true;

    const records = await pb.collection('sinta_gse_part').getFullList({
      sort:'-created'
    });
    showCrudList(records);

  } catch (err) {
    Swal.fire('Error', 'Gagal load data: ' + err.message, 'error');
  }finally {
    // Kembalikan teks dan enable tombol
    openModalBtn.textContent = 'Tambah Part Number Baru';
    openModalBtn.disabled = false;
  }
});

function showCrudList(records) {
  const htmlList = records.map(rec => `
    <li style="margin-bottom:10px;">
      ${rec.nama_part} - ${rec.part_no}
      <button class="btn btn-warning" onclick="editPart('${rec.id}', '${rec.nama_part}', '${rec.part_no}')" class="btn btn-small yellow darken-2" style="margin-left:10px;">Edit</button>
      <button class="btn btn-danger" onclick="deletePart('${rec.id}')" class="btn btn-small red" style="margin-left:5px;">Delete</button>
    </li>
  `).join('');

  Swal.fire({
    title: 'Data Label GSE',
    html: `
      <button class="btn btn-info" onclick="addPart()" class="btn green" style="margin-top:20px;">Tambah Baru</button>
      <ul style="text-align:left;">${htmlList || '<li>Tidak ada data.</li>'}</ul>
    `,
    showConfirmButton: false,
    width: '1000px',
  });
}

function addPart() {
  Swal.fire({
    title: 'Tambah Part',
    html: `
      <input id="namaPartInput" class="swal2-input" placeholder="Nama Part">
      <input id="partNoInput" class="swal2-input" placeholder="Part No">
    `,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    preConfirm: async () => {
      const nama_part = document.getElementById('namaPartInput').value.trim();
      const part_no = document.getElementById('partNoInput').value.trim();
      if (!nama_part || !part_no) {
        Swal.showValidationMessage('Nama Part dan Part No wajib diisi!');
        return false;
      }
      try {
        await pb.collection('sinta_gse_part').create({ nama_part, part_no });
        const records = await pb.collection('sinta_gse_part').getFullList({
          sort:"-created"
        });
        showCrudList(records);
      } catch (err) {
        Swal.showValidationMessage('Gagal simpan: ' + err.message);
      }
    }
  });
}

function editPart(id, nama, no) {
  Swal.fire({
    title: 'Edit Part',
    html: `
      <input id="namaPartInput" class="swal2-input" value="${nama}" placeholder="Nama Part">
      <input id="partNoInput" class="swal2-input" value="${no}" placeholder="Part No">
    `,
    showCancelButton: true,
    confirmButtonText: 'Update',
    preConfirm: async () => {
      const nama_part = document.getElementById('namaPartInput').value.trim();
      const part_no = document.getElementById('partNoInput').value.trim();
      if (!nama_part || !part_no) {
        Swal.showValidationMessage('Nama Part dan Part No wajib diisi!');
        return false;
      }
      try {
        await pb.collection('sinta_gse_part').update(id, { nama_part, part_no });
        const records = await pb.collection('sinta_gse_part').getFullList({
          sort:"-created"
        });
        showCrudList(records);
      } catch (err) {
        Swal.showValidationMessage('Gagal update: ' + err.message);
      }
    }
  });
}

function deletePart(id) {
  Swal.fire({
    title: 'Yakin ingin menghapus?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await pb.collection('sinta_gse_part').delete(id);
        const records = await pb.collection('sinta_gse_part').getFullList({
          sort:"-created"
        });
        showCrudList(records);
      } catch (err) {
        Swal.fire('Error', 'Gagal hapus: ' + err.message, 'error');
      }
    }
  });
}

let search_part = []
// select search
$(document).ready(async function () {
  try {
     $('#loadingSpinner').show();

        // Ambil data dari PocketBase
        const records = await pb.collection('sinta_gse_part').getFullList();
        
        // Update search_part dengan data dari PocketBase
        search_part = records.map(rec => ({
            nama_part: rec.nama_part,
            part_no: rec.part_no
        }));

    // Inisialisasi Select2
    $("#search-part").select2({
        placeholder: "Cari Nama Part atau Part No",
        allowClear: true,
        data: search_part.map(item => ({
            id: item.part_no,
            text: `${item.nama_part} (${item.part_no})`, // Perbaikan di sini
            nama_part: item.nama_part,  // Simpan nama_part di data
            part_no: item.part_no       // Simpan part_no di data
        }))
    });
      $('#loadingSpinner').hide();

     } catch (err) {
       alert('Gagal load data coba refresh: ' + err.message);
    }
    // Event saat memilih part
    $("#search-part").on("change", function () {
        let selectedData = $("#search-part").select2("data")[0]; // Ambil data terpilih

        if (selectedData) {
            $("#part_number").val(selectedData.part_no);  // Isi Part Number
            $("#nama_barang").val(selectedData.nama_part); // Isi Nama Barang
        } else {
            $("#part_number").val("");  // Kosongkan jika tidak ada yang dipilih
            $("#nama_barang").val("");
        }
    });
});
