import { z } from "zod";

export const guessSchema = z.object({
  guess: z
    .string()
    .length(4, "Guess must be exactly 4 digits")
    .regex(/^\d{4}$/, "Guess must contain only digits"),
});

export const taskClaimSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
});
