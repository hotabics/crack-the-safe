import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

export async function requireAdmin(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) throw new Error("UNAUTHORIZED");

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) throw new Error("UNAUTHORIZED");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) throw new Error("FORBIDDEN");

    return userId;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") throw new Error("FORBIDDEN");
    throw new Error("UNAUTHORIZED");
  }
}
