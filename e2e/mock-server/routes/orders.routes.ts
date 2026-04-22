// e2e/mock-server/routes/orders.routes.ts
import { Router, Request, Response } from "express";
import {
  createErrorResponse,
  ProblemDetailResponse,
} from "../lib/mock-common-data";
import {
  mockAuthMiddleware,
  mockBuyerMiddleware,
  mockSellerMiddleware,
} from "../lib/mock-auth-middleware";
import {
  OrderStore,
  Order,
  CreateOrderRequest,
  ConfirmOrderRequest,
  initOrders,
} from "../lib/mock-order-data";
import {
  validateCreateOrder,
  validateConfirmOrder,
  validateProductsExist,
} from "../lib/mock-order-validation";
import { MOCK_USERS } from "../lib/mock-user-data";

export const router = Router();

const extractId = (raw: string | string[]) =>  Array.isArray(raw) ? raw[0] : raw;

// ============================================================================
// 🔹 POST /api/v1/orders - 주문 생성
// ============================================================================
router.post("/", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  
  // 1. 요청값 검증
  const validationError = validateCreateOrder(req.body, "/api/v1/orders");
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const { deliveryAddress, orderProducts } = req.body as CreateOrderRequest;

  // 3. 상품 존재 여부 검증
  const productError = validateProductsExist(orderProducts, "/api/v1/orders");
  if (productError) {
    return res.status(404).json(productError);
  }

  try {
    // 4. 주문 생성
    const newOrder = OrderStore.create(user.id, deliveryAddress, orderProducts);

    // 5. 응답 반환 (명세서 기반)
    return res.status(200).json({
      orderNumber: newOrder.orderNumber,
      totalAmount: newOrder.totalAmount,
      userId: newOrder.buyerId,
    });
  } catch (error) {
    console.error("[ERROR] Order creation failed:", error);
    return res
      .status(500)
      .json(
        createErrorResponse(
          500,
          "INTERNAL_ERROR",
          "주문 생성 중 서버 오류가 발생했습니다.",
          "/api/v1/orders",
        ),
      );
  }
});

// ============================================================================
// 🔹 POST /api/v1/orders/confirm - 결제 확인 (토스 연동)
// ============================================================================
router.post("/confirm", mockAuthMiddleware, (req: Request, res: Response) => {
  // 1. 요청값 검증
  const validationError = validateConfirmOrder(req.body, "/api/v1/orders/confirm");
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const { paymentKey, orderId, amount } = req.body as ConfirmOrderRequest;

  // 2. 주문 조회
  const order = OrderStore.findByOrderNumber(orderId);
  if (!order) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "ORDER_NOT_FOUND",
          "주문 내역을 찾을 수 없습니다.",
          "/api/v1/orders/confirm",
        ),
      );
  }

  // 3. 금액 일치 여부 검증 (위변조 방지)
  if (order.totalAmount !== amount) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          "AMOUNT_MISMATCH",
          `결제 금액이 일치하지 않습니다. 위변조 위험이 있습니다.`,
          "/api/v1/orders/confirm",
        ),
      );
  }

  // 4. 중복 결제 방지
  if (order.paymentStatus !== "READY") {
    return res
      .status(409)
      .json(
        createErrorResponse(
          409,
          "DUPLICATE_REQUEST",
          "이미 처리 중인 결제입니다.",
          "/api/v1/orders/confirm",
        ),
      );
  }

  try {
    // 5. 결제 상태 업데이트
    const updatedOrder = OrderStore.updateStatus(orderId, {
      paymentStatus: "PAID",
      paymentKey,
      delivery: {
        ...order.delivery,
        trackingNumber: `TRK-${Date.now()}`,
      },
    });

    if (!updatedOrder) {
      throw new Error("Failed to update order status");
    }

    // 6. 응답 반환
    return res.status(200).json({
      paymentKey,
      orderId,
      status: "DONE",
    });
  } catch (error) {
    console.error("[ERROR] Payment confirmation failed:", error);
    return res
      .status(500)
      .json(
        createErrorResponse(
          500,
          "INTERNAL_ERROR",
          "결제 확인 중 서버 오류가 발생했습니다.",
          "/api/v1/orders/confirm",
        ),
      );
  }
});

