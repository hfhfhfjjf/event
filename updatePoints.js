const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users");

// Email username ko asterisks se mask karne ka function
function maskEmail(email) {
    if (!email) return "N/A";
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    return `***@${parts[1]}`;
}

async function getTop20WinterPointsUsers() {
  console.log("GitHub Action: Top 20 Fortune Fest winners fetch ho rahe hain...");
  
  try {
    // Firebase se sirf top 20 highest winterPoints wale users fetch karein
    const snapshot = await usersRef
        .orderByChild("winterPoints")
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
        winterPoints: data.winterPoints || 0,
        email: maskEmail(data.email)
      });
    });

    // Firebase data ko ascending (chote se bada) order mein return karta hai.
    // Highest points top par dikhane ke liye array ko reverse karna zaroori hai.
    topUsers.reverse();

    console.log("\n==================================================");
    console.log("🏆 TOP 20 FORTUNE FEST (WINTER POINTS) WINNERS 🏆");
    console.log("==================================================\n");

    topUsers.forEach((user, index) => {
      console.log(`#${index + 1} | Points: ${user.winterPoints.toString().padEnd(8)} | Email: ${user.email.padEnd(20)} | UID: ${user.uid}`);
    });

    console.log("\n✅ Data successfully fetched!");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

getTop20WinterPointsUsers();
