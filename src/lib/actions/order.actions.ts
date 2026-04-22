"use server";

import {
  CreateOrderRequest,
  ConfirmOrderRequest,
  CancelOrderRequest,
} from "@/schemas/order.schema";
import {
  CreateOrderResponse,
  ConfirmOrderResponse,
  OrderDetailResponse,
  BuyerOrdersResponse,
  SellerOrdersResponse,
} from "@/types/order";
import {
  createOrder,
  confirmOrder,
  fetchBuyerOrders,
  fetchSellerOrders,
  fetchOrderDetail,
  cancelOrder,
} from "@/lib/services/order.service";
import { OrderApiError } from "@/utils/error/orders.error";
import { ProblemDetailError } from "@/types/common";

// ============================================================================
// 🎯 액션 반환 타입 (클라이언트에서 처리하기 용이하게)
// ============================================================================
type ActionResponse<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ProblemDetailError };

// ============================================================================
// 🔹 주문 생성 액션
// ============================================================================
export async function createOrderAction(
  data: CreateOrderRequest,
): Promise<ActionResponse<CreateOrderResponse>> {
  try {
    const result = await createOrder(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof OrderApiError) {
      return { success: false, data: null, error: error.problemDetail };
    }
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "주문 생성 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}

// ============================================================================
// 🔹 결제 확인 액션
// ============================================================================
export async function confirmOrderAction(
  data: ConfirmOrderRequest,
): Promise<ActionResponse<ConfirmOrderResponse>> {
  try {
    const result = await confirmOrder(data);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof OrderApiError) {
      return { success: false, data: null, error: error.problemDetail };
    }
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "결제 확인 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}

// ============================================================================
// 🔹 구매자 주문 목록 조회 액션
// ============================================================================
export async function getBuyerOrdersAction(
  userId: number,
): Promise<ActionResponse<BuyerOrdersResponse>> {
  try {
    const result = await fetchBuyerOrders(userId);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof OrderApiError) {
      return { success: false, data: null, error: error.problemDetail };
    }
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "주문 목록 조회 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}

// ============================================================================
// 🔹 판매자 주문 목록 조회 액션
// ============================================================================
export async function getSellerOrdersAction(
  userId: number,
): Promise<ActionResponse<SellerOrdersResponse>> {
  try {
    const result = await fetchSellerOrders(userId);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof OrderApiError) {
      return { success: false, data: null, error: error.problemDetail };
    }
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "판매 내역 조회 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}

// ============================================================================
// 🔹 주문 상세 조회 액션
// ============================================================================
export async function getOrderDetailAction(
  userId: number,
  orderNumber: string,
): Promise<ActionResponse<OrderDetailResponse>> {
  try {
    const result = await fetchOrderDetail(userId, orderNumber);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof OrderApiError) {
      return { success: false, data: null, error: error.problemDetail };
    }
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "주문 상세 조회 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}

// ============================================================================
// 🔹 주문 취소 액션
// ============================================================================
export async function cancelOrderAction(
  userId: number,
  orderNumber: string,
): Promise<ActionResponse<CreateOrderResponse>> {
  try {
    const result = await cancelOrder(userId, orderNumber);
    return { success: true, data: result, error: null };
  } catch (error) {
    if (error instanceof OrderApiError) {
      return { success: false, data: null, error: error.problemDetail };
    }
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "주문 취소 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}