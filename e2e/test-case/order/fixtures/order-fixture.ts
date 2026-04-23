// e2e/tests/fixtures/order-fixture.ts
import { test as base, expect, Page } from "@playwright/test";
import { MOCK_USERS, MockUser } from "@/../e2e/mock-server/lib/mock-user-data";
import { ORDER_SEEDS } from "../../../mock-server/lib/mock-order-seeds";

// ============================================================================
// 📦 타입 정의: 테스트 어설션용 (유연한 타입)
// ============================================================================
export interface OrderSummary {
    orderNumber: string;
    totalAmount: number;
    status: string;
    representativeProductName: string;
    totalQuantity: number;
    createdAt: string;
    trackingNumber?: string;
  }
  
  export interface OrderDetail {
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    delivery: {
      deliveryAddress: string;
      trackingNumber?: string;
    };
    orderItems: Array<{
      productId: number;
      productName: string;
      quantity: number;
      orderPrice: number;
    }>;
  }
  
// ============================================================================
// 📦 Mock 데이터: 실제 값은 as const 유지 (테스트용 상수)
// ============================================================================
// ✅ 어설션용 타입과 분리하여 정의
export const MOCK_ORDERS = {
  pending: ORDER_SEEDS.pending,
  paidWithTracking: ORDER_SEEDS.paidWithTracking,
  detailed: ORDER_SEEDS.pending, // 상세 조회 테스트용 (첫 번째 주문 사용)
  cancellable: ORDER_SEEDS.cancellable,
} as const;

// ============================================================================
// 👤 주문 관련 사용자 (기존 MOCK_USERS 재사용)
// ============================================================================
export const MOCK_ORDER_BUYER = MOCK_USERS.BUYER;
export const MOCK_ORDER_SELLER = MOCK_USERS.SELLER;

