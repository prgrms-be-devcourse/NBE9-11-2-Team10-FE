// e2e/mock-server/lib/mock-order-seeds.ts
import { Order } from "./mock-order-data";
import { MOCK_USERS } from "./mock-user-data";

// ✅ 테스트에서 기대하는 정확한 형태 + 서버가 저장할 Order 형태를 합친 단일 데이터 소스
export const ORDER_SEEDS = {
  // 1. 결제 대기 중 (READY)
  pending: {
    orderNumber: "ORD-20240422-ABC123", // ✅ 고정 ID (테스트 예측 가능)
    buyerId: MOCK_USERS.BUYER.id,
    sellerId: MOCK_USERS.SELLER.id,
    totalAmount: 180000, // 110000*1 + 35000*2 계산 일치
    paymentStatus: "READY" as const,
    delivery: { deliveryAddress: "서울특별시 강남구 테헤란로 123" },
    orderItems: [
      { productId: 101, productName: "맥북 에어", quantity: 1, orderPrice: 110000 },
      { productId: 102, productName: "맥북 전용 파우치", quantity: 2, orderPrice: 35000 }
    ],
    createdAt: "2024-04-22T10:30:00",
  },

  // 2. 결제 완료 + 배송 중 (PAID)
  paidWithTracking: {
    orderNumber: "ORD-20240420-XYZ789", // ✅ 고정 ID
    buyerId: MOCK_USERS.BUYER.id,
    sellerId: MOCK_USERS.SELLER.id,
    totalAmount: 35000,
    paymentStatus: "PAID" as const,
    delivery: {
      deliveryAddress: "부산광역시 해운대구 마린시티 456",
      trackingNumber: "TRK-TEST-001"
    },
    orderItems: [
      { productId: 103, productName: "C 타입 허브", quantity: 1, orderPrice: 35000 } // 금액 일치 보정
    ],
    createdAt: "2024-04-20T15:20:00",
  },

  // 3. 취소 가능 상태 (PAID, 배송 전)
  cancellable: {
    orderNumber: "ORD-20240421-DEF456", // ✅ 고정 ID
    buyerId: MOCK_USERS.BUYER.id,
    sellerId: MOCK_USERS.SELLER.id,
    totalAmount: 25000,
    paymentStatus: "PAID" as const,
    delivery: { deliveryAddress: "서울특별시 마포구 월드컵북로 789" },
    orderItems: [
      { productId: 104, productName: "무선 마우스", quantity: 1, orderPrice: 25000 }
    ],
    createdAt: "2024-04-21T14:20:00",
  }
} satisfies Record<string, Order>;

// 테스트에서 쉽게 접근할 수 있도록 배열로도 export
export const ORDER_SEEDS_ARRAY = Object.values(ORDER_SEEDS);