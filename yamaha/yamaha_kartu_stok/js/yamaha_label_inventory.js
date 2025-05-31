document.addEventListener("DOMContentLoaded", function () {
    const user = localStorage.getItem("user-grafindo");
    const frmElement = document.getElementById("frm_inv");

    if (!frmElement) return; // Cek jika elemen tidak ditemukan

    if (user === "kamto@gmail.com") {
        frmElement.textContent = "FRM-INV-06";
    } else if (user === "pika@gmail.com") {
        frmElement.textContent = "FRM-DEPO-02";
    } else {
        frmElement.textContent = ""; // Default jika user tidak dikenali
    }
});
