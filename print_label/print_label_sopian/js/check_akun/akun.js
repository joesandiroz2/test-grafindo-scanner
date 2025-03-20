
// Function to show login prompt
async function showLoginPrompt() {
const { value: formValues } = await Swal.fire({
    title: 'Login Untuk Buat Label',
    html: `
        <input type="email" id="email" class="swal2-input" placeholder="Email">
        <input type="password" id="password" class="swal2-input" placeholder="Password">
    `,
    focusConfirm: false,
        allowOutsideClick: false, // Prevent closing by clicking outside
        allowEscapeKey: false, // Prevent closing by pressing the escape key
     
    preConfirm: () => {
        return {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        }
    }
});

if (formValues) {
    try {
        // Authenticate user
        const authData = await pb.collection('users').authWithPassword(formValues.email, formValues.password);
        localStorage.setItem('operator_label', authData.record.email); // Store email in localStorage
        Swal.fire('Login Berhasil!', 'Anda berhasil masuk.', 'success');
        window.location.href = "/print_label/print_label_sopian/index.html"
        displayOperatorLabel()
        // Show the main content
        document.getElementById('inputlabelmain').style.display = 'block'; // Show the div after successful login
    } catch (error) {
        // Display specific error message
        Swal.fire('Login Gagal', 'User  atau password salah.', 'error');
        // Optionally, you can call showLoginPrompt() again here if you want to allow retry
        showLoginPrompt(); // Show login prompt again
    }
}
}


// Function to display operator label from localStorage
function displayOperatorLabel() {
    const operatorLabel = localStorage.getItem('operator_label');
    if (operatorLabel) {
        document.getElementById('operator_label').innerText = `Operator Label: ${operatorLabel}`;
    } else {
        document.getElementById('operator_label').innerText = 'Operator: Tidak ada data';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('operator_label'); // Clear the operator_label from localStorage
    document.getElementById('inputlabelmain').style.display = 'none'; // Hide the main content
    showLoginPrompt(); // Show login prompt again
}
// Check if user is already logged in
document.addEventListener("DOMContentLoaded", async () => {
const operatorLabel = localStorage.getItem('operator_label');
if (operatorLabel) {
    // User is already logged in, show the main content
    document.getElementById('inputlabelmain').style.display = 'block';
    displayOperatorLabel()
} else {
    // Show login prompt
    showLoginPrompt();
}
});

 document.getElementById('logoutButton').addEventListener('click', logout);