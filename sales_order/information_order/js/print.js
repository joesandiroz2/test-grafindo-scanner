document.addEventListener("DOMContentLoaded", function () {
  const btnPrint = document.getElementById("btnPrint");

  if (btnPrint) {
    btnPrint.addEventListener("click", function () {
      const printContent = document.getElementById("print_page").innerHTML;

      const printWindow = window.open("", "", "width=900,height=650");
      printWindow.document.write(`
        <html>
          <head>
            <title>Print</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
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
