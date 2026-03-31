import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

const DEFAULT_TASKS = [
  { id: "daily-login", name: "Daily Login", description: "Come back every day for free guesses", rewardGuesses: 1, type: "daily" },
  { id: "streak-7", name: "7-Day Streak", description: "Login 7 days in a row for bonus guesses", rewardGuesses: 10, type: "daily" },
  { id: "follow-x", name: "Follow on X", description: "Follow @CrackTheSafe on X", rewardGuesses: 2, type: "quest" },
  { id: "join-discord", name: "Join Discord", description: "Join our Discord community", rewardGuesses: 3, type: "quest" },
  { id: "refer-friend", name: "Refer a Friend", description: "Share your referral link", rewardGuesses: 3, type: "quest" },
  { id: "hold-bluff", name: "Hold 100+ $BLUFF", description: "Verify $BLUFF tokens in your wallet", rewardGuesses: 5, type: "quest" },
  { id: "share-guess", name: "Share Your Closest Guess", description: "Post your best attempt on X", rewardGuesses: 2, type: "bonus" },
  { id: "community-10k", name: "Community Milestone: 10K Attempts", description: "Unlocks when 10,000 total guesses are made", rewardGuesses: 5, type: "bonus" },
];

async function main() {
  // Upsert tasks
  for (const task of DEFAULT_TASKS) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: task,
      create: task,
    });
  }
  console.log("Seeded 8 tasks");

  // Create initial vault
  const vaultCode = process.env.VAULT_SECRET_CODE || "7391";
  const codeHash = createHash("sha256").update(vaultCode).digest("hex");

  const existingVault = await prisma.vault.findFirst({
    where: { isCracked: false },
    orderBy: { startsAt: "desc" },
  });

  if (!existingVault) {
    await prisma.vault.create({
      data: {
        codeLength: vaultCode.length,
        codeHash,
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log("Seeded initial vault");
  } else {
    console.log("Active vault already exists, skipping");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
