const pb = new PocketBase(pocketbaseUrl);
import { searchKartuStok } from './check_kartu_stok.js';

let inputField = document.getElementById('do-input'); // Replace with your actual input field ID

export async function ScanOutStok(pb, input, dataItems) {
    const [partNumber, supplierId, qty, noLot] = input.split('|');
    console.log(partNumber);

    // Menghilangkan leading zero dari noLot
    const formattedNoLot = noLot.replace(/^0+/, '');

    // Cek apakah dataItems kosong atau null
    if (!dataItems || dataItems.length === 0) {
        // Tampilkan SweetAlert2
        Swal.fire({
            title: 'Anda belum scan DO.!',
            text: 'scan do dulu',
            icon: 'warning',
            timer: 1500,
            showConfirmButton: false
        });

        // Memutar suara
        const audio = new Audio('./suara/lu_belum_scan_do.mp3');
        audio.play();

        // Clear input field and set focus back
        inputField.value = ''; // Clear the input field
        inputField.focus(); // Set focus back to the input field
        return; // Keluar dari fungsi jika tidak ada data
    }

    // Cari item yang sesuai dari dataItems
    const item = dataItems.find(record => record.Supplier_Part_Number === partNumber);

    if (item) {

        // Ambil semua data kartu_stok berdasarkan part_number dan no_dn
        const records = await pb.collection('kartu_stok').getFullList({
            filter: `part_number="${partNumber}" && no_dn="${item.Delivery_Note_No}"`
        });

        // Hitung total qty_ambil
        const totalQtyAmbil = records.reduce((total, record) => total + parseInt(record.qty_ambil || 0), 0);

        // Bandingkan total qty_ambil dengan item.Qty_DN
        if (totalQtyAmbil + parseInt(qty) > item.Qty_DN) {
            // Tampilkan SweetAlert jika kuantiti sudah penuh
            Swal.fire({
                title: 'Kuantiti sudah penuh!',
                text: `Part number ${partNumber} sudah mencapai kuantiti maksimum.`,
                icon: 'error',
                timer: 2000,
                showConfirmButton: false
            });

            // Memutar suara
            const audio = new Audio('./suara/kuantiti_sudah_full.mp3');
            audio.play();

            // Clear input field and set focus back
            inputField.value = ''; // Clear the input field
            inputField.focus(); // Set focus back to the input field
            return; // Keluar dari fungsi jika kuantiti sudah penuh
        }


          // Ambil semua data kartu_stok berdasarkan part_number
        const recordsbalance = await pb.collection('kartu_stok').getFullList({
            filter: `part_number="${partNumber}"`,
            sort: '-created' // Mengurutkan dari yang terbaru
        });

        // Ambil data terakhir (terbaru)
        const lastRecord = recordsbalance.length > 0 ? recordsbalance[0] : null;
        const lastBalance = lastRecord ? parseInt(lastRecord.balance) || 0 : 0;

        // Hitung balance baru berdasarkan data terakhir
        let newBalance = lastBalance - parseInt(qty);


        // Buat data untuk disimpan
        const data = {
            id: Math.random().toString(36).substr(2, 6), // ID unik 6 karakter
            no_dn: item.Delivery_Note_No,
            part_number: partNumber,
            lot: formattedNoLot,
            qty_minta: item.Qty_DN,
            qty_ambil: qty,
            supplier_id: supplierId,
            plant_id: item.Plant_ID,
            plant_desc: item.Plant_Desc,
            no_po: item.PO_Number,
            gate_id: item.Gate_ID,
            dn_date: item.Delivery_Note_Date,
            status: 'keluar',
            balance:newBalance,
            nama_barang: item.Part_Number_Desc,
            jumlah_barang_do: dataItems.length // Hitung jumlah barang DO
        };

        // Simpan data ke kartu_stok
        await pb.collection('kartu_stok').create(data);

        // Tampilkan SweetAlert
        Swal.fire({
            toast:true,
            title: 'OKEH !!!!',
            text: 'Data berhasil disimpan ke kartu stok.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        const audio = new Audio('./suara/suara_ok.mp3');
        audio.play();
        
        inputField.value = ''; // Clear the input field
        inputField.focus(); // Set focus back to the input field

        // Panggil kembali searchKartuStok
        await searchKartuStok(item.Delivery_Note_No);
    } else {
        
        Swal.fire({
            title: 'Barang Tidak ada di Do ini',
            text: 'Data berhasil disimpan ke kartu stok.',
            icon: 'error',
            timer: 1500,
            showConfirmButton: false
        });

        const audio = new Audio('./suara/barang_kagak_ada_di_do_ini.mp3');
        audio.play();
        
        inputField.value = ''; // Clear the input field
        inputField.focus(); // Set focus back to the input field

        console.log('barang tidak ditemukan di data_do.');
    }
}