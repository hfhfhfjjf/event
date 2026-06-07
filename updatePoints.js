const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users"); 

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PENALTY_AMOUNT = 500;

async function applySlashingMechanism() {
  console.log("🔍 Checking for inactive miners to apply slashing...");
  
  try {
    const currentTime = Date.now(); 
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    const updates = {};
    let slashedUsersCount = 0;
    let totalSlashedAmount = 0; // Total slashed STRX track karne ke liye

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();
      
      const balance = data.balance || 0;
      
      const miningData = data.mining || {};
      const lastUpdate = miningData.lastUpdate || 0;

      if (lastUpdate > 0) {
        const timeDifference = currentTime - lastUpdate;

        if (timeDifference > ONE_WEEK_MS) {
          
          const newBalance = Math.max(0, balance - PENALTY_AMOUNT); 
          
          // Actual deducted amount calculate kar rahe hain (agar balance 100 se kam tha toh utna hi deduct hoga)
          const actualDeducted = balance - newBalance; 
          
          if (actualDeducted > 0) {
              updates[`${uid}/balance`] = newBalance;
              slashedUsersCount++;
              totalSlashedAmount += actualDeducted; // Total mein add kar rahe hain

              console.log(`⚠️ Slashing -> UID: ${uid} | Old Balance: ${Number(balance).toFixed(2)} | New Balance: ${Number(newBalance).toFixed(2)} | Deducted: ${actualDeducted.toFixed(2)}`);
          }
        }
      }
    });

    if (slashedUsersCount > 0) {
      console.log("\n⏳ Updating database...");
      await usersRef.update(updates); 
      
      console.log("\n==================================================");
      console.log(`✅ Slashing successfully applied to ${slashedUsersCount} users!`);
      console.log(`🔥 Total STRX Slashed: ${totalSlashedAmount.toFixed(2)} STRX`);
      console.log("==================================================\n");
    } else {
      console.log("\n✅ Koi bhi user 1 week se zyada inactive nahi hai. No slashing needed.");
    }

  } catch (error) {
    console.error("❌ Error applying slashing:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

applySlashingMechanism();
