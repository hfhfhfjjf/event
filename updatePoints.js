const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const auth = admin.auth(); 
const usersRef = db.ref("users");

// Jin UIDs ko cherna NAHI hai unki list yahan add kardi gayi hai
const whitelistedUIDs = [
  "AWZS8wp5mBQcDCZHIKFansfQxev2", // Crypto Fork
  "3SNfX9MXyWUUTsq4jEBb3MraY4a2", // Akash
  "o5a3X22anVW0hayzBb306ueW5M62", // Dr Altcoin
  "HQcKCgPwdJTqIDjOks0BBfuexwj1", // kelly satiro
  "BijEYBvvoqe9P2noAvuiC40xoc23", // Polakatla Vijay
  "8Dygg4NhioayPBM6xztmsnrKtUg2", // Phạm Ngọc Của
  "TG1IPPj53SV2A4Ett2mR5f6Wa4H2", // Dhunaka Rajendra
  "7RQwg3vKbxfkry7jZdtrHcsTvZw1", // ayomide Emmanuel
  "HAt49Q5ePwfAtnrIoATjFy7RyQ72", // ziriansah
  "E9NiJ6jCUmY9QopyGmyKoiqOCxy1", // Simon Galo
  "oYDI0bVu4QVwRThzUaHdd9XH4jq2", // Kim Hung Wong
  "e7N1Z8fJffYzHJNIdvGjfxgQbZf1", // Muhammad Aliyu
  "kiZexMOTz2Nx0VCbudRaSNDTk5L2", // fabricio lima
  "txOXkUFmb2bVPadwTusJxWUzrqH3", // NZABONIMPA Vital
  "lZvXuneHgIfUj3umiuGg3kZG4YQ2", // Blockchainsage
  "AHNlGIgakoNX29RXmbtxmN0qbom2", // Mudassar Ishtiaq
  "3O51W0SsmkSOvOwYRFfEpqM14Hv1"  // AISSAN Rodrigue
];

async function disableHighBalanceUsers() {
  console.log("Scanning database for users with balance > 100000 (excluding whitelisted)...\n");
  
  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("Koi users nahi mile database main.");
      return;
    }

    const targetUsers = [];
    
    // Scan and filter users
    snapshot.forEach((child) => {
      const data = child.val();
      const uid = child.key;
      
      // Explicitly raw balance ko float main parse karna
      const balance = parseFloat(data.balance) || 0;
      
      // Agar balance 100000 se zyada hai AUR UID whitelist main nahi hai
      if (balance > 100000 && !whitelistedUIDs.includes(uid)) {
        targetUsers.push({
          uid: uid,
          name: data.fullName || "N/A",
          email: data.email || "N/A", 
          balance: balance
        });
      }
    });

    if (targetUsers.length === 0) {
      console.log("✅ Koi aesa account nahi mila jiska balance > 100000 ho aur wo whitelist na ho.");
      process.exit(0);
    }

    console.log(`🚨 Total ${targetUsers.length} accounts found to disable! Processing... \n`);

    const processedUsers = [];

    for (const user of targetUsers) {
      try {
        // Sirf account disable karna hai (Database data safe rahega)
        await auth.updateUser(user.uid, { disabled: true });
        
        processedUsers.push(user);
        console.log(`✅ Disabled -> ${user.name} (Email: ${user.email} | UID: ${user.uid})`);
        
      } catch (err) {
        console.error(`❌ Error disabling UID ${user.uid}:`, err.message);
      }
    }

    // Final Report Print Karna
    console.log("\n===================================================================================================================================");
    console.log(`🛑 ACTION REPORT: Total ${processedUsers.length} Accounts Disabled (Data kept safe)`);
    console.log("===================================================================================================================================\n");

    // Highest balance walo ko upar rakhne ke liye sort
    processedUsers.sort((a, b) => b.balance - a.balance);

    processedUsers.forEach((user, index) => {
      // Raw decimal balance show karne ke liye
      const exactBalance = String(user.balance);
      const shortName = user.name.length > 15 ? user.name.substring(0, 15) + ".." : user.name;
      
      console.log(
        `#${String(index + 1).padEnd(2)} | ` +
        `Balance: ${exactBalance.padEnd(18)} | ` + 
        `Name: ${shortName.padEnd(15)} | ` +
        `Email: ${user.email.padEnd(35)} | ` + 
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

disableHighBalanceUsers();
