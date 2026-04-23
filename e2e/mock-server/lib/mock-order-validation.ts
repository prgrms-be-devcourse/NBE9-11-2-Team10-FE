// e2e/mock-server/lib/mock-order-validation.ts
import { ProblemDetailResponse, createErrorResponse } from "./mock-common-data";
import { CreateOrderRequest, ConfirmOrderRequest } from "./mock-order-data";
import { ProductStore } from "./mock-product-data";

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
  for (const item of products) {
    const product = ProductStore.findById(item.productId);
    
    // 상품이 없거나 비활성화된 경우
    if (!product) {
      return createErrorResponse(
        404,
        "PRODUCT_NOT_FOUND",
        `상품을 찾을 수 없습니다. ID: ${item.productId}`,
        path,
      );
    }
    
    // 재고 부족 검증 (선택사항)
    if (product.stock < item.quantity) {
      return createErrorResponse(
        400,
        "INSUFFICIENT_STOCK",
        `상품 "${product.productName}" 의 재고가 부족합니다. (요청: ${item.quantity}, 보유: ${product.stock})`,
        path,
      );
    }
  }
  return null;
};

export const fetchOrderProductInfo = (
  products: Array<{ productId: number; quantity: number }>,
  path: string,
): { 
  success: true; 
  items: Array<{ 
    productId: number; 
    productName: string; 
    quantity: number; 
    orderPrice: number; 
    sellerId: number; 
  }>; 
} | ProblemDetailResponse => {
  
  const orderItems = [];
  
  for (const item of products) {
    const product = ProductStore.findById(item.productId);
    if (!product) {
      return createErrorResponse(
        404,
        "PRODUCT_NOT_FOUND",
        `상품을 찾을 수 없습니다. ID: ${item.productId}`,
        path,
      );
    }
    
    orderItems.push({
      productId: product.productId,
      productName: product.productName,
      quantity: item.quantity,
      orderPrice: product.price, // ✅ 실시간 가격 참조
      sellerId: product.sellerId, // ✅ 판매자 정보 참조
    });
  }
  
  return { success: true, items: orderItems };
};