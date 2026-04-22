// e2e/mock-server/lib/mock-order-validation.ts
import { ProblemDetailResponse, createErrorResponse } from "./mock-common-data";
import { CreateOrderRequest, ConfirmOrderRequest } from "./mock-order-data";

// ============================================================================
// 🔹 주문 생성 요청 검증
// ============================================================================
export const validateCreateOrder = (
  body: any,
  path: string,
): ProblemDetailResponse | null => {
  const errors: Array<{ field: string; message: string }> = [];

  // deliveryAddress 검증
  if (!body.deliveryAddress || typeof body.deliveryAddress !== "string") {
    errors.push({ field: "deliveryAddress", message: "배송 주소는 필수입니다." });
  } else if (body.deliveryAddress.trim().length < 1) {
    errors.push({ field: "deliveryAddress", message: "배송 주소는 필수입니다." });
  } else if (body.deliveryAddress.length > 500) {
    errors.push({ field: "deliveryAddress", message: "배송 주소는 500 자를 초과할 수 없습니다." });
  }

  // orderProducts 검증
  if (!body.orderProducts || !Array.isArray(body.orderProducts)) {
    errors.push({ field: "orderProducts", message: "상품 목록은 배열 형식이어야 합니다." });
  } else if (body.orderProducts.length < 1) {
    errors.push({ field: "orderProducts", message: "상품을 최소 1 개 이상 선택해야 합니다." });
  } else {
    body.orderProducts.forEach((item: any, index: number) => {
      if (!item.productId || !Number.isInteger(item.productId)) {
        errors.push({ 
          field: `orderProducts[${index}].productId`, 
          message: "유효한 상품 ID 가 필요합니다." 
        });
      }
      if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
        errors.push({ 
          field: `orderProducts[${index}].quantity`, 
          message: "수량은 1 이상이어야 합니다." 
        });
      }
    });
  }

  if (errors.length > 0) {
    return {
      ...createErrorResponse(400, "VALIDATION_FAILED", "입력값 검증에 실패했습니다.", path),
      validationErrors: errors,
    };
  }
  return null;
};

// ============================================================================
// 🔹 결제 확인 요청 검증
// ============================================================================
export const validateConfirmOrder = (
  body: any,
  path: string,
): ProblemDetailResponse | null => {
  const errors: Array<{ field: string; message: string }> = [];

  if (!body.paymentKey || typeof body.paymentKey !== "string") {
    errors.push({ field: "paymentKey", message: "paymentKey 는 필수입니다." });
  }

  if (!body.orderId || typeof body.orderId !== "string") {
    errors.push({ field: "orderId", message: "orderId 는 필수입니다." });
  }

  if (body.amount === undefined || !Number.isInteger(body.amount) || body.amount < 0) {
    errors.push({ field: "amount", message: "유효한 금액이 필요합니다." });
  }

  if (errors.length > 0) {
    return {
      ...createErrorResponse(400, "VALIDATION_FAILED", "결제 확인 요청값이 유효하지 않습니다.", path),
      validationErrors: errors,
    };
  }
  return null;
};

// ============================================================================
// 🔹 상품 존재 여부 검증 (Mock)
// ============================================================================
export const validateProductsExist = (
  products: Array<{ productId: number; quantity: number }>,
  path: string,
): ProblemDetailResponse | null => {
  const MOCK_PRODUCT_IDS = [101, 102, 103, 104, 105]; // mock-order-data.ts 와 동기화

  for (const item of products) {
    if (!MOCK_PRODUCT_IDS.includes(item.productId)) {
      return createErrorResponse(
        404,
        "PRODUCT_NOT_FOUND",
        `상품을 찾을 수 없습니다. ID: ${item.productId}`,
        path,
      );
    }
  }
  return null;
};