// src/schemas/store.schema.ts
import { z } from "zod";

// ============================================================================
// 📦 공통 타입 스키마
// ============================================================================
export const uuidSchema = z.uuid("유효한 UUID 형식이 아닙니다.");
export const urlSchema = z
  .url("올바른 URL 형식이어야 합니다.")
  .max(500, "URL 은 500 자를 초과할 수 없습니다.")
  .optional()
  .or(z.literal(""))
  .or(z.null());

// ============================================================================
// 🔹 프로필 관련 스키마
// ============================================================================
export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .max(100, "상호명은 100 자를 초과할 수 없습니다.")
    .optional(),
  ceoName: z
    .string()
    .max(50, "대표자명은 50 자를 초과할 수 없습니다.")
    .optional(),
});

export const profileUpdateSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2 자 이상이어야 합니다.")
    .max(20, "닉네임은 20 자를 초과할 수 없습니다.")
    .regex(
      /^[\wㄱ-ㅎ가-힣]+$/,
      "닉네임은 영문, 숫자, 한글, _ 만 사용할 수 있습니다.",
    )
    .optional(),
  bio: z
    .string()
    .max(500, "소개는 500 자를 초과할 수 없습니다.")
    .optional()
    .or(z.literal("")),
  profileImageUrl: urlSchema,
  businessInfo: businessInfoSchema.optional(),
});

export type ProfileUpdateRequest = z.infer<typeof profileUpdateSchema>;

// ============================================================================
// 🔹 닉네임 중복 체크 스키마
// ============================================================================
export const nicknameCheckQuerySchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2 자 이상이어야 합니다.")
    .max(20, "닉네임은 20 자를 초과할 수 없습니다.")
    .regex(
      /^[\wㄱ-ㅎ가-힣]+$/,
      "닉네임은 영문, 숫자, 한글, _ 만 사용할 수 있습니다.",
    ),
});

export type NicknameCheckQuery = z.infer<typeof nicknameCheckQuerySchema>;

// ============================================================================
// 🔹 피드/댓글 쿼리 스키마
// ============================================================================
export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0), // 0-based
  size: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["createdAt,asc", "createdAt,desc"]).default("createdAt,desc"),
});

export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
