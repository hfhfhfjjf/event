const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users");

async function getTopWinterPointsUsers() {
  console.log("🔍 Fetching Top 20 users by winterPoints...\n");

  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("❌ No users found.");
      return;
    }

    const users = [];

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();

      const winterPoints = Number(data.winterPoints || 0);

      users.push({
        uid,
        fullName: data.fullName || "N/A",
        email: data.email || "N/A",
        username: data.username || "N/A",
        winterPoints
      });
    });

    // Sort descending by winterPoints
    users.sort((a, b) => b.winterPoints - a.winterPoints);

    // Top 20 users
    const top20 = users.slice(0, 20);

    console.log("==============================================================");
    console.log("🏆 TOP 20 WINTER POINTS USERS");
    console.log("==============================================================\n");

    top20.forEach((user, index) => {
      console.log(`
#${index + 1}
UID: ${user.uid}
Name: ${user.fullName}
Username: ${user.username}
Email: ${user.email}
WinterPoints: ${user.winterPoints}
--------------------------------------------------------------
`);
    });

    console.log("==============================================================");
    console.log(`✅ Total Users Checked: ${users.length}`);
    console.log("==============================================================");

  } catch (error) {
    console.error("❌ Error fetching users:", error);
  } finally {
    process.exit(0);
  }
}

getTopWinterPointsUsers();
