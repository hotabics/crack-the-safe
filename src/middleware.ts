import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter.
// In production, replace with @upstash/ratelimit + Redis for distributed rate limiting.
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQUESTS = 60; // 60 requests per minute per IP
const MAX_REQUEST_SIZE = 4096; // 4KB max body for API routes

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://crack.scrim42.com",
  "https://crack-the-safe.vercel.app",
];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function addCorsHeaders(res: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else if (origin?.includes("localhost")) {
    // Allow localhost for development
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS preflight
  if (req.method === "OPTIONS" && pathname.startsWith("/api")) {
    const res = new NextResponse(null, { status: 204 });
    return addCorsHeaders(res, req.headers.get("origin"));
  }

  // Only process API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip rate limiting for auth routes (NextAuth handles its own)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Request size limit for non-GET requests
  if (req.method !== "GET") {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 }
      );
    }
  }

  // IP-based rate limiting
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
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
  }

  // Periodic cleanup to prevent memory growth
  if (ipRequestMap.size > 50_000) {
    ipRequestMap.forEach((val, key) => {
      if (now > val.resetAt) ipRequestMap.delete(key);
    });
  }

  const res = NextResponse.next();
  return addCorsHeaders(res, req.headers.get("origin"));
}

export const config = {
  matcher: "/api/:path*",
};
