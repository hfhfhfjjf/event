const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users"); 

const ADDED_POINTS = 7 * 200; // 1400 Points per user
const MAX_POINTS_LIMIT = 52500; // Leaderboard display limit

async function addPointsAndGetTop50() {
  console.log(`⏳ Har user ke winterPoints mein ${ADDED_POINTS} points add kiye ja rahe hain...`);
  
  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    const updates = {};
    const winterUsers = [];
    let updatedUsersCount = 0;

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();
      
      const email = data.email || "No Email";
      const currentWinterPoints = data.winterPoints || 0;

      // 1. Naye points calculate karna aur database update map mein dalna
      const newWinterPoints = currentWinterPoints + ADDED_POINTS;
      updates[`${uid}/winterPoints`] = newWinterPoints;
      updatedUsersCount++;

      // 2. Local array mein naye points ke sath push karna leaderboard check ke liye
      // (Sirf wahi users filter honge jinke naye points 52,500 ya usse kam hain)
      if (newWinterPoints <= MAX_POINTS_LIMIT) {
        winterUsers.push({
          uid: uid,
          email: email,
          winterPoints: newWinterPoints
        });
      }
    });

    // Database mein points update apply karna
    if (updatedUsersCount > 0) {
      console.log(`💾 Database update kiya ja raha hai (${updatedUsersCount} users ke points add ho rahe hain)...`);
      await usersRef.update(updates);
      console.log(`✅ Success! Har user ke winterPoints mein ${ADDED_POINTS} points add ho gaye hain.\n`);
    }

    // 3. Top 50 Users Sort aur Display karna (Maximum 52,500 Limit)
    console.log(`🏆 Fetching Top 50 Users based on Winter Points (Limit: <= ${MAX_POINTS_LIMIT})...`);
    
    // Descending order mein sort karein (Sabse zyada points upar)
    winterUsers.sort((a, b) => b.winterPoints - a.winterPoints);

    // Top 50 users slice karein
    const top50 = winterUsers.slice(0, 50);

    if (top50.length > 0) {
      console.log("\n=================================================================================");
      console.log(`❄️  TOP 50 WINTER POINTS LEADERBOARD (Limit: <= 52,500 Points) ❄️`);
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
      console.log(`❌ 52,500 ya usse kam points wala koi user nahi mila.`);
    }

  } catch (error) {
    console.error("❌ Error running script:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

addPointsAndGetTop50();
