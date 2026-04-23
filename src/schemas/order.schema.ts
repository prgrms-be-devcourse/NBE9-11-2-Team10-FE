import { z } from "zod";

// ============================================================================
// 📦 공통 타입 스키마
// ============================================================================
export const uuidSchema = z.uuid("유효한 UUID 형식이 아닙니다.");
export const amountSchema = z
  .number()
  .int("금액은 정수여야 합니다.")
  .min(0, "금액은 0 이상이어야 합니다.");

// ============================================================================
// 🔹 주문 생성 요청 스키마
// ============================================================================
export const orderItemSchema = z.object({
  productId: z.number().int().positive("유효한 상품 ID 가 필요합니다."),
  quantity: z.number().int().min(1, "수량은 1 개 이상이어야 합니다."),
});

export const createOrderSchema = z.object({
  deliveryAddress: z
    .string()
    .min(1, "배송 주소는 필수입니다.")
    .max(500, "배송 주소는 500 자를 초과할 수 없습니다."),
  orderProducts: z
    .array(orderItemSchema)
    .min(1, "상품을 최소 1 개 이상 선택해야 합니다."),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

// ============================================================================
// 🔹 주문 확인 (결제) 요청 스키마
// ============================================================================
export const confirmOrderSchema = z.object({
  paymentKey: z.string().min(1, "paymentKey 는 필수입니다."),
  orderId: z.string().min(1, "orderId 는 필수입니다."),
  amount: amountSchema,
});

export type ConfirmOrderRequest = z.infer<typeof confirmOrderSchema>;

// ============================================================================
// 🔹 주문 조회 쿼리 스키마
// ============================================================================
export const orderQuerySchema = z.object({
  orderNumber: z.string().optional(),
});

export type OrderQueryParams = z.infer<typeof orderQuerySchema>;