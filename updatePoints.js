const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users"); 

async function resetAllWinterPoints() {
  console.log("🔍 Database se users ka data read kiya ja raha hai...");
  
  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("❌ Koi users nahi mile.");
      return;
    }

    const updates = {};
    let usersToUpdate = 0;

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();
      
      // Sirf un users ko target karein jinke paas winterPoints hain aur wo 0 se zyada hain
      if (data.winterPoints && data.winterPoints > 0) {
        // Bulk update ke liye object tayar kar rahe hain
        updates[`${uid}/winterPoints`] = 0;
        usersToUpdate++;
      }
    });

    if (usersToUpdate === 0) {
      console.log("✅ Sab users ke winterPoints pehle se hi 0 hain. Koi update nahi kiya gaya.");
    } else {
      console.log(`⏳ ${usersToUpdate} users ke winterPoints 0 kiye ja rahe hain...`);
      
      // Firebase mein ek sath sab data update karna (Fast and efficient)
      await usersRef.update(updates);
      
      console.log(`🎉 Successfully ${usersToUpdate} users ke winterPoints 0 kar diye gaye hain!`);
    }

  } catch (error) {
    console.error("❌ Error updating data:", error);
    process.exit(1); 
  } finally {
    process.exit(0);
  }
}

resetAllWinterPoints();
