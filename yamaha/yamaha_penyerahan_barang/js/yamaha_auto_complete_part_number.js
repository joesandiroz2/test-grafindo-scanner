document.addEventListener("DOMContentLoaded", () => {
  const datalist = document.getElementById("partNumberList");
  const partNumberInput = document.getElementById("part_number");
  const namaBarangInput = document.getElementById("nama_barang");

  const partNumberToNamaBarang = {};

  const fetchData = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  };

  const initAutocomplete = async () => {
    const urls = [
      pocketbaseUrl + "/api/collections/yamaha_unik_data_barang_partnumber/records",
      pocketbaseUrl + "/api/collections/yamaha_unik_part_number/records"
    ];

    const [data1, data2] = await Promise.all(urls.map(fetchData));
    const combinedData = [...data1, ...data2];

    const partNumbersAdded = new Set();
    datalist.innerHTML = "";

    combinedData.forEach(item => {
      let { part_number, nama_barang } = item;
      if (part_number) {
        const normalized = part_number.toUpperCase().replace(/\s+/g, "");
        if (!partNumbersAdded.has(normalized)) {
          partNumbersAdded.add(normalized);
          partNumberToNamaBarang[normalized] = nama_barang;

          const option = document.createElement("option");
          option.value = `${normalized} - ${nama_barang}`;
          datalist.appendChild(option);
        }
      }
    });
  };

  // Saat user pilih dari dropdown
  partNumberInput.addEventListener("input", () => {
    const rawInput = partNumberInput.value;
    const partNumber = rawInput.split(" - ")[0].toUpperCase().replace(/\s+/g, ""); // Hapus spasi, huruf besar

    partNumberInput.value = partNumber; // Overwrite input
    namaBarangInput.value = partNumberToNamaBarang[partNumber] || "";
  });

  initAutocomplete();
});
