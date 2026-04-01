import { NextResponse } from "next/server";

// Client-side logout is handled by NextAuth's signOut() via AppKit SIWE config.
// This route exists as a fallback for the API client to call.
export async function POST() {
  // NextAuth manages JWT sessions via cookies — clearing happens client-side.
  // Return success so the client can reset its local state.
  return NextResponse.json({ ok: true });
}
