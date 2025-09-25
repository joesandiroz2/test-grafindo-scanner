document.addEventListener("DOMContentLoaded", function () {
  const btnPrint = document.getElementById("btnPrint");

  if (btnPrint) {
    btnPrint.addEventListener("click", function () {
      // update value input agar sinkron dengan isi terbaru
      document.querySelectorAll("#print_page input").forEach(input => {
        input.setAttribute("value", input.value);
      });

      const printContent = document.getElementById("print_page").innerHTML;
      const printWindow = window.open("", "", "width=900,height=650");

      // ambil semua <link> dan <style> dari halaman utama
      const styles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
        .map(el => el.outerHTML)
        .join("\n");

      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            ${styles} <!-- 🔹 copy semua CSS -->
            <style>
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                table th, table td {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                /* sembunyikan kolom aksi saat print */
                table th:last-child,
                table td:last-child {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  }
});
