import { z } from "zod";

// ============================================================================
// 🔹 피드/댓글 쿼리 스키마 (기존 유지)
// ============================================================================

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["createdAt,asc", "createdAt,desc"]).default("createdAt,desc"),
});

export type CommentListQuery = z.infer<typeof commentListQuerySchema>;

// ============================================================================
// 🔹 피드 생성/수정 스키마 (신규)
// ============================================================================

export const createFeedSchema = z.object({
  content: z
    .string()
    .min(1, "피드 내용은 1자 이상 입력해야 합니다.")
    .max(2000, "피드 내용은 2000자를 초과할 수 없습니다."),
  mediaUrls: z
    .array(z.url("유효한 URL 형식이 아닙니다."))
    .max(10, "이미지/영상은 최대 10개까지 업로드 가능합니다.")
    .optional()
    .default([]),
  isNotice: z.boolean().optional().default(false),
});

export type CreateFeedInput = z.infer<typeof createFeedSchema>;

export const updateFeedSchema = createFeedSchema; // 동일한 제약조건
export type UpdateFeedInput = z.infer<typeof updateFeedSchema>;

// ============================================================================
// 🔹 피드 좋아요 토글 스키마 (신규)
// ============================================================================

export const feedLikeToggleSchema = z.object({
  feedId: z.string().min(1, "피드 ID가 필요합니다."),
  sellerId: z.string().min(1, "판매자 ID가 필요합니다."),
});

export type FeedLikeToggleInput = z.infer<typeof feedLikeToggleSchema>;
