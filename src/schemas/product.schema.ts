import { z } from "zod";

// ============================================================================
// 📦 Enum 정의 (백엔드 명세서 기반)
// ============================================================================
export const productTypeSchema = z.enum(["BOOK", "EBOOK"]);
export const productStatusSchema = z.enum(["SELLING", "SOLD_OUT", "INACTIVE"]);
export const publicStatusSchema = z.enum(["SELLING", "SOLD_OUT"]); // 공용 조회용 (INACTIVE 제외)

export type ProductType = z.infer<typeof productTypeSchema>;
export type ProductStatus = z.infer<typeof productStatusSchema>;
export type PublicStatus = z.infer<typeof publicStatusSchema>;

// ============================================================================
// 🔹 상품 생성 스키마 (판매자용)
// ============================================================================
export const productCreateSchema = z.object({
  productName: z
    .string()
    .min(1, "상품명은 필수입니다.")
    .max(100, "상품명은 100자 이하여야 합니다."),

  price: z
    .number()
    .int("가격은 정수여야 합니다.")
    .min(1, "가격은 1 이상이어야 합니다."),

  stock: z
    .number()
    .int("재고는 정수여야 합니다.")
    .min(0, "재고는 0 이상이어야 합니다."),

  type: productTypeSchema,

  description: z
    .string()
    .max(1000, "설명은 1000자 이하여야 합니다.")
    .optional()
    .or(z.literal("")),

  imageUrl: z
    .url("올바른 이미지 URL 형식이어야 합니다.")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
});

export type ProductCreateRequest = z.infer<typeof productCreateSchema>;

// ============================================================================
// 🔹 상품 수정 스키마 (판매자용)
// ============================================================================
export const productUpdateSchema = productCreateSchema.extend({
  productId: z.number().int().positive("유효한 상품 ID가 필요합니다."),
  status: productStatusSchema.optional(),
});

export type ProductUpdateRequest = z.infer<typeof productUpdateSchema>;

// ============================================================================
// 🔹 상품 조회 쿼리 스키마 (공용)
// ============================================================================
export const productListQuerySchema = z.object({
  // ✅ page: 1 부터 시작, 기본값 1
  page: z.coerce
    .number()
    .int()
    .min(1, "페이지는 1 부터 시작합니다.")
    .default(1),

  size: z.coerce.number().int().min(1).max(100).default(10),
  type: productTypeSchema.optional(),
  status: publicStatusSchema.optional(),
  sellerId: z.coerce.number().int().optional(),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// ============================================================================
// 🔹 폼 에러 타입 (useActionState 연동용)
// ============================================================================
export type ProductFormErrors = Record<string, string>;
