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
        for (const record of records) {
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
                    last_balance:balance,
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
        };

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
                    <td style="font-weight:bold">${item.part_number}</td>
                    <td style="font-weight:bold">${item.nama_barang}</td>
                    <td><ul>${rincianList}</ul></td>
                   <td style="font-weight: bold; color: ${item.last_balance < 0 ? 'red' : 'inherit'};">
                        ${item.last_balance}
                    </td>
                    <td>${lotList}</td> <!-- Tampilkan lot -->
                    <td style="font-size:12px"><i>${periode}</i></td> <!-- Tampilkan periode -->
                    <td>
                        <button class="btn btn-info dari-stok-awal" data-partnumber="${item.part_number}">Dari Stok Awal</button>
                    </td>
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

$(document).on("click", ".dari-stok-awal", async function () {
      const $button = $(this); // Simpan referensi ke tombol
    const originalText = $button.text(); // Simpan teks asli tombol
    $button.addClass("disabled").text("Sedang Mengambil..."); // Ubah ke mode loading


    const partNumber = $(this).data("partnumber"); // Ambil part_number dari tombol
    const pb = new PocketBase(pocketbaseUrl);

    try {
        // Ambil semua data berdasarkan part_number
        const response = await pb.collection('kartu_stok').getFullList({
            filter: `part_number="${partNumber}"`,
        });

        if (response.length === 0) {
            Swal.fire("Info", "Data tidak ditemukan!", "warning");
            return;
        }

        // **Urutkan berdasarkan tanggal transaksi (`tgl_pb`)**
        response.sort((a, b) => new Date(a.tgl_pb) - new Date(b.tgl_pb));

        // **Menghitung balance berdasarkan transaksi**
        let currentBalance = 0;
        const groupedData = response.reduce((acc, record) => {
            const key = record.no_dn;

            if (!acc[key]) {
                acc[key] = {
                    no_dn: record.no_dn,
                    qty_minta: parseInt(record.qty_minta) || 0,
                    qty_ambil: 0,
                    qty_masuk: 0,
                    balance: 0,
                    tgl_pb: record.tgl_pb,
                    status: record.status, // Tambahkan status
                    lot: record.lot || "-", // Tambahkan lot
                    created: record.created, // Ambil created
                };
            }

            // **Ambil created terbaru**
            if (new Date(record.created) > new Date(acc[key].created)) {
                acc[key].created = record.created;
            }

            // **Mengupdate qty masuk dan keluar**
            if (record.status === "keluar") {
                acc[key].qty_ambil += parseInt(record.qty_ambil) || 0;
                currentBalance -= parseInt(record.qty_ambil) || 0;
            } else if (record.status === "masuk") {
                acc[key].qty_masuk += parseInt(record.qty_masuk) || 0;
                currentBalance += parseInt(record.qty_masuk) || 0;
            }

            // **Simpan balance terbaru**
            acc[key].balance = currentBalance;
            acc[key].tgl_pb = record.tgl_pb;

            return acc;
        }, {});

        // **Fungsi format tanggal (contoh: "22 Mei 2025")**
        function formatTanggal(dateStr) {
            const bulanIndo = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];
            let date = new Date(dateStr);
            let day = date.getDate();
            let month = bulanIndo[date.getMonth()];
            let year = date.getFullYear();
            return `${day} ${month} ${year}`;
        }

        // **Format data untuk ditampilkan sesuai status**
        let stokDetails = Object.values(groupedData).map(record => {
            let qty_display = record.status === "keluar" ? record.qty_ambil : record.qty_masuk;
            let formattedDate = formatTanggal(record.created);

            // **Style balance merah jika negatif**
            let balanceStyle = record.balance < 0 ? 'style="color:red; background-color:white;padding:3px;font-weight:bold;"' : 'style="font-weight:bold;"';

            return `
                <tr>
                    <td>
                        <p> Dari <b>${record.no_dn}</b> 
                        ${record.status} <b>${qty_display} Pcs </b> tgl
                        <i>${formattedDate}</i>
                        </p>
                    </td>
                    <td><i>${record.lot}</i></td>
                    <td ${balanceStyle}>${record.balance}</td>
                </tr>
            `;
        }).join("");

        // **Tambahkan hasil ke baris setelah tombol diklik**
        $(this).closest("tr").after(`
            <tr style="background-color:#bdbdbd">
                <td colspan="9">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Rincian Awal ${partNumber}</th>
                                <th>Lot</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>${stokDetails}</tbody>
                    </table>
                </td>
            </tr>
        `);
    } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire("Error", "Gagal mengambil data", "error");
    }finally {
        // Kembalikan tombol ke kondisi semula setelah proses selesai
        $button.removeClass("disabled").text(originalText);
    }
});



// berdasarkan tgl kartu stok rincian
$(document).ready(function () {
    $(document).on("click", ".btn-primary", function () {
        $("#modalFilterTanggal").modal("show");
    });


});


