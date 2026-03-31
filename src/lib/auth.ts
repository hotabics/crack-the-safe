import { getSession } from "./session";

export async function requireAuth(): Promise<string> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return session.userId;
}
