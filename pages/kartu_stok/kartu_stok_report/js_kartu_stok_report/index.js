const recordsPerPage = 500;
let currentPage = 1;
let totalRecords = 0;

async function authUser () {
    const pb = new PocketBase(pocketbaseUrl);
    try {
        await pb.collection('users').authWithPassword(username_pocket, user_pass_pocket);
        loadReport(currentPage);
    } catch (error) {
        console.error("Login failed:", error);
    }
}

async function loadReport(page) {
    const pb = new PocketBase(pocketbaseUrl);
    $('#loading').show(); // Tampilkan preloader
    try {
        const response = await pb.collection('kartu_stok').getList(page, recordsPerPage, {
            sort: "-created"
        }); // Ambil data dengan pagination
        totalRecords = response.totalItems; // Total item dari response
        const records = response.items;

        const reportData = {};

        // Kelompokkan data berdasarkan part_number dan no_dn
        records.forEach(record => {
            const partNumber = record.part_number;
            const noDn = record.no_dn;
            const qtyAmbil = parseInt(record.qty_ambil) || 0; // Pastikan qty_ambil adalah angka
            const qtyMasuk = parseInt(record.qty_masuk) || 0; // Pastikan qty_masuk adalah angka
            const lot = record.lot; // Ambil lot dari record
            const createdDate = new Date(record.created); // Ambil tanggal created
            const balance = parseInt(record.balance) || 0; // Ambil balance dari record

            if (!reportData[partNumber]) {
                reportData[partNumber] = {
                    part_number: partNumber,
                    nama_barang: record.nama_barang, // Simpan nama_barang
                    status: record.status,
                    total_qty_ambil: 0,
                    total_qty_masuk: 0,
                    rincian: {}, // Objek untuk menyimpan rincian qty_ambil dan qty_masuk berdasarkan no_dn
                    lots: new Set(), // Gunakan Set untuk menyimpan lot yang unik
                    createdDates: [], // Array untuk menyimpan tanggal created
                    last_balance:balance
                };
            }
            if (createdDate > reportData[partNumber].last_updated) {
                reportData[partNumber].last_balance = balance;
                reportData[partNumber].last_updated = createdDate;
            }
            // Tambahkan lot ke Set
            reportData[partNumber].lots.add(lot);
            reportData[partNumber].createdDates.push(createdDate); // Simpan tanggal created

            // Tambahkan qty_ambil atau qty_masuk ke total berdasarkan status
            if (record.status === 'keluar') {
                reportData[partNumber].total_qty_ambil += qtyAmbil;
                // Simpan rincian qty_ambil berdasarkan no_dn
                if (!reportData[partNumber].rincian[noDn]) {
                    reportData[partNumber].rincian[noDn] = { qtyAmbil: 0, qtyMasuk: 0 }; // Inisialisasi jika belum ada
                }
                reportData[partNumber].rincian[noDn].qtyAmbil += qtyAmbil; // Tambahkan qty_ambil ke rincian
            } else if (record.status === 'masuk') {
                reportData[partNumber].total_qty_masuk += qtyMasuk;
                // Simpan rincian qty_masuk berdasarkan no_dn
                if (!reportData[partNumber].rincian[noDn]) {
                    reportData[partNumber].rincian[noDn] = { qtyAmbil: 0, qtyMasuk: 0 }; // Inisialisasi jika belum ada
                }
                reportData[partNumber].rincian[noDn].qtyMasuk += qtyMasuk; // Tambahkan qty_masuk ke rincian
            }
        });

        // Tampilkan data di tabel
        const tbody = $('#reportTable tbody');
        tbody.empty(); // Kosongkan tabel sebelum menambahkan data baru

        let nomorUrut = (page - 1) * recordsPerPage + 1; // Hitung nomor urut

        Object.values(reportData).forEach(item => {
            const rincianList = Object.entries(item.rincian)
                .map(([noDn, { qtyAmbil, qtyMasuk }]) => {
                    if (qtyAmbil > 0) {
                        return `<li><strong>Keluar ${qtyAmbil} Pcs</strong> dari ${noDn}${qtyMasuk > 0 ? ` (Masuk: ${qtyMasuk} Pcs)` : ''}</li>`;
                    } else if (qtyMasuk > 0) {
                        return `<li> dari ${noDn} <b>(Masuk: ${qtyMasuk} Pcs)</b></li>`;
                    }
                    return '';
                })
                .filter(item => item !== '')
                .join('');

            const totalKeterangan = `${item.total_qty_ambil} total keluar <br/> ${item.total_qty_masuk} total masuk`;

            // Gabungkan lot menjadi string
            const lotList = Array.from(item.lots).join('<br/>'); // Mengubah Set menjadi array dan menggabungkannya dengan <br/>

            // Ambil tanggal terakhir dan pertama dari createdDates
            const firstDate = new Date(Math.min(...item.createdDates)); // Tanggal pertama
            const lastDate = new Date(Math.max(...item.createdDates)); // Tanggal terakhir

            // Format tanggal
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedFirstDate = firstDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            const formattedLastDate = lastDate.toLocaleDateString('id-ID', options);

            const periode = `dari ${formattedFirstDate} <br/> sampai ${formattedLastDate}`; // Format periode

            tbody.append(`
                <tr>
                    <td>${nomorUrut++}</td> <!-- Tampilkan nomor urut -->
                    <td>${item.part_number}</td>
                    <td>${item.nama_barang}</td>
                    <td>${totalKeterangan}</td>
                    <td><ul>${rincianList}</ul></td>
                   <td>${item.last_balance}</td> <!-- Tambahkan balance terakhir -->
                    
                    <td>${lotList}</td> <!-- Tampilkan lot -->
                    <td style="font-size:12px"><i>${periode}</i></td> <!-- Tampilkan periode -->
                </tr>
            `);
        });

        updatePagination(page);

    } catch (error) {
        console.error("Failed to load report:", error);
    } finally {
        $('#loading').hide();
    }
}

