// e2e/mock-server/lib/mock-order-seeds.ts
import { Order } from "./mock-order-data";
import { MOCK_USERS } from "./mock-user-data";

export const ORDER_SEEDS = {
  // 1. 결제 대기 중 (READY) - 상품 2 개 주문
  pending: {
    orderNumber: "ORD-20240422-ABC123",
    buyerId: MOCK_USERS.BUYER.id,
    sellerId: MOCK_USERS.SELLER.id,
    totalAmount: 28000, // ✅ 18000*1 + 10000*1 (스프링 입문 + ABC)
    paymentStatus: "READY" as const,
    delivery: { deliveryAddress: "서울특별시 강남구 테헤란로 123" },
    orderItems: [
      { 
        productId: 1, 
        productName: "스프링 입문", 
        quantity: 1, 
        orderPrice: 18000 // ✅ ProductStore 가격과 일치
      },
      { 
        productId: 2, 
        productName: "ABC", 
        quantity: 1, 
        orderPrice: 10000 
      }
    ],
    createdAt: "2024-04-22T10:30:00",
  },

  // 2. 결제 완료 + 배송 중 (PAID) - 품절 상품 주문 (재고 테스트용)
  paidWithTracking: {
    orderNumber: "ORD-20240420-XYZ789",
    buyerId: MOCK_USERS.BUYER.id,
    sellerId: MOCK_USERS.SELLER.id,
    totalAmount: 25000,
    paymentStatus: "PAID" as const,
    delivery: {
      deliveryAddress: "부산광역시 해운대구 마린시티 456",
      trackingNumber: "TRK-TEST-001"
    },
    orderItems: [
      { 
        productId: 3, 
        productName: "품절된 상품", 
        quantity: 1, 
        orderPrice: 25000 // ✅ ProductStore 가격과 일치
      }
    ],
    createdAt: "2024-04-20T15:20:00",
  },

  // 3. 취소 가능 상태 (PAID, 배송 전) - 상품 1 개 주문
  cancellable: {
    orderNumber: "ORD-20240421-DEF456",
    buyerId: MOCK_USERS.BUYER.id,
    sellerId: MOCK_USERS.SELLER.id,
    totalAmount: 18000, // ✅ 스프링 입문 1 개
    paymentStatus: "PAID" as const,
    delivery: { deliveryAddress: "서울특별시 마포구 월드컵북로 789" },
    orderItems: [
      { 
        productId: 1, 
        productName: "스프링 입문", 
        quantity: 1, 
        orderPrice: 18000 
      }
    ],
    createdAt: "2024-04-21T14:20:00",
  }
} satisfies Record<string, Order>;

export const ORDER_SEEDS_ARRAY = Object.values(ORDER_SEEDS);