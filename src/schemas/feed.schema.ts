import { z } from "zod";

// ============================================================================
// 🔹 피드/댓글 쿼리 스키마
// ============================================================================

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0), // 0-based
  size: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["createdAt,asc", "createdAt,desc"]).default("createdAt,desc"),
});

export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
