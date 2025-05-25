let pb = new PocketBase(pocketbaseUrl);

async function loginPocketBase() {
  if (!pb.authStore.isValid) {  // Cek apakah sudah login dan session valid
    try {
      await pb.collection("users").authWithPassword(username_pocket, user_pass_pocket);
      console.log("Login PocketBase berhasil");
    } catch (err) {
      console.error("Gagal login PocketBase:", err);
      throw err;
    }
  } else {
    console.log("Sudah login, tidak perlu login ulang");
  }
}
