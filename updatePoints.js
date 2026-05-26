const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const auth = admin.auth(); // Firebase Auth initialize kiya user disable karne ke liye
const usersRef = db.ref("users");

async function cleanupSpamUsers() {
  console.log("Scannning database for @guerrillamailblock.com accounts...\n");
  
  try {
    // Database se sab users fetch karein
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("Koi users nahi mile database main.");
      return;
    }

    const spamUsers = [];
    
    // Check every user for the target email domain
    snapshot.forEach((child) => {
      const data = child.val();
      const email = data.email ? data.email.toLowerCase() : "";
      
      if (email.endsWith("@guerrillamailblock.com")) {
        spamUsers.push({
          uid: child.key,
          email: data.email,
          balance: data.balance || 0
        });
      }
    });

    if (spamUsers.length === 0) {
      console.log("✅ Koi @guerrillamailblock.com wala account nahi mila. Database safe hai.");
      process.exit(0);
    }

    console.log(`🚨 Total ${spamUsers.length} spam accounts found! Processing... \n`);

    const processedUsers = [];

    // Har spam user ko disable aur delete karna
    for (const user of spamUsers) {
      try {
        // 1. Firebase Auth se disable karna
        await auth.updateUser(user.uid, { disabled: true });
        
        // 2. Realtime Database se data delete karna
        await usersRef.child(user.uid).remove();
        
        processedUsers.push(user);
        console.log(`✅ Success: Disabled & Deleted -> ${user.email} (UID: ${user.uid})`);
      } catch (err) {
        console.error(`❌ Error with ${user.email} (UID: ${user.uid}):`, err.message);
        // Agar Auth main user nahi milta par DB main hai, toh bhi DB se delete kar sakte hain
        if (err.code === 'auth/user-not-found') {
             console.log(`⚠️ User not in Auth. Deleting from DB anyway...`);
             await usersRef.child(user.uid).remove();
             processedUsers.push(user);
        }
      }
    }

    // Last main complete details print karna
    console.log("\n===============================================================================================");
    console.log(`🗑️  CLEANUP REPORT: Total ${processedUsers.length} Accounts Disabled & Deleted`);
    console.log("===============================================================================================\n");

    processedUsers.forEach((user, index) => {
      const formattedBalance = Number(user.balance).toFixed(2);
      
      console.log(
        `#${String(index + 1).padEnd(2)} | ` +
        `Balance: ${formattedBalance.padEnd(8)} | ` +
        `Email: ${user.email.padEnd(35)} | ` +
        `UID: ${user.uid}`
      );
    });

    console.log("\n✅ Action completed successfully!");

  } catch (error) {
    console.error("❌ Fatal Error:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

cleanupSpamUsers();
