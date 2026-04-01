import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory global rate limiter for API routes.
// In production, replace with @upstash/ratelimit + Redis for distributed rate limiting.
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQUESTS = 60; // 60 requests per minute per IP

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  // Only rate-limit API routes
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip rate limiting for auth routes (NextAuth handles its own)
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      }
    );
  }

  // Periodic cleanup to prevent memory growth
  if (ipRequestMap.size > 50_000) {
    ipRequestMap.forEach((val, key) => {
      if (now > val.resetAt) ipRequestMap.delete(key);
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
