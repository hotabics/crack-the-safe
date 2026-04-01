import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { prisma } from "./db";

export async function requireAuth(): Promise<string> {
  const session = await getServerSession(authOptions);

  console.log("[AUTH] getServerSession result:", JSON.stringify(session));

  if (!session?.address) {
    throw new Error("UNAUTHORIZED");
  }

  const walletAddress = session.address.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user.id;
}