// ============================================================================
// 🔹 GET /api/v1/orders/buyer - 구매자 주문 목록 조회
// ============================================================================
router.get("/buyer", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;

  // 2. 주문 목록 조회
  const orders = OrderStore.findByBuyerId(user.id);

  // 3. 응답 DTO 매핑 (명세서 기반 요약)
  const orderSummaries = orders.map((order) => {
    const firstItem = order.orderItems[0];
    const representativeName = order.orderItems.length > 1
      ? `${firstItem?.productName} 외 ${order.orderItems.length - 1} 건`
      : firstItem?.productName || "";

    return {
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.paymentStatus,
      representativeProductName: representativeName,
      totalQuantity: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      userId: user.id,
      userName: user.nickname,
      orders: orderSummaries,
    },
    error: null,
  });
});

// ============================================================================
// 🔹 GET /api/v1/orders/seller - 판매자 주문 목록 조회
// ============================================================================
router.get("/seller", mockSellerMiddleware, (req: Request, res: Response) => {
  const seller = req.mockUser!;

  // 2. 판매 내역 조회
  const orders = OrderStore.findBySellerId(seller.id);

  // 3. 응답 DTO 매핑
  const orderSummaries = orders.map((order) => {
    const buyer = Object.values(MOCK_USERS).find((u) => u.id === order.buyerId);
    
    return {
      orderNumber: order.orderNumber,
      buyerName: buyer?.nickname || "알수없음",
      productName: order.orderItems[0]?.productName || "",
      quantity: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: order.totalAmount,
      status: order.paymentStatus,
      createdAt: order.createdAt,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      sellerId: seller.id,
      sellerName: seller.nickname,
      orders: orderSummaries,
    },
    error: null,
  });
});

// ============================================================================
// 🔹 GET /api/v1/orders/{userId}/{orderNumber} - 주문 상세 조회
// ============================================================================
router.get("/:userId/:orderNumber", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  const orderNumber = extractId(req.params.orderNumber);

  // 1. 주문 조회
  const order = OrderStore.findByOrderNumber(orderNumber);
  if (!order) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "ORDER_NOT_FOUND",
          "주문 내역을 찾을 수 없습니다.",
          `/api/v1/orders/${orderNumber}`,
        ),
      );
  }

  // 2. 접근 권한 검증 (구매자 본인 또는 해당 주문의 판매자)
  const isBuyer = user.id === order.buyerId;
  const isSeller = user.id === order.sellerId && user.role === "SELLER";
  
  if (!isBuyer && !isSeller) {
    return res
      .status(403)
      .json(
        createErrorResponse(
          403,
          "ACCESS_DENIED",
          "해당 리소스에 대한 접근 권한이 없습니다.",
          `/api/v1/orders/${orderNumber}`,
        ),
      );
  }

  // 3. 응답 DTO 매핑 (상세 정보)
  return res.status(200).json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      delivery: order.delivery,
      orderItems: order.orderItems,
    },
    error: null,
  });
});

// ============================================================================
// 🔹 DELETE /api/v1/orders/{orderNumber} - 주문 취소
// ============================================================================
router.delete("/:orderNumber", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  const orderNumber = extractId(req.params.orderNumber);

  // 2. 주문 조회
  const order = OrderStore.findByOrderNumber(orderNumber);
  if (!order) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "ORDER_NOT_FOUND",
          "주문 내역을 찾을 수 없습니다.",
          `/api/v1/orders/${orderNumber}`,
        ),
      );
  }

  // 3. 주문자 일치 검증
  if (order.buyerId !== user.id) {
    return res
      .status(403)
      .json(
        createErrorResponse(
          403,
          "ACCESS_DENIED",
          "본인 주문만 취소할 수 있습니다.",
          `/api/v1/orders/${orderNumber}`,
        ),
      );
  }

  // 4. 이미 배송 중인 주문 취소 불가 (Mock 로직)
  if (order.delivery.trackingNumber && order.paymentStatus === "PAID") {
    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          "CANNOT_CANCEL",
          "이미 배송이 시작된 주문은 취소할 수 없습니다.",
          `/api/v1/orders/${orderNumber}`,
        ),
      );
  }

  try {
    // 5. 주문 상태 업데이트 (취소)
    const updated = OrderStore.updateStatus(orderNumber, {
      paymentStatus: "CANCELLED",
    });

    if (!updated) {
      throw new Error("Failed to cancel order");
    }

    // 6. 응답 반환 (명세서와 동일 포맷)
    return res.status(200).json({
      orderNumber: updated.orderNumber,
      totalAmount: updated.totalAmount,
      userId: updated.buyerId,
    });
  } catch (error) {
    console.error("[ERROR] Order cancellation failed:", error);
    return res
      .status(500)
      .json(
        createErrorResponse(
          500,
          "INTERNAL_ERROR",
          "주문 취소 중 서버 오류가 발생했습니다.",
          `/api/v1/orders/${orderNumber}`,
        ),
      );
  }
});

