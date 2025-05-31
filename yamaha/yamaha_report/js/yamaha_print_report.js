document.addEventListener("DOMContentLoaded", function () {
  const btnPrint = document.getElementById("btn-print-pdf");

  btnPrint.addEventListener("click", function () {
    // Sembunyikan elemen tertentu
    const toHide = ['navbar-container', 'cariviewdo', 'printbtnview', 'btn-print-pdf'];
    toHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Lanjutkan print PDF
    const element = document.body;
    const opt = {
      margin:       0,
      filename:     'report_yamaha.pdf',
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Tampilkan kembali elemen setelah selesai export
      toHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = '';
      });
         Swal.fire({
        icon: 'success',
        title: 'Export PDF Berhasil',
        showConfirmButton: false,
        timer: 1200
      });
    });
  });
});
