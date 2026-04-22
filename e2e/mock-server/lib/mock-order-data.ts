// e2e/mock-server/lib/mock-order-data.ts
import { MOCK_USERS, MockUser } from "./mock-user-data";

// ============================================================================
// 📦 주문 관련 타입 정의 (명세서 기반)
// ============================================================================
export interface OrderItem {
    productId: number;
    productName: string;
    quantity: number;
    orderPrice: number;
}

export interface OrderDelivery {
    deliveryAddress: string;
    trackingNumber?: string;
}

export interface Order {
    orderNumber: string; // 예: "ORD-20240416-ABC123"
    buyerId: number;
    sellerId: number;
    totalAmount: number;
    paymentStatus: "READY" | "PAID" | "CANCELLED" | "REFUNDED";
    delivery: OrderDelivery;
    orderItems: OrderItem[];
    createdAt: string; // ISO 8601
    updatedAt?: string;
    paymentKey?: string; // 토스 결제 연동용
}

export interface CreateOrderRequest {
    deliveryAddress: string;
    orderProducts: Array<{ productId: number; quantity: number }>;
}

export interface ConfirmOrderRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
}

// ============================================================================
// 🗄️ In-Memory Order Store
// ============================================================================
const orders: Map<string, Order> = new Map();
const orderCounter = { current: 1000 };

// 주문 번호 생성 유틸
export const generateOrderNumber = (): string => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
};

// 상품 정보 모의 데이터 (실제 구현 시 ProductStore 참조)
const MOCK_PRODUCTS: Record<number, { name: string; price: number; sellerId: number }> = {
    101: { name: "맥북 에어", price: 110000, sellerId: 1002 },
    102: { name: "맥북 전용 파우치", price: 35000, sellerId: 1002 },
    103: { name: "C 타입 허브", price: 5000, sellerId: 1002 },
    104: { name: "무선 마우스", price: 25000, sellerId: 1002 },
    105: { name: "키보드 커버", price: 15000, sellerId: 1002 },
};

// 초기 데이터 생성 헬퍼
const createMockOrder = (
    buyerId: number,
    deliveryAddress: string,
    products: Array<{ productId: number; quantity: number }>,
    paymentKey?: string,
): Order => {
    orderCounter.current += 1;

    const orderItems: OrderItem[] = products.map((p) => {
        const product = MOCK_PRODUCTS[p.productId];
        if (!product) {
            throw new Error(`Product ${p.productId} not found`);
        }
        return {
            productId: p.productId,
            productName: product.name,
            quantity: p.quantity,
            orderPrice: product.price,
        };
    });

    // 판매자 ID 는 첫 번째 상품의 판매자로 설정 (단일 판매자 가정)
    const sellerId = orderItems[0] ? MOCK_PRODUCTS[orderItems[0].productId].sellerId : 1002;
    const totalAmount = orderItems.reduce((sum, item) => sum + item.orderPrice * item.quantity, 0);

    return {
        orderNumber: generateOrderNumber(),
        buyerId,
        sellerId,
        totalAmount,
        paymentStatus: paymentKey ? "PAID" : "READY",
        delivery: {
            deliveryAddress,
            trackingNumber: paymentKey ? `TRK-${Date.now()}` : undefined,
        },
        orderItems,
        createdAt: new Date().toISOString(),
        paymentKey,
    };
};

// ============================================================================
// 🛠️ CRUD 헬퍼 함수
// ============================================================================
export const OrderStore = {
    // 🔍 주문 생성
    create: (
        buyerId: number,
        deliveryAddress: string,
        products: Array<{ productId: number; quantity: number }>,
        paymentKey?: string, 
    ): Order => {
        const order = createMockOrder(buyerId, deliveryAddress, products, paymentKey);
        orders.set(order.orderNumber, order);
        return order;
    },

    // 🔍 주문 번호로 조회
    findByOrderNumber: (orderNumber: string): Order | undefined => {
        return orders.get(orderNumber);
    },

    // 🔍 구매자 ID 로 주문 목록 조회
    findByBuyerId: (buyerId: number): Order[] => {
        return Array.from(orders.values()).filter((o) => o.buyerId === buyerId);
    },

    // 🔍 판매자 ID 로 주문 목록 조회
    findBySellerId: (sellerId: number): Order[] => {
        return Array.from(orders.values()).filter((o) => o.sellerId === sellerId);
    },

    // ✏️ 주문 상태 업데이트 (결제 확인, 취소 등)
    updateStatus: (
        orderNumber: string,
        updates: Partial<Pick<Order, "paymentStatus" | "paymentKey" | "delivery">>,
    ): Order | null => {
        const order = orders.get(orderNumber);
        if (!order) return null;

        const updated = {
            ...order,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        orders.set(orderNumber, updated);
        return updated;
    },

    // 🗑️ 주문 삭제 (취소)
    delete: (orderNumber: string): boolean => {
        return orders.delete(orderNumber);
    },

    // 🔍 결제 키로 주문 조회 (토스 연동용)
    findByPaymentKey: (paymentKey: string): Order | undefined => {
        return Array.from(orders.values()).find((o) => o.paymentKey === paymentKey);
    },

    // 🔄 데이터 초기화 (E2E 테스트용)
    reset: () => {
        orders.clear();
        orderCounter.current = 1000;
    },

    // 📊 통계 (테스트용)
    stats: () => ({
        totalOrders: orders.size,
        byStatus: {
            READY: Array.from(orders.values()).filter((o) => o.paymentStatus === "READY").length,
            PAID: Array.from(orders.values()).filter((o) => o.paymentStatus === "PAID").length,
            CANCELLED: Array.from(orders.values()).filter((o) => o.paymentStatus === "CANCELLED").length,
        },
    }),
};

// 서버 부팅 시 초기 데이터 로드 (선택)
export const initOrders = () => {
    OrderStore.reset();

    // 테스트용 샘플 주문 2 개 생성
    if (MOCK_USERS.BUYER && MOCK_USERS.SELLER) {
        OrderStore.create(
            MOCK_USERS.BUYER.id,
            "서울특별시 강남구 테헤란로 123",
            [{ productId: 101, quantity: 1 }, { productId: 102, quantity: 2 }],
        );

        const paidOrder = OrderStore.create(
            MOCK_USERS.BUYER.id,
            "부산광역시 해운대구 마린시티 456",
            [{ productId: 103, quantity: 1 }],
            "paymentkey_test_12345",
        );
        OrderStore.updateStatus(paidOrder.orderNumber, {
            paymentStatus: "PAID",
            delivery: {
                deliveryAddress: paidOrder.delivery.deliveryAddress,
                trackingNumber: "TRK-TEST-001",
            },
        });
    }
};