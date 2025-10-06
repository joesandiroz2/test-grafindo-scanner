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
      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            <style>
              @media print {
                @page {
                  size: auto;
                  margin: 5mm;
                }
                body {
                  font-family: "Tahoma", "Verdana", sans-serif;
                  font-size: 12px; 
                }
                table th, table td {
                  font-weight: bold;
                  font-family: Consolas, monospace;
                  font-size: 12px;
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

      // ✅ Tunggu semua gambar/konten di window print selesai load
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    });
  }
});
