const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Top 50 Users unki Rank aur UID ke sath
const rewardList = [
  { rank: 1, uid: 'ABVFJOblWiXa44pAL4tMHReCYsg1', reward: 20000 },
  { rank: 2, uid: 'TxZBFmHWbfPesQbtpcWt9OUKWm73', reward: 15000 },
  { rank: 3, uid: 'JfoS5ddJE7g6ObJzAGbaVxxZIyD3', reward: 13000 },
  { rank: 4, uid: 'gLkETJG8ECgOpfRnVSDbGBUnE9j2', reward: 10000 },
  { rank: 5, uid: 'xKFCNI8ZIwciqXCkNrnlizl9UlI2', reward: 10000 },
  { rank: 6, uid: 'ArUrBcRvkbcKpRvQ1xHTHNDXa1c2', reward: 10000 },
  { rank: 7, uid: 'C6Jei1xCJFciTtvrpS3tWcUS6Ny2', reward: 10000 },
  { rank: 8, uid: 'NVPqi1u9SEOFEHk7xYKZErlPPaQ2', reward: 10000 },
  { rank: 9, uid: 'P5vOQHCA59Z6LohzHWmT64m5E573', reward: 10000 },
  { rank: 10, uid: 'rCzhObaqykWCRqPY5PHg8XM9jBv1', reward: 10000 },
  { rank: 11, uid: 'ts0kABOBNdPtORTXoacqYKDqTi52', reward: 10000 },
  { rank: 12, uid: 'xXH8OcDtntMXaSK6UFrCuAs0t113', reward: 10000 },
  { rank: 13, uid: '90zAfiQsm0fGbT5uytJz5LPRWmg1', reward: 10000 },
  { rank: 14, uid: '9P1GKNShFcWNN6ASLW7lzRVRzTF3', reward: 10000 },
  { rank: 15, uid: 'eRk1PnBEgOho0szjDTfMsOUzaD03', reward: 10000 },
  { rank: 16, uid: 'Z1zWfTuT9beDm9Dz99CbPxQl3BK2', reward: 10000 },
  { rank: 17, uid: 'avh4aAF7YcSTYq9TzytuDmam7oi2', reward: 10000 },
  { rank: 18, uid: 'jL2Ya3f31AWmlPeENd1qOaKQVah1', reward: 10000 },
  { rank: 19, uid: 'nXg47a1Gt9N34FAs7h6VusG42oG3', reward: 10000 },
  { rank: 20, uid: '9pU2GxHOzja97cpbdab4MfOKmdN2', reward: 10000 },
  { rank: 21, uid: 'Lry0NVh9mXcG4ybxZPMmxNF1Mqi2', reward: 5000 },
  { rank: 22, uid: 'OM0lxZlzqwN1FqoWfY9LPheGYx33', reward: 5000 },
  { rank: 23, uid: 'Ft49WA5Cn4bY9h4WQhjRIF5yQon1', reward: 5000 },
  { rank: 24, uid: 'GB7REpulxpUJ6y1jNaSaIy3MDgw1', reward: 5000 },
  { rank: 25, uid: 'TRKxX7Ar7LVYsd2yOokZ1ZnyxJ62', reward: 5000 },
  { rank: 26, uid: 'v3uFuXFVDZOt6TEwL3uEcpOt6rt1', reward: 5000 },
  { rank: 27, uid: 'VnEGsDYohxg39FhVWNfQeFAtdi62', reward: 5000 },
  { rank: 28, uid: '5ARX9gs9ENP7KMACzvP3Yuu2phf2', reward: 5000 },
  { rank: 29, uid: 'CJAADiKo5rZblF6VJ2a7jemVo6F2', reward: 5000 },
  { rank: 30, uid: 'NQ7Nw0o1kHbhuIFU4rKqLz5boeh2', reward: 5000 },
  { rank: 31, uid: 'NiX2W1a4q8cNZSqKxZbi3MolbE93', reward: 5000 },
  { rank: 32, uid: 'PghrR9RASTejolRhGal7gC0FF5D2', reward: 5000 },
  { rank: 33, uid: 'UFv657QoSVYYLDHSROEtrXzJSu23', reward: 5000 },
  { rank: 34, uid: 'cnooCaoVg2aC3etTnQCbbA5HQCE2', reward: 5000 },
  { rank: 35, uid: 'ffAUMK3qbEdCRa2roYiLdXU0WpI2', reward: 5000 },
  { rank: 36, uid: 'vS8r6IVvhsYwL7XbZQWA5jrkJYg2', reward: 5000 },
  { rank: 37, uid: '9JWXuwM6F6SFAFWVNsCFzSQatKp2', reward: 5000 },
  { rank: 38, uid: 'EwHrX2FQSDWqsEI8NmuBsgMcHyN2', reward: 5000 },
  { rank: 39, uid: 'uZ9s7d0CVJNuJmEdOx4zL6OYcIZ2', reward: 5000 },
  { rank: 40, uid: 'v3PK3LpUUTPWxvo8CXUoGv5cPsd2', reward: 5000 },
  { rank: 41, uid: '70cCVdT1hlQJRCf1Lw1Kem31GjJ3', reward: 5000 },
  { rank: 42, uid: 'KBsnZLhPDnQn1qwhe8427rLKD9t1', reward: 5000 },
  { rank: 43, uid: 'BgapYp35XGavTIHowWkM2vUjT7l2', reward: 5000 },
  { rank: 44, uid: 'Rsc5sBIRJ7NiGmARg0ZAzxKDpNS2', reward: 5000 },
  { rank: 45, uid: 'UDxKznDx1CYjDmTUa41rIQ5W7Wm1', reward: 5000 },
  { rank: 46, uid: 'kGs5qAVwSBZifpbujLZcrXJhNJR2', reward: 5000 },
  { rank: 47, uid: 'voCGxtt1MZQSmrO92m0bCpbEkCl1', reward: 5000 },
  { rank: 48, uid: '4pDYM0xRbyaQtzArhHLHU6fCocV2', reward: 5000 },
  { rank: 49, uid: '53qFIviHKcOU20lIDcVwRKAlsq82', reward: 5000 },
  { rank: 50, uid: 'BEQXvlJQDEfdjp7UImnQBfT4VM23', reward: 5000 }
];

async function distributeRewards() {
  console.log("🚀 Starting reward distribution for Top 50 users...");
  
  const updates = {};
  let processedCount = 0;

  try {
    // Har user ka data bari bari fetch karenge taake current balance mile
    for (const user of rewardList) {
      const userRef = db.ref(`users/${user.uid}`);
      const snapshot = await userRef.once("value");

      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentBalance = Number(data.balance) || 0;
        const rewardAmount = user.reward;
        const newBalance = currentBalance + rewardAmount;

        // Updates object prepare kar rahe hain
        updates[`users/${user.uid}/balance`] = newBalance;
        processedCount++;

        console.log(`Rank ${user.rank} | UID: ${user.uid} | Current: ${currentBalance.toFixed(2)} | Added: +${rewardAmount} | New: ${newBalance.toFixed(2)}`);
      } else {
        console.log(`⚠️ User not found in database! Rank: ${user.rank} | UID: ${user.uid}`);
      }
    }

    if (processedCount > 0) {
      console.log("\n💾 Saving rewards to Firebase...");
      await db.ref().update(updates);
      console.log("\n==================================================");
      console.log(`✅ Success! Rewards successfully distributed to ${processedCount} users.`);
      console.log("==================================================\n");
    } else {
      console.log("❌ No users were updated.");
    }

  } catch (error) {
    console.error("❌ Error during reward distribution:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

distributeRewards();
