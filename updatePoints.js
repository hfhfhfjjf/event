const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users"); 

async function getTopWinterUsersUnder55K() {
  console.log("🔍 Database se users ka data read kiya ja raha hai (Max Limit: 55,000 Points)...");
  
  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    const winterUsers = [];
    const MAX_POINTS_LIMIT = 55000; // Limit set ki hai

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();
      
      const email = data.email || "No Email";
      const winterPoints = data.winterPoints || 0;

      // Sirf un users ko add karein jinke points 0 se zyada hain AUR 55,000 ya usse kam hain
      if (winterPoints > 0 && winterPoints <= MAX_POINTS_LIMIT) {
        winterUsers.push({
          uid: uid,
          email: email,
          winterPoints: winterPoints
        });
      }
    });

    // Top 50 Users Sort aur Display karna
    console.log(`🏆 Fetching Top 50 Users based on Winter Points (Limit: <= ${MAX_POINTS_LIMIT})...`);
    
    // Descending order mein sort karein (Sabse zyada points upar)
    winterUsers.sort((a, b) => b.winterPoints - a.winterPoints);

    // Top 50 users cut karein
    const top50 = winterUsers.slice(0, 50);

    if (top50.length > 0) {
      console.log("\n=================================================================================");
      console.log(`❄️  TOP 50 WINTER POINTS LEADERBOARD (<= 55,000 Points) ❄️`);
      console.log("=================================================================================");
      console.table(
        top50.map((user, index) => ({
          Rank: index + 1,
          UID: user.uid,
          Email: user.email,
          "Winter Points": user.winterPoints
        }))
      );
      console.log("=================================================================================\n");
    } else {
      console.log("❌ 55K ya usse kam points wala koi user nahi mila.");
    }

  } catch (error) {
    console.error("❌ Error fetching data:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

getTopWinterUsersUnder55K();
