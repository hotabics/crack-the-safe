export interface GuessResult {
  guess: string;
  correctPositions: number;
  correctDigits: number;
  feedback: "cold" | "warm" | "hot" | "cracked";
  timestamp: number;
}

export function evaluateGuess(guess: string, secret: string): GuessResult {
  let correctPositions = 0;
  let correctDigits = 0;

  const secretArr = secret.split("");
  const guessArr = guess.split("");
  const unmatchedSecret: string[] = [];
  const unmatchedGuess: string[] = [];

  // Pass 1: exact position matches
  for (let i = 0; i < secretArr.length; i++) {
    if (guessArr[i] === secretArr[i]) {
      correctPositions++;
    } else {
      unmatchedSecret.push(secretArr[i]);
      unmatchedGuess.push(guessArr[i]);
    }
  }

  // Pass 2: right digit, wrong position
  for (const digit of unmatchedGuess) {
    const idx = unmatchedSecret.indexOf(digit);
    if (idx !== -1) {
      correctDigits++;
      unmatchedSecret.splice(idx, 1);
    }
  }

  let feedback: GuessResult["feedback"];
  if (correctPositions === secret.length) {
    feedback = "cracked";
  } else if (correctPositions > 0) {
    feedback = "hot";
  } else if (correctDigits > 0) {
    feedback = "warm";
  } else {
    feedback = "cold";
  }

  return { guess, correctPositions, correctDigits, feedback, timestamp: Date.now() };
}

export function generateVaultCode(length: number = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export function getFeedbackLabel(result: GuessResult): string {
  switch (result.feedback) {
    case "cracked":
      return "CRACKED! You won!";
    case "hot":
      return `HOT - ${result.correctPositions} digit${result.correctPositions > 1 ? "s" : ""} in correct position`;
    case "warm":
      return `WARM - ${result.correctDigits} correct digit${result.correctDigits > 1 ? "s" : ""}, wrong position`;
    case "cold":
      return "COLD - No matching digits";
  }
}