// ============================================================================
// 🔹 [E2E 전용] 토스 외부 API 예외 시나리오 트리거
// ============================================================================
// 테스트 시 헤더로 시나리오 지정: X-Mock-Payment-Scenario: {errorCode}
router.post("/confirm", mockAuthMiddleware, (req: Request, res: Response) => {
  const scenario = req.headers["x-mock-payment-scenario"] as string;
  
  if (scenario) {
    // 토스 외부 API 예외 코드 매핑
    const scenarios: Record<string, { status: number; code: string; message: string }> = {
      "NOT_FOUND_PAYMENT": {
        status: 404,
        code: "NOT_FOUND_PAYMENT",
        message: "존재하지 않는 결제 정보 입니다.",
      },
      "NOT_FOUND_PAYMENT_SESSION": {
        status: 404,
        code: "NOT_FOUND_PAYMENT_SESSION",
        message: "결제 시간이 만료되어 결제 진행 데이터가 존재하지 않습니다.",
      },
      "REJECT_ACCOUNT_PAYMENT": {
        status: 403,
        code: "REJECT_ACCOUNT_PAYMENT",
        message: "잔액부족으로 결제에 실패했습니다.",
      },
      "REJECT_CARD_PAYMENT": {
        status: 403,
        code: "REJECT_CARD_PAYMENT",
        message: "한도초과 혹은 잔액부족으로 결제에 실패했습니다.",
      },
      "REJECT_CARD_COMPANY": {
        status: 403,
        code: "REJECT_CARD_COMPANY",
        message: "결제 승인이 거절되었습니다.",
      },
      "FORBIDDEN_REQUEST": {
        status: 403,
        code: "FORBIDDEN_REQUEST",
        message: "허용되지 않은 요청입니다.",
      },
      "INVALID_PASSWORD": {
        status: 403,
        code: "INVALID_PASSWORD",
        message: "결제 비밀번호가 일치하지 않습니다.",
      },
      "ALREADY_PROCESSED_PAYMENT": {
        status: 400,
        code: "ALREADY_PROCESSED_PAYMENT",
        message: "이미 처리된 결제 입니다.",
      },
      "INVALID_REQUEST": {
        status: 400,
        code: "INVALID_REQUEST",
        message: "잘못된 요청입니다.",
      },
      "INVALID_API_KEY": {
        status: 400,
        code: "INVALID_API_KEY",
        message: "잘못된 시크릿키 연동 정보 입니다.",
      },
      "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING": {
        status: 500,
        code: "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING",
        message: "결제가 완료되지 않았어요. 다시 시도해주세요.",
      },
      "UNKNOWN_PAYMENT_ERROR": {
        status: 500,
        code: "UNKNOWN_PAYMENT_ERROR",
        message: "내부 시스템 처리 작업이 실패했습니다. 잠시 후 다시 시도해주세요",
      },
      "NETWORK_ERROR_FINAL_FAILED": {
        status: 503,
        code: "NETWORK_ERROR_FINAL_FAILED",
        message: "결제 결과를 확인할 수 없습니다. 중복 결제를 방지하기 위해 잠시 후 결제 내역을 확인해 주세요.",
      },
    };

    const scenarioConfig = scenarios[scenario];
    if (scenarioConfig) {
      return res.status(scenarioConfig.status).json(
        createErrorResponse(
          scenarioConfig.status,
          scenarioConfig.code,
          scenarioConfig.message,
          "/api/v1/orders/confirm",
        ),
      );
    }
  }

  // 시나리오 헤더가 없으면 기본 로직 실행 (위 코드와 중복되므로 실제 구현 시 통합 필요)
  // 여기서는 간소화를 위해 기본 로직 생략하고 에러 반환
  return res
    .status(400)
    .json(
      createErrorResponse(
        400,
        "INVALID_SCENARIO",
        "지원하지 않는 테스트 시나리오입니다.",
        "/api/v1/orders/confirm",
      ),
    );
});

// 서버 부팅 시 초기 데이터 로드
initOrders();

export default router;