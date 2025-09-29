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
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
            <style>
              /* 🔹 copy CSS custom kamu di sini */
              #list_anak_do .nav-tabs .nav-link {
                background-color: #f8f9fa;
                color: #333;
                font-weight: normal;
                border: 1px solid #dee2e6;
                margin-right: 2px;
                transition: all 0.2s ease-in-out;
              }
              #list_anak_do .nav-tabs .nav-link:hover {
                background-color: #e9f5ff;
                color: #007bff;
                font-weight: bold;
              }
              #list_anak_do .nav-tabs .nav-link.active {
                background-color: #007bff;
                color: white;
                font-weight: bold;
                border-color: #007bff #007bff #fff;
              }
              .gold-badge {
                display: inline-block;
                font-size: 1rem;
                font-weight: bold;
                padding: 0.3rem 0.8rem;
                border-radius: 0.25rem;
                color: #fff;
                background: linear-gradient(90deg, #d4af37, #fffacd, #d4af37);
                background-size: 200% auto;
                animation: gold-shimmer 2s linear infinite;
                text-shadow: 0 0 5px #ffd700;
              }

              @media print {
                @page {
                  size: auto;
                  margin: 5mm;
                }
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
