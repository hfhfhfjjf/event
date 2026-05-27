const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users"); // Ensure apke data ka root node 'users' hi hai

// Email username ko asterisks se mask karne ka function (agar zaroorat ho)
function maskEmail(email) {
    if (!email) return "N/A";
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    return `***@${parts[1]}`;
}

async function getTop20BalanceUsers() {
  console.log("Fetching top 20 highest balance users...");
  
  try {
    // Firebase se sirf top 20 highest balance wale users fetch karein
    const snapshot = await usersRef
        .orderByChild("balance")
        .limitToLast(20)
        .once("value");

    if (!snapshot.exists()) {
      console.log("Koi users nahi mile.");
      return;
    }

    const topUsers = [];
    
    snapshot.forEach((child) => {
      const data = child.val();
      topUsers.push({
        uid: child.key,
        balance: data.balance || 0,
        email: data.email || "N/A",
        maskedEmail: maskEmail(data.email),
        fullName: data.fullName || "N/A",      // Image se map kiya gaya
        username: data.username || "N/A"       // Image se map kiya gaya
      });
    });

    // Firebase data ko ascending order mein deta hai, isliye descending ke liye reverse karna zaroori hai
    topUsers.reverse();

    console.log("\n=====================================================================================================");
    console.log("🏆 TOP 20 HIGHEST BALANCE USERS 🏆");
    console.log("=====================================================================================================\n");

    topUsers.forEach((user, index) => {
      const formattedBalance = Number(user.balance).toFixed(2);
      
      // Output ko beautifully align karne ke liye padEnd ka use kiya gaya hai
      console.log(
        `#${String(index + 1).padEnd(2)} | ` +
        `Balance: ${formattedBalance.padEnd(8)} | ` +
        `Name: ${user.fullName.padEnd(15)} | ` +
        `Username: ${user.username.padEnd(12)} | ` +
        `Email: ${user.email.padEnd(30)} | ` +
        `UID: ${user.uid}`
      );
    });

    console.log("\n✅ Data successfully fetched!");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

getTop20BalanceUsers();
