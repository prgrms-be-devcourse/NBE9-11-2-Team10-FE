"use server";

import {
  CreateOrderRequest,
  ConfirmOrderRequest,
  CancelOrderRequest,
  createOrderSchema,
} from "@/schemas/order.schema";
import {
  CreateOrderResponse,
  ConfirmOrderResponse,
  OrderDetailResponse,
  BuyerOrdersResponse,
  SellerOrdersResponse,
  ApiResponse,
  BuyerOrdersData,
  OrderActionState,
  initialOrderState,
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
/*
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
  */
export async function updateOrderField(
  prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const field = formData.get('field') as string;
  const value = formData.get('value') as string;

  const newErrors = { ...prevState.errors };
  delete newErrors[field];

  return {
    ...prevState,
    formData: { ...prevState.formData, [field]: value },
    errors: newErrors,
    message: '',
  };
}

export async function submitOrder(
  prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  // ✅ 1. 폼 값 추출
  const roadAddress = formData.get("roadAddress") as string;
  const detailAddress = formData.get("detailAddress") as string;
  const productId = formData.get("productId") as string;
  const quantity = formData.get("quantity") as string;

  // ✅ 2. 백엔드 요구사항에 맞게 deliveryAddress 조합
  const fullAddress = [
    roadAddress,
    detailAddress
  ].filter(Boolean).join("\n");

  // ✅ 3. 유효성 검사 (Zod 스키마는 deliveryAddress 만 검증)
  const payload = {
    deliveryAddress: fullAddress,
    orderProducts: [{ productId: Number(productId), quantity: Number(quantity) }],
  };

  const validationResult = createOrderSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      ...prevState,
      success: false,
      errors: { roadAddress: "주소 정보를 확인해주세요." },
      message: "입력 정보를 확인해 주세요.",
    };
  }

  try {
    const result = await createOrder(payload);
    return {
      ...initialOrderState,
      success: true,
      message: "주문이 생성되었습니다.",
      data: { orderNumber: result.orderNumber },
    };
  } catch (error) {
    if (error instanceof OrderApiError) {
      if (error.problemDetail.validationErrors?.length) {
        const fieldErrors: Record<string, string> = {};
        error.problemDetail.validationErrors.forEach((err) => {
          fieldErrors[err.field] = err.message;
        });
        return {
          ...prevState,
          formData: payload,
          success: false,
          errors: fieldErrors,
          message: error.problemDetail.detail,
        };
      }
      return {
        ...prevState,
        formData: payload,
        success: false,
        errors: {},
        message: error.problemDetail.detail,
        errorCode: error.problemDetail.errorCode,
      };
    }

    return {
      ...prevState,
      formData: payload,
      success: false,
      errors: {},
      message: '주문 처리 중 오류가 발생했습니다.',
      errorCode: 'INTERNAL_ERROR',
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
    // ✅ 옵션으로 타임아웃 전달 (기본 15초)
    const result = await confirmOrder(data, undefined, { timeoutMs: 15000 });
    
    return { success: true, data: result, error: null };
    
  } catch (error) {
    // ✅ OrderApiError 는 문제 상세 정보 그대로 전달
    if (error instanceof OrderApiError) {
      return { 
        success: false, 
        data: null, 
        error: error.problemDetail,
      };
    }
    
    // ✅ 예상치 못한 에러
    return {
      success: false,
      data: null,
      error: {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "결제 확인 중 예상치 못한 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      },
    };
  }
}


// ============================================================================
// 🔹 주문 취소 액션
// ============================================================================
export async function cancelOrderAction(
  orderNumber: string,
): Promise<ActionResponse<CreateOrderResponse>> {
  try {
    const result = await cancelOrder(orderNumber);
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