import "server-only";
import { createHash } from "crypto";

export function getVaultCode(): string {
  const code = process.env.VAULT_SECRET_CODE;
  if (!code) throw new Error("VAULT_SECRET_CODE env var is not set");
  return code;
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export interface ServerGuessResult {
  guess: string;
  correctPositions: number;
  correctDigits: number;
  feedback: "cold" | "warm" | "hot" | "cracked";
}

export function evaluateGuessServer(guess: string): ServerGuessResult {
  const secret = getVaultCode();
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
  if (correctPositions === secret.length) {
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
