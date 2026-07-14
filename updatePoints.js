const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://starx-network-default-rtdb.firebaseio.com"
});

const db = admin.database();
const usersRef = db.ref("users"); 

const PARTICIPANT_REWARD = 1000;
const BATCH_SIZE = 5000; // Firebase crash se bachne ke liye batch size

// Top 50 Users ki UIDs jinhe balance reward nahi dena (Sirf points reset honge inke)
const top50Uids = new Set([
  'ABVFJOblWiXa44pAL4tMHReCYsg1', 'TxZBFmHWbfPesQbtpcWt9OUKWm73', 'JfoS5ddJE7g6ObJzAGbaVxxZIyD3',
  'gLkETJG8ECgOpfRnVSDbGBUnE9j2', 'xKFCNI8ZIwciqXCkNrnlizl9UlI2', 'ArUrBcRvkbcKpRvQ1xHTHNDXa1c2',
  'C6Jei1xCJFciTtvrpS3tWcUS6Ny2', 'NVPqi1u9SEOFEHk7xYKZErlPPaQ2', 'P5vOQHCA59Z6LohzHWmT64m5E573',
  'rCzhObaqykWCRqPY5PHg8XM9jBv1', 'ts0kABOBNdPtORTXoacqYKDqTi52', 'xXH8OcDtntMXaSK6UFrCuAs0t113',
  '90zAfiQsm0fGbT5uytJz5LPRWmg1', '9P1GKNShFcWNN6ASLW7lzRVRzTF3', 'eRk1PnBEgOho0szjDTfMsOUzaD03',
  'Z1zWfTuT9beDm9Dz99CbPxQl3BK2', 'avh4aAF7YcSTYq9TzytuDmam7oi2', 'jL2Ya3f31AWmlPeENd1qOaKQVah1',
  'nXg47a1Gt9N34FAs7h6VusG42oG3', '9pU2GxHOzja97cpbdab4MfOKmdN2', 'Lry0NVh9mXcG4ybxZPMmxNF1Mqi2',
  'OM0lxZlzqwN1FqoWfY9LPheGYx33', 'Ft49WA5Cn4bY9h4WQhjRIF5yQon1', 'GB7REpulxpUJ6y1jNaSaIy3MDgw1',
  'TRKxX7Ar7LVYsd2yOokZ1ZnyxJ62', 'v3uFuXFVDZOt6TEwL3uEcpOt6rt1', 'VnEGsDYohxg39FhVWNfQeFAtdi62',
  '5ARX9gs9ENP7KMACzvP3Yuu2phf2', 'CJAADiKo5rZblF6VJ2a7jemVo6F2', 'NQ7Nw0o1kHbhuIFU4rKqLz5boeh2',
  'NiX2W1a4q8cNZSqKxZbi3MolbE93', 'PghrR9RASTejolRhGal7gC0FF5D2', 'UFv657QoSVYYLDHSROEtrXzJSu23',
  'cnooCaoVg2aC3etTnQCbbA5HQCE2', 'ffAUMK3qbEdCRa2roYiLdXU0WpI2', 'vS8r6IVvhsYwL7XbZQWA5jrkJYg2',
  '9JWXuwM6F6SFAFWVNsCFzSQatKp2', 'EwHrX2FQSDWqsEI8NmuBsgMcHyN2', 'uZ9s7d0CVJNuJmEdOx4zL6OYcIZ2',
  'v3PK3LpUUTPWxvo8CXUoGv5cPsd2', '70cCVdT1hlQJRCf1Lw1Kem31GjJ3', 'KBsnZLhPDnQn1qwhe8427rLKD9t1',
  'BgapYp35XGavTIHowWkM2vUjT7l2', 'Rsc5sBIRJ7NiGmARg0ZAzxKDpNS2', 'UDxKznDx1CYjDmTUa41rIQ5W7Wm1',
  'kGs5qAVwSBZifpbujLZcrXJhNJR2', 'voCGxtt1MZQSmrO92m0bCpbEkCl1', '4pDYM0xRbyaQtzArhHLHU6fCocV2',
  '53qFIviHKcOU20lIDcVwRKAlsq82', 'BEQXvlJQDEfdjp7UImnQBfT4VM23'
]);

async function rewardAndResetPoints() {
  console.log("🔍 Fetching users from database to process rewards and reset points...");
  
  try {
    const snapshot = await usersRef.once("value");

    if (!snapshot.exists()) {
      console.log("❌ No users found.");
      return;
    }

    const updates = {};
    let totalProcessedCount = 0;
    let rewardedCount = 0;
    let resetCount = 0;

    snapshot.forEach((child) => {
      const uid = child.key;
      const data = child.val();
      
      const winterPoints = data.winterPoints || 0;
      const currentBalance = data.balance || 0;

      // Agar user ke pass winterPoints hain (yani usne event join kiya hai)
      if (winterPoints > 0) {
        
        // 1. Agar user top 50 mein nahi hai, toh reward balance add karein
        if (!top50Uids.has(uid)) {
          updates[`${uid}/balance`] = currentBalance + PARTICIPANT_REWARD;
          rewardedCount++;
        }
        
        // 2. Sabhi event participants (including top 50) ke points reset karein
        updates[`${uid}/winterPoints`] = 0;
        resetCount++;
        
        totalProcessedCount++;
      }
    });

    console.log(`📋 Stats:`);
    console.log(`   - Users to reward with 1000 STRX: ${rewardedCount}`);
    console.log(`   - Users to reset Winter Points to 0: ${resetCount}`);
    console.log(`⏳ Commencing database updates in chunks...`);

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

      console.log(`💾 Processing Batch ${i + 1}/${totalBatches} (Operations: ${start + 1} to ${end})...`);
      await usersRef.update(batchUpdates);
    }

    console.log(`\n==================================================`);
    console.log(`✅ Success! Distributed ${PARTICIPANT_REWARD} STRX to ${rewardedCount} participants.`);
    console.log(`🧹 Successfully reset winterPoints to 0 for ${resetCount} users.`);
    console.log(`==================================================\n`);

  } catch (error) {
    console.error("❌ Error running script:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

rewardAndResetPoints();
