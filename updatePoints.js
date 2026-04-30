const admin = require("firebase-admin");

// GitHub Action run time par ye file generate karega
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
// DHYAN DEIN: Agar users root level par hain toh db.ref("/") use karo. 
// Agar kisi child node mein hain (e.g. "Users") toh db.ref("Users") likho.
const usersRef = db.ref("users"); 

async function resetWinterPoints() {
  console.log("GitHub Action: Users ka data fetch ho raha hai...");

  try {
    const snapshot = await usersRef.once("value");
    if (!snapshot.exists()) {
      console.log("Koi users nahi mile.");
      return;
    }

    const uids = [];
    snapshot.forEach((child) => {
      uids.push(child.key);
    });

    const totalUsers = uids.length;
    console.log(`Total ${totalUsers} users mile. Update start...`);

    const CHUNK_SIZE = 5000; 
    let batchUpdate = {};
    
    for (let i = 0; i < totalUsers; i++) {
      batchUpdate[`${uids[i]}/winterPoints`] = 0;

      if ((i + 1) % CHUNK_SIZE === 0 || i === totalUsers - 1) {
        await usersRef.update(batchUpdate);
        console.log(`[+] ${i + 1} / ${totalUsers} users update ho gaye...`);
        batchUpdate = {}; 
      }
    }
    console.log("✅ Sab users ke winterPoints zero ho gaye!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1); // Action fail kar dega agar error aaya
  } finally {
    process.exit(0);
  }
}

resetWinterPoints();
