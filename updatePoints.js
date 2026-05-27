const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const auth = admin.auth(); 
const usersRef = db.ref("users");

// Regex to detect Japanese, Korean, or Chinese characters
const asianCharRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;

// Function to check bot pattern
function isBotPattern(data) {
  const name = data.fullName || "";
  const balance = Number(data.balance) || 0;
  
  // Condition 1: Name main Asian characters hain
  const hasAsianChars = asianCharRegex.test(name);
  
  // Condition 2: Balance bohat zyada hai (aap isko adjust kar sakte hain)
  const isHighBalance = balance > 100000; 

  return hasAsianChars && isHighBalance;
}

async function banBotAccounts() {
  console.log("Scanning database for bot patterns (Asian names + High Balance)...\n");
  
  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("Koi users nahi mile.");
      return;
    }

    const botUsers = [];
    
    // Database scan karke bot pattern wale users filter out karna
    snapshot.forEach((child) => {
      const data = child.val();
      
      if (isBotPattern(data)) {
        botUsers.push({
          uid: child.key,
          name: data.fullName || "N/A",
          balance: data.balance || 0
        });
      }
    });

    if (botUsers.length === 0) {
      console.log("✅ Koi bot pattern wala account nahi mila.");
      process.exit(0);
    }

    console.log(`🚨 Total ${botUsers.length} suspicious accounts found! Processing... \n`);

    const processedUsers = [];

    for (const user of botUsers) {
      let creationTime = "Unknown";
      
      try {
        // 1. Firebase Auth se user ki details fetch karna (Creation Date ke liye)
        const userRecord = await auth.getUser(user.uid);
        
        // Format the creation date nicely
        const dateObj = new Date(userRecord.metadata.creationTime);
        creationTime = dateObj.toISOString().split('T')[0]; // "YYYY-MM-DD" format

        // 2. Auth se disable karna
        await auth.updateUser(user.uid, { disabled: true });
        
        // 3. Realtime Database se data delete karna
        await usersRef.child(user.uid).remove();
        
        processedUsers.push({ ...user, creationTime });
        console.log(`✅ Banned & Deleted -> ${user.name} (UID: ${user.uid})`);
        
      } catch (err) {
        console.error(`❌ Error with UID ${user.uid}:`, err.message);
        
        // Agar user Auth main nahi hai but DB main hai, tab bhi DB se delete kar dain
        if (err.code === 'auth/user-not-found') {
             console.log(`⚠️ User not in Auth. Deleting from DB anyway...`);
             await usersRef.child(user.uid).remove();
             processedUsers.push({ ...user, creationTime: "Not in Auth" });
        }
      }
    }

    // Final Report Print Karna
    console.log("\n==========================================================================================================");
    console.log(`🗑️  BOT CLEANUP REPORT: Total ${processedUsers.length} Accounts Banned & Deleted`);
    console.log("==========================================================================================================\n");

    processedUsers.forEach((user, index) => {
      const formattedBalance = Number(user.balance).toFixed(2);
      // Ensure name truncation agar bohot lamba ho to layout kharab na ho
      const shortName = user.name.length > 15 ? user.name.substring(0, 15) + ".." : user.name;
      
      console.log(
        `#${String(index + 1).padEnd(2)} | ` +
        `Balance: ${formattedBalance.padEnd(10)} | ` +
        `Name: ${shortName.padEnd(15)} | ` +
        `Created: ${user.creationTime.padEnd(12)} | ` +
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

banBotAccounts();
