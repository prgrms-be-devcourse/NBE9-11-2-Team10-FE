"use server";

import { revalidateTag } from "next/cache";
import {
  CreateOrderRequest,
  ConfirmOrderRequest,
  CancelOrderRequest,
  createOrderSchema,
  confirmOrderSchema,
  cancelOrderSchema,
} from "@/schemas/order.schema";
import {
    CreateOrderResponse,
    ConfirmOrderResponse,
    OrderDetailResponse,
    BuyerOrdersResponse,
    SellerOrdersResponse,
  } from "@/types/order";
import { getForwardedHeaders, handleApiError } from "@/utils/helper";
import { OrderApiError } from "@/utils/error/orders.error";
import { ProblemDetailError } from "@/types/common";

// ============================================================================
// ⚙️ 설정
// ============================================================================
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const ORDER_CACHE_TAG = "order-data";

// ============================================================================
// 🔹 POST /api/v1/orders - 주문 생성
// ============================================================================
export async function createOrder(
  data: CreateOrderRequest,
  mockUserId?: string,
): Promise<CreateOrderResponse> {
  // ✅ 요청값 검증
  const validated = createOrderSchema.safeParse(data);
  if (!validated.success) {
    throw new OrderApiError({
      type: "https://api.example.com/errors/VALIDATION_FAILED",
      title: "입력값 검증 실패",
      status: 400,
      detail: "입력값 검증에 실패했습니다.",
      errorCode: "VALIDATION_FAILED",
      validationErrors: validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(`${API_BASE_URL}/api/v1/orders`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(validated.data),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<CreateOrderResponse>;
}

// ============================================================================
// 🔹 POST /api/v1/orders/confirm - 결제 확인
// ============================================================================
export async function confirmOrder(
  data: ConfirmOrderRequest,
  mockUserId?: string,
): Promise<ConfirmOrderResponse> {
  const validated = confirmOrderSchema.safeParse(data);
  if (!validated.success) {
    throw new OrderApiError({
      type: "https://api.example.com/errors/VALIDATION_FAILED",
      title: "입력값 검증 실패",
      status: 400,
      detail: "결제 확인 요청값이 유효하지 않습니다.",
      errorCode: "VALIDATION_FAILED",
      validationErrors: validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(`${API_BASE_URL}/api/v1/orders/confirm`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(validated.data),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  // ✅ 결제 성공 시 관련 캐시 무효화
  revalidateTag(ORDER_CACHE_TAG, "max");

  return response.json() as Promise<ConfirmOrderResponse>;
}

// ============================================================================
// 🔹 GET /api/v1/orders/buyer - 구매자 주문 목록 조회
// ============================================================================
export async function fetchBuyerOrders(
  mockUserId?: string,
): Promise<BuyerOrdersResponse> {

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/orders/buyer`,
    {
      method: "GET",
      headers,
      cache: "no-store",
      next: { tags: [ORDER_CACHE_TAG] }, // ✅ ISR 캐시 태그 적용
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<BuyerOrdersResponse>;
}

// ============================================================================
// 🔹 GET /api/v1/orders/seller - 판매자 주문 목록 조회
// ============================================================================
export async function fetchSellerOrders(
  mockUserId?: string,
): Promise<SellerOrdersResponse> {
  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/orders/seller`,
    {
      method: "GET",
      headers,
      cache: "no-store",
      next: { tags: [ORDER_CACHE_TAG] },
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<SellerOrdersResponse>;
}

// ============================================================================
// 🔹 GET /api/v1/orders/{orderNumber} - 주문 상세 조회
// ============================================================================
export async function fetchOrderDetail(
  orderNumber: string,
  mockUserId?: string,
): Promise<OrderDetailResponse> {
  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/orders/${orderNumber}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
      next: { tags: [ORDER_CACHE_TAG] },
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<OrderDetailResponse>;
}

// ============================================================================
// 🔹 DELETE /api/v1/orders/{orderNumber} - 주문 취소
// ============================================================================
export async function cancelOrder(
  orderNumber: string,
  mockUserId?: string,
): Promise<CreateOrderResponse> {
  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/orders/${orderNumber}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  // ✅ 주문 취소 시 캐시 무효화
  revalidateTag(ORDER_CACHE_TAG, "max");

  return response.json() as Promise<CreateOrderResponse>;
}