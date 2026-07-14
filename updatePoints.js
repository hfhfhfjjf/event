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
const BATCH_SIZE = 5000; // Ek baar mein 5000 users update honge

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
    let totalUsersCount = 0;

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();
      
      const email = data.email || "No Email";
      const currentWinterPoints = data.winterPoints || 0;

      // Naye points calculate karna
      const newWinterPoints = currentWinterPoints + ADDED_POINTS;
      
      // Updates object mein path aur value set karna
      updates[`${uid}/winterPoints`] = newWinterPoints;
      totalUsersCount++;

      // Local array mein filter ke sath push karna leaderboard ke liye
      if (newWinterPoints <= MAX_POINTS_LIMIT) {
        winterUsers.push({
          uid: uid,
          email: email,
          winterPoints: newWinterPoints
        });
      }
    });

    console.log(`📋 Total ${totalUsersCount} users mile. Chunks mein update start ho raha hai...`);

    // 1. Chunks/Batches mein Database update apply karna
    const updateKeys = Object.keys(updates);
    const totalBatches = Math.ceil(updateKeys.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const batchUpdates = {};
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, updateKeys.length);

      for (let j = start; j < end; j++) {
        const key = updateKeys[j];
        batchUpdates[key] = updates[key];
      }

      console.log(`💾 Updating Batch ${i + 1}/${totalBatches} (Users: ${start + 1} to ${end})...`);
      await usersRef.update(batchUpdates);
    }

    console.log(`\n✅ Success! Sabhi ${totalUsersCount} users ke winterPoints mein ${ADDED_POINTS} points add ho gaye hain.\n`);

    // 2. Top 50 Users Sort aur Display karna
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