function updatePagination(page) {
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    $('#currentPage').text(page);
    $('#prevPage').toggleClass('disabled', page === 1);
    $('#nextPage').toggleClass('disabled', page === totalPages);

    $('#prevPage').off('click').on('click', function() {
        if (page > 1) {
            loadReport(page - 1);
        }
    });

    $('#nextPage').off('click').on('click', function() {
        if (page < totalPages) {
            loadReport(page + 1);
        }
    });
}

document.getElementById('pdfDownload').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;

    // Sembunyikan navbar
    const navbar = document.getElementById('navbar-container');
    navbar.style.display = 'none';

    // Nonaktifkan tombol dan ubah teks
    const pdfButton = document.getElementById('pdfDownload');
    pdfButton.disabled = true; // Nonaktifkan tombol
    pdfButton.textContent = "Sedang membuat PDF kartu stok..."; // Ubah teks tombol


    // Buat instance jsPDF
    const doc = new jsPDF();

    // Ambil konten tabel
    const elementHTML = document.getElementById('reportTable');

    // Gunakan html2canvas untuk merender tabel ke dalam PDF
    html2canvas(elementHTML, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // Lebar gambar dalam mm
        const pageHeight = 295; // Tinggi halaman dalam mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        // Tambahkan gambar ke PDF
        doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Simpan PDF dengan nama file
        doc.save('kartu_stok_report.pdf');

        // Tampilkan kembali navbar setelah download
        navbar.style.display = 'block';
         pdfButton.disabled = false; // Aktifkan tombol
        pdfButton.textContent = "PDF Download"; // Kembalikan teks tombol

    }).catch(error => {
        console.error("Error generating PDF: ", error);
        // Tampilkan kembali navbar jika terjadi kesalahan
        navbar.style.display = 'block';
         pdfButton.disabled = false; // Aktifkan tombol
        pdfButton.textContent = "PDF Download"; // Kembalikan teks tombol
    });
});
authUser ();