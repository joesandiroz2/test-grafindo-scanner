const ikutSetSelect = document.getElementById("ikut_set_select");
const ikutSetInput = document.getElementById("ikut_set_input");
const spinnerUnikSet = document.getElementById("spinner_unik_set"); // spinner khusus untuk unik set



// Fungsi ambil data unik set dari API
async function loadUnikSet() {
  if (spinnerUnikSet) spinnerUnikSet.classList.remove("d-none");

  try {
    const perPage = 100; // jangan terlalu besar, biar aman
    let page = 1;
    let allItems = [];

    // Ambil halaman pertama dulu untuk tahu totalPages
    const firstResponse = await fetch(`${pocketbaseUrl}/api/collections/yamaha_unik_nama_set/records?page=${page}&perPage=${perPage}`);
    if (!firstResponse.ok) throw new Error("Gagal ambil data dari API (halaman 1)");

    const firstData = await firstResponse.json();
    allItems = firstData.items;
    const totalPages = firstData.totalPages;

    // Ambil sisa halaman jika ada
    for (page = 2; page <= totalPages; page++) {
      const res = await fetch(`${pocketbaseUrl}/api/collections/yamaha_unik_nama_set/records?page=${page}&perPage=${perPage}`);
      if (!res.ok) throw new Error(`Gagal ambil data dari API (halaman ${page})`);

      const data = await res.json();
      allItems = allItems.concat(data.items);
    }

    // Kosongkan opsi dulu
    ikutSetSelect.innerHTML = "";

    // Tambahkan opsi baru dari semua data
    allItems.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.ikut_set;
      opt.textContent = item.ikut_set;
      ikutSetSelect.appendChild(opt);
    });

  } catch (err) {
    console.error("Gagal ambil data unik set:", err.message);
  } finally {
    if (spinnerUnikSet) spinnerUnikSet.classList.add("d-none");
  }
}


// Checkbox toggle antara input dan select
function toggleManualInput() {
  const manualChecked = document.getElementById("manualCheckbox").checked;
  const input = document.getElementById("ikut_set_input");
  const select = document.getElementById("ikut_set_select");

  if (manualChecked) {
    input.style.display = "block";
    select.style.display = "none";
    input.required = true;
    select.required = false;
  } else {
    input.style.display = "none";
    select.style.display = "block";
    input.required = false;
    select.required = true;
  }
}



// Fungsi ambil nilai ikut_set (dipakai di create/update)
function getIkutSetValue() {
  const isManual = document.getElementById("manualCheckbox").checked;
  return isManual ? ikutSetInput.value : ikutSetSelect.value;
}

// Jalankan saat halaman dimuat
document.addEventListener("DOMContentLoaded", loadUnikSet);
