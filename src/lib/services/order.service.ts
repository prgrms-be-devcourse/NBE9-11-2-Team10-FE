"use server";

import { revalidateTag } from "next/cache";
import {
  CreateOrderRequest,
  ConfirmOrderRequest,
  createOrderSchema,
  confirmOrderSchema,
} from "@/schemas/order.schema";
import {
    CreateOrderResponse,
    ConfirmOrderResponse,
    OrderDetailResponse,
    BuyerOrdersResponse,
    SellerOrdersResponse,
    BuyerOrdersData,
    SellerOrdersData,
    OrderDetailData,
    OrderDetailResponseWrapper,
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
  options?: { timeoutMs?: number }
): Promise<ConfirmOrderResponse> {
  const { timeoutMs = 15000 } = options ?? {};
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/orders/confirm`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(validated.data),
      cache: "no-store",
      signal: controller.signal, // ✅ 타임아웃 신호 연결
    });

    clearTimeout(timeoutId); // ✅ 성공 시 타이머 클리어

    if (!response.ok) {
      const error = await handleApiError(response);
      throw OrderApiError.fromProblemDetail(error);
    }

    // ✅ 결제 성공 시 관련 캐시 무효화
    revalidateTag(ORDER_CACHE_TAG, "max");

    return response.json() as Promise<ConfirmOrderResponse>;
    
  } catch (error) {
    clearTimeout(timeoutId); // ✅ 에러 시에도 타이머 클리어
    
    // ✅ 타임아웃 에러 구분 처리
    if (error instanceof Error && error.name === "AbortError") {
      throw new OrderApiError({
        type: "https://api.example.com/errors/TIMEOUT",
        title: "결제 확인 시간 초과",
        status: 504,
        detail: "결제 확인 처리가 시간 내에 완료되지 않았습니다. 주문 상태를 확인해 주세요.",
        errorCode: "CONFIRM_TIMEOUT",
      });
    }
    
    // ✅ 기존 에러 처리 유지
    if (error instanceof OrderApiError) {
      throw error;
    }
    
    throw new OrderApiError({
      type: "https://api.example.com/errors/NETWORK_ERROR",
      title: "네트워크 오류",
      status: 503,
      detail: "결제 확인 중 네트워크 오류가 발생했습니다.",
      errorCode: "NETWORK_ERROR",
    });
  }
}

// ============================================================================
// 🔹 GET /api/v1/orders/buyer - 구매자 주문 목록 조회
// ============================================================================
export async function fetchBuyerOrders(
  mockUserId?: string,
): Promise<BuyerOrdersData> {

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
      cache: "no-store"
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  const wrapper = await response.json() as BuyerOrdersResponse;
  
  if (!wrapper.success) {
    throw new OrderApiError({
      type: "https://api.example.com/errors/API_ERROR",
      title: "API 응답 오류",
      status: wrapper.error?.status || 500,
      detail: wrapper.error?.message || "알 수 없는 오류",
      errorCode: wrapper.error?.code || "UNKNOWN_ERROR",
    });
  }
  
  return wrapper.data;
}

// ============================================================================
// 🔹 GET /api/v1/orders/seller - 판매자 주문 목록 조회
// ============================================================================
export async function fetchSellerOrders(
  mockUserId?: string,
): Promise<SellerOrdersData> {
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
      cache: "no-store"
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  // ✅ 래퍼에서 실제 데이터 추출
  const wrapper = await response.json() as SellerOrdersResponse;
  
  if (!wrapper.success) {
    throw new OrderApiError({
      type: "https://api.example.com/errors/API_ERROR",
      title: "API 응답 오류",
      status: wrapper.error?.status || 500,
      detail: wrapper.error?.message || "알 수 없는 오류",
      errorCode: wrapper.error?.code || "UNKNOWN_ERROR",
    });
  }
  
  return wrapper.data;
}

// ============================================================================
// 🔹 GET /api/v1/orders/{orderNumber} - 주문 상세 조회
// ============================================================================
export async function fetchOrderDetail(
  orderNumber: string,
  mockUserId?: string,
): Promise<OrderDetailData> {
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
      cache: "no-store"
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw OrderApiError.fromProblemDetail(error);
  }

  // ✅ 래퍼에서 실제 데이터 추출
  const wrapper = await response.json() as OrderDetailResponseWrapper;
  
  if (!wrapper.success) {
    throw new OrderApiError({
      type: "https://api.example.com/errors/API_ERROR",
      title: "API 응답 오류",
      status: wrapper.error?.status || 500,
      detail: wrapper.error?.message || "알 수 없는 오류",
      errorCode: wrapper.error?.code || "UNKNOWN_ERROR",
    });
  }
  
  return wrapper.data;
}