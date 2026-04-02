import { prisma } from "@/lib/db";

// Server-Sent Events endpoint for real-time vault updates.
// Clients connect and receive hint/crack events as they happen.
// For Vercel serverless: this uses polling under the hood (SSE over streaming response).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastGuessId = "";
      let lastCracked = false;

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send initial state
      const vault = await prisma.vault.findFirst({
        where: { isCracked: false },
        orderBy: { startsAt: "desc" },
      });

      if (vault) {
        const maxHeat = await prisma.guess.aggregate({
          where: { vaultId: vault.id },
          _max: { correctPositions: true },
        });
        sendEvent("heat", { heatLevel: maxHeat._max.correctPositions || 0 });
      }

      sendEvent("connected", { ok: true });

      // Poll for new guesses every 3 seconds (Vercel doesn't support true WebSockets)
      const interval = setInterval(async () => {
        try {
          const activeVault = await prisma.vault.findFirst({
            orderBy: { startsAt: "desc" },
          });

          if (!activeVault) return;

          // Check if vault was cracked
          if (activeVault.isCracked && !lastCracked) {
            lastCracked = true;
            sendEvent("cracked", {
              vaultId: activeVault.id,
              crackedAt: activeVault.crackedAt?.toISOString(),
            });
          }

          // Get latest guesses
          const latestGuess = await prisma.guess.findFirst({
            where: { vaultId: activeVault.id },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              correctPositions: true,
              correctDigits: true,
              feedback: true,
              createdAt: true,
            },
          });

          if (latestGuess && latestGuess.id !== lastGuessId) {
            lastGuessId = latestGuess.id;
            sendEvent("hint", {
              guess: "??????",
              correctPositions: latestGuess.correctPositions,
              correctDigits: latestGuess.correctDigits,
              feedback: latestGuess.feedback,
              createdAt: latestGuess.createdAt.toISOString(),
            });

            // Update heat level
            const maxHeat = await prisma.guess.aggregate({
              where: { vaultId: activeVault.id },
              _max: { correctPositions: true },
            });
            sendEvent("heat", { heatLevel: maxHeat._max.correctPositions || 0 });
          }
        } catch (e) {
          // Connection may be closed, ignore
        }
      }, 3000);

      // Vercel has a 30s timeout for streaming — close gracefully before that
      setTimeout(() => {
        clearInterval(interval);
        sendEvent("reconnect", { after: 1000 });
        controller.close();
      }, 25000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
