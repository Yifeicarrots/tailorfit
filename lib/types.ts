import { z } from "zod";

// Shared contracts between both teammates. Do not change without asking first.

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");

export const bulletSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const experienceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["experience", "project"]),
  title: z.string().min(1),
  organization: z.string().min(1).optional(),
  startDate: yearMonth,
  endDate: yearMonth.nullable(), // null = present
  bullets: z.array(bulletSchema).min(1),
});

export const experienceLibrarySchema = z.array(experienceSchema);

export const selectionResultSchema = z.object({
  selected: z.array(
    z.object({
      id: z.string().min(1),
      reason: z.string().min(1),
    }),
  ),
});

// App-level rewrite contract: produced by the rewriter + validation (#6),
// consumed by the comparison screen (#7). Claude's raw response is parsed by a
// separate minimal schema in the rewriter. `flagged` and `flagReason` are set
// only by our validation code, never by Claude.
export const rewriteResultSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      bullets: z.array(
        z.object({
          id: z.string().min(1),
          original: z.string(),
          rewritten: z.string(),
          flagged: z.boolean(),
          flagReason: z.string().min(1).optional(),
        }),
      ),
    }),
  ),
});

export type Bullet = z.infer<typeof bulletSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type ExperienceLibrary = z.infer<typeof experienceLibrarySchema>;
export type SelectionResult = z.infer<typeof selectionResultSchema>;
export type RewriteResult = z.infer<typeof rewriteResultSchema>;
