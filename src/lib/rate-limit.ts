const rateLimitMap = new Map<string, number>();

const COOLDOWN_MS = 10_000; // 10 seconds

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const lastAttempt = rateLimitMap.get(userId);

  if (lastAttempt && now - lastAttempt < COOLDOWN_MS) {
    return { allowed: false, retryAfterMs: COOLDOWN_MS - (now - lastAttempt) };
  }

  rateLimitMap.set(userId, now);

  // Clean up old entries periodically
  if (rateLimitMap.size > 10_000) {
    rateLimitMap.forEach((time, key) => {
      if (now - time > COOLDOWN_MS) rateLimitMap.delete(key);
    });
  }

  return { allowed: true, retryAfterMs: 0 };
}
