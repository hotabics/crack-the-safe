const rateLimitMap = new Map<string, number>();
const taskClaimMap = new Map<string, number>();

const GUESS_COOLDOWN_MS = 10_000; // 10 seconds between guesses
const TASK_CLAIM_COOLDOWN_MS = 5_000; // 5 seconds between task claims

function checkCooldown(
  map: Map<string, number>,
  key: string,
  cooldownMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const last = map.get(key);

  if (last && now - last < cooldownMs) {
    return { allowed: false, retryAfterMs: cooldownMs - (now - last) };
  }

  map.set(key, now);

  // Clean up old entries periodically
  if (map.size > 10_000) {
    map.forEach((time, k) => {
      if (now - time > cooldownMs) map.delete(k);
    });
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function checkRateLimit(userId: string) {
  return checkCooldown(rateLimitMap, userId, GUESS_COOLDOWN_MS);
}

export function checkTaskClaimRateLimit(userId: string) {
  return checkCooldown(taskClaimMap, userId, TASK_CLAIM_COOLDOWN_MS);
}
