import { prisma } from "./db";

export async function logAudit(
  action: string,
  details?: Record<string, unknown>,
  userId?: string,
  ip?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        details: details ? JSON.stringify(details) : null,
        ip,
      },
    });
  } catch (e) {
    // Never let audit logging break the main flow
    console.error("[AUDIT] Failed to log:", e);
  }
}
