import { connectToDatabase } from "../src/lib/mongodb";
import { autoEnsureAllUsersHaveWallets } from "../src/lib/wallet";

async function run() {
  console.log("Starting wallet & referral code backfill for all existing users...");
  try {
    await connectToDatabase();
    const result = await autoEnsureAllUsersHaveWallets();
    console.log(`✅ Backfill completed successfully! Backfilled ${result.backfilled} user wallets.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Backfill error:", error);
    process.exit(1);
  }
}

run();