// ============================================================================
// 🛠️ 커스텀 픽스처: 주문 관련 헬퍼 메서드
// ============================================================================
export const test = base.extend<{
  orderHelpers: {
    // 🔹 구매자 주문 목록 페이지 이동
    goToBuyerOrders: () => Promise<void>;
    // 🔹 구매자 주문 상세 페이지 이동
    goToBuyerOrderDetail: (orderNumber: string) => Promise<void>;
    // 🔹 판매자 주문 관리 페이지 이동
    goToSellerOrders: () => Promise<void>;
    // 🔹 판매자 주문 상세 페이지 이동
    goToSellerOrderDetail: (orderNumber: string) => Promise<void>;
    // 🔹 주문 카드 내용 검증 (목록 페이지용)
    assertOrderCard: (
      page: Page,
      index: number,
      expected: Partial<OrderSummary>,
    ) => Promise<void>;
    // 🔹 주문 상세 정보 검증
    assertOrderDetail: (
      page: Page,
      expected: Partial<OrderDetail>,
    ) => Promise<void>;
    // 🔹 Mock 주문 데이터 초기화
    resetMockOrders: () => Promise<void>;
    // 🔹 주문 생성 (Mock 서버 직접 호출 - 테스트 데이터 준비용)
    createMockOrder: (
      buyerId: number,
      products: Array<{ productId: number; quantity: number }>,
      paymentKey?: string,
    ) => Promise<{ orderNumber: string }>;
  };
  loginAsBuyer: () => Promise<void>;
  loginAsSeller: () => Promise<void>;
}>({
  orderHelpers: async ({ page }, use) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const helpers = {
      // 🔹 구매자 주문 목록 페이지 이동
      goToBuyerOrders: async () => {
        await page.goto("/orders");
        await page.waitForLoadState("networkidle");
      },

      // 🔹 구매자 주문 상세 페이지 이동
      goToBuyerOrderDetail: async (orderNumber: string) => {
        await page.goto(`/orders/${orderNumber}`);
        await page.waitForLoadState("networkidle");
      },

      // 🔹 판매자 주문 관리 페이지 이동
      goToSellerOrders: async () => {
        await page.goto("/seller/orders");
        await page.waitForLoadState("networkidle");
      },

      // 🔹 판매자 주문 상세 페이지 이동
      goToSellerOrderDetail: async (orderNumber: string) => {
        await page.goto(`/seller/orders/${orderNumber}`);
        await page.waitForLoadState("networkidle");
      },

      // 🔹 주문 카드 내용 검증 (수정됨)
      assertOrderCard: async (
        page: Page,
        index: number,
        expected: Partial<OrderSummary>, // ✅ Partial<OrderSummary> 사용
      ) => {
        const card = page.locator(`[data-testid="order-card-${index}"]`);
        await expect(card).toBeVisible();

        if (expected.orderNumber) {
          await expect(page.locator(`[data-testid="order-number-${index}"]`)).toHaveText(
            expected.orderNumber,
          );
        }
        if (expected.totalAmount) {
          await expect(page.locator(`[data-testid="order-total-amount-${index}"]`)).toContainText(
            expected.totalAmount.toLocaleString(),
          );
        }
        if (expected.status) {
          const statusBadge = page.locator(`[data-testid="order-status-${index}"]`);
          await expect(statusBadge).toBeVisible();
          await expect(statusBadge).toHaveAttribute("data-status", expected.status);
        }
        if (expected.representativeProductName) {
          await expect(
            page.locator(`[data-testid="order-product-name-${index}"]`),
          ).toContainText(expected.representativeProductName);
        }
      },

      // 🔹 주문 상세 정보 검증 (수정됨)
      assertOrderDetail: async (
        page: Page,
        expected: Partial<OrderDetail>, // ✅ Partial<OrderDetail> 사용
      ) => {
        const container = page.locator('[data-testid="order-detail-container"]');
        await expect(container).toBeVisible();

        if (expected.orderNumber) {
          await expect(page.getByTestId("order-number")).toHaveText(
            `주문번호: ${expected.orderNumber}`,
          );
        }
        if (expected.paymentStatus) {
          const badge = page.getByTestId("order-status-badge");
          await expect(badge).toBeVisible();
          await expect(badge).toHaveAttribute("data-status", expected.paymentStatus);
        }
        if (expected.totalAmount) {
          await expect(page.getByTestId("total-amount")).toContainText(
            expected.totalAmount.toLocaleString(),
          );
        }
        if (expected.delivery?.deliveryAddress) {
          await expect(page.getByTestId("delivery-address")).toContainText(
            expected.delivery.deliveryAddress,
          );
        }
        if (expected.delivery?.trackingNumber) {
          await expect(page.getByTestId("tracking-number")).toHaveText(
            expected.delivery.trackingNumber,
          );
        }
        if (expected.orderItems?.length) {
          await expect(page.getByTestId("order-items-table")).toBeVisible();
          for (let i = 0; i < expected.orderItems.length; i++) {
            const item = expected.orderItems[i];
            await expect(page.locator(`[data-testid="order-item-name-${i}"]`)).toHaveText(
              item.productName,
            );
            await expect(page.locator(`[data-testid="order-item-quantity-${i}"]`)).toHaveText(
              `${item.quantity}개`,
            );
          }
        }
      },

      // 🔹 Mock 주문 데이터 초기화
      resetMockOrders: async () => {
        await page.request.post(`${API_BASE}/api/v1/__reset`);
        await page.waitForTimeout(100); // 리셋 완료 대기
      },

      // 🔹 테스트용 주문 생성 (Mock 서버 직접 호출)
      createMockOrder: async (
        buyerId: number,
        products: Array<{ productId: number; quantity: number }>,
        paymentKey?: string,
      ) => {
        const response = await page.request.post(`${API_BASE}/api/v1/orders`, {
          data: {
            userId: buyerId,
            deliveryAddress: "서울특별시 테스트 주소",
            orderProducts: products,
          },
          headers: {
            "x-e2e-user-id": String(buyerId),
          },
        });
        expect(response.status()).toBe(200);
        return response.json() as Promise<{ orderNumber: string }>;
      },
    };

    await use(helpers);
  },

  // 🔹 구매자로 로그인 편의 함수
  loginAsBuyer: async ({ page }, use) => {
    await use(async () => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="email"]', MOCK_ORDER_BUYER.email);
      await page.fill('input[name="password"]', MOCK_ORDER_BUYER.password);

      const responsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200,
      );

      await page.click('button[type="submit"]');
      await responsePromise;
      await page.waitForURL(/^(?!.*\/login)/);
      await page.waitForLoadState("networkidle");

      await expect(page.getByText(`${MOCK_ORDER_BUYER.nickname} 님`)).toBeVisible();
    });
  },

  // 🔹 판매자로 로그인 편의 함수
  loginAsSeller: async ({ page }, use) => {
    await use(async () => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="email"]', MOCK_ORDER_SELLER.email);
      await page.fill('input[name="password"]', MOCK_ORDER_SELLER.password);

      const responsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200,
      );

      await page.click('button[type="submit"]');
      await responsePromise;
      await page.waitForURL(/^(?!.*\/login)/);
      await page.waitForLoadState("networkidle");

      await expect(page.getByText(`${MOCK_ORDER_SELLER.nickname} 님`)).toBeVisible();
    });
  },
});

export { expect };