import "server-only";
import { createHash, timingSafeEqual } from "crypto";

export function getVaultCode(): string {
  const code = process.env.VAULT_SECRET_CODE;
  if (!code) throw new Error("VAULT_SECRET_CODE env var is not set");
  return code;
}

export function hashCode(code: string, salt: string = ""): string {
  return createHash("sha256").update(salt + code).digest("hex");
}

/** Constant-time full-code equality check to prevent timing side-channel attacks */
function isExactMatch(guess: string, secret: string): boolean {
  if (guess.length !== secret.length) return false;
  const guessBuf = Buffer.from(guess, "utf-8");
  const secretBuf = Buffer.from(secret, "utf-8");
  return timingSafeEqual(guessBuf, secretBuf);
}

export interface ServerGuessResult {
  guess: string;
  correctPositions: number;
  correctDigits: number;
  feedback: "cold" | "warm" | "hot" | "cracked";
}

export function evaluateGuessServer(guess: string): ServerGuessResult {
  const secret = getVaultCode();

  // Use constant-time comparison for the full match check
  const isCracked = isExactMatch(guess, secret);

  // For partial feedback we still need per-digit analysis.
  // This leaks some timing info about individual digits, but the critical
  // "cracked" decision uses constant-time comparison above.
  let correctPositions = 0;
  let correctDigits = 0;

  const secretArr = secret.split("");
  const guessArr = guess.split("");
  const unmatchedSecret: string[] = [];
  const unmatchedGuess: string[] = [];

  for (let i = 0; i < secretArr.length; i++) {
    if (guessArr[i] === secretArr[i]) {
      correctPositions++;
    } else {
      unmatchedSecret.push(secretArr[i]);
      unmatchedGuess.push(guessArr[i]);
    }
  }

  for (const digit of unmatchedGuess) {
    const idx = unmatchedSecret.indexOf(digit);
    if (idx !== -1) {
      correctDigits++;
      unmatchedSecret.splice(idx, 1);
    }
  }

  let feedback: ServerGuessResult["feedback"];
  if (isCracked) {
    feedback = "cracked";
  } else if (correctPositions > 0) {
    feedback = "hot";
  } else if (correctDigits > 0) {
    feedback = "warm";
  } else {
    feedback = "cold";
  }

  return { guess, correctPositions, correctDigits, feedback };
}
