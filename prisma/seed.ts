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
  { id: "join-telegram", name: "Join Telegram", description: "Join our Telegram channel", rewardGuesses: 5, type: "quest" },
  { id: "partner-offer", name: "Partner Offer", description: "Complete a partner offer to earn bonus guesses", rewardGuesses: 10, type: "quest" },
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
  console.log("Seeded", DEFAULT_TASKS.length, "tasks");

  // Create initial vault
  const vaultCode = process.env.VAULT_SECRET_CODE || "739142";
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

  // Seed quiz questions
  const QUIZ_QUESTIONS = [
    { question: "What does 'HODL' mean in crypto?", options: JSON.stringify(["Hold On for Dear Life", "High Order Digital Ledger", "Hash Of Decentralized Liquidity", "Hype Over Distributed Leverage"]), correctIndex: 0, difficulty: "easy", category: "crypto" },
    { question: "Which blockchain does $BLUFF run on?", options: JSON.stringify(["Ethereum", "Solana", "Base", "Polygon"]), correctIndex: 2, difficulty: "easy", category: "crypto" },
    { question: "What is the maximum supply of Bitcoin?", options: JSON.stringify(["100 million", "21 million", "1 billion", "10 million"]), correctIndex: 1, difficulty: "easy", category: "crypto" },
    { question: "What does ERC-20 stand for?", options: JSON.stringify(["Ethereum Request for Comment 20", "Encrypted Relay Chain 20", "Extended Resource Contract 20", "Ethereum Registry Code 20"]), correctIndex: 0, difficulty: "medium", category: "crypto" },
    { question: "What is a 'gas fee' in Ethereum?", options: JSON.stringify(["Cost of electricity", "Transaction processing fee", "Mining reward", "Token burn rate"]), correctIndex: 1, difficulty: "easy", category: "crypto" },
    { question: "What is 2^10?", options: JSON.stringify(["256", "512", "1024", "2048"]), correctIndex: 2, difficulty: "easy", category: "math" },
    { question: "What is the probability of guessing a 6-digit code on the first try?", options: JSON.stringify(["1 in 100,000", "1 in 1,000,000", "1 in 10,000", "1 in 999,999"]), correctIndex: 1, difficulty: "medium", category: "math" },
    { question: "If you have 3 correct digits in wrong positions, what feedback do you get?", options: JSON.stringify(["Hot", "Cold", "Warm", "Cracked"]), correctIndex: 2, difficulty: "easy", category: "general" },
    { question: "What is SHA-256 used for?", options: JSON.stringify(["Encryption", "Hashing", "Compression", "Authentication"]), correctIndex: 1, difficulty: "medium", category: "crypto" },
    { question: "What year was Bitcoin created?", options: JSON.stringify(["2007", "2008", "2009", "2010"]), correctIndex: 2, difficulty: "medium", category: "crypto" },
    { question: "What is a smart contract?", options: JSON.stringify(["A legal document", "Self-executing code on blockchain", "A hardware wallet", "An exchange order"]), correctIndex: 1, difficulty: "easy", category: "crypto" },
    { question: "What does DeFi stand for?", options: JSON.stringify(["Decentralized Finance", "Digital Finance", "Distributed Fidelity", "Default Financial"]), correctIndex: 0, difficulty: "easy", category: "crypto" },
    { question: "What is the result of 17 x 6?", options: JSON.stringify(["96", "102", "108", "92"]), correctIndex: 1, difficulty: "easy", category: "math" },
    { question: "How many possible 6-digit codes are there (0-9)?", options: JSON.stringify(["100,000", "999,999", "1,000,000", "10,000,000"]), correctIndex: 2, difficulty: "hard", category: "math" },
    { question: "What is a 'whale' in crypto?", options: JSON.stringify(["A scam token", "Someone with large holdings", "A type of blockchain", "A mining pool"]), correctIndex: 1, difficulty: "easy", category: "crypto" },
    { question: "I have keys but no locks. What am I?", options: JSON.stringify(["A piano", "A map", "A keyboard", "A safe"]), correctIndex: 0, difficulty: "easy", category: "riddle" },
    { question: "What has a face and two hands but no arms?", options: JSON.stringify(["A clock", "A robot", "A doll", "A painting"]), correctIndex: 0, difficulty: "easy", category: "riddle" },
    { question: "What gets wetter the more it dries?", options: JSON.stringify(["A sponge", "A towel", "Sand", "Salt"]), correctIndex: 1, difficulty: "medium", category: "riddle" },
    { question: "What is the square root of 144?", options: JSON.stringify(["11", "12", "13", "14"]), correctIndex: 1, difficulty: "easy", category: "math" },
    { question: "What Layer 2 solution does Base use?", options: JSON.stringify(["ZK Rollup", "Optimistic Rollup", "Plasma", "State Channels"]), correctIndex: 1, difficulty: "hard", category: "crypto" },
  ];

  for (const q of QUIZ_QUESTIONS) {
    await prisma.quizQuestion.upsert({
      where: { id: q.question.slice(0, 20).replace(/\W/g, "_").toLowerCase() },
      update: q,
      create: q,
    });
  }
  console.log("Seeded", QUIZ_QUESTIONS.length, "quiz questions");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
