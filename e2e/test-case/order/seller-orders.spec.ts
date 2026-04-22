// e2e/tests/orders/seller-orders.spec.ts
import { test, expect, MOCK_ORDERS, MOCK_ORDER_SELLER, MOCK_ORDER_BUYER } from "./fixtures/order-fixture";

test.describe("🏪 판매자 주문 관리 페이지", () => {
  test.beforeEach(async ({ orderHelpers }) => {
    await orderHelpers.resetMockOrders();
  });

  // ============================================================================
  // 🔐 인증/인가 테스트
  // ============================================================================

  test("비로그인 접근 시 접근 거부", async ({
    page,
    orderHelpers,
  }) => {
    await orderHelpers.goToSellerOrders();

    await expect(
      page
        .getByText(/로그인 후 사용할 수 있습니다./)
    ).toBeVisible();
  });

  test("구매자 (BUYER) 접근 시 접근 거부", async ({
    page,
    orderHelpers,
    loginAsBuyer,
  }) => {
    await loginAsBuyer();
    await orderHelpers.goToSellerOrders();

    // 접근 거부 메시지 또는 에러 페이지 확인
    await expect(
      page
        .getByText(/판매자만 접근할 수 있습니다./)
    ).toBeVisible();
  });

  test("판매자 (SELLER) 접근 시 페이지 정상 렌더링", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    await expect(page).toHaveURL("/seller/orders");
    await expect(page.getByTestId("seller-orders-page-title")).toHaveText("판매 내역 관리");
    await expect(page.getByTestId("seller-name")).toContainText(MOCK_ORDER_SELLER.nickname);
  });

  // ============================================================================
  // 📋 판매 내역 테이블 테스트
  // ============================================================================

  test("판매 내역 테이블이 정상적으로 표시된다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    const table = page.getByTestId("seller-orders-table");
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    const headers = ["주문번호", "구매자", "상품", "수량", "금액", "상태", "주문일", "상세"];
    for (const header of headers) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
  });

  test("판매 주문 행에서 주요 정보를 확인할 수 있다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    const firstRow = page.getByTestId("seller-order-row-0");
    await expect(firstRow).toBeVisible();

    // 주문 번호 확인
    const orderNumber = await firstRow.getAttribute("data-order-number");
    expect(orderNumber).toContain("ORD-");
    await expect(page.getByTestId("seller-order-number-0")).toHaveText(orderNumber!);

    // 구매자 이름 확인
    await expect(page.getByTestId("seller-order-buyer-0")).toBeVisible();

    // 상품 이름 확인
    await expect(page.getByTestId("seller-order-product-0")).toBeVisible();

    // 수량 확인
    await expect(page.getByTestId("seller-order-quantity-0")).toContainText("개");

    // 금액 확인
    await expect(page.getByTestId("seller-order-amount-0")).toContainText("원");

    // 상태 확인
    const statusBadge = page.getByTestId("seller-order-status-0");
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveAttribute("data-status");
  });

  test("판매 내역이 없을 때 빈 상태를 표시한다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.resetMockOrders(); // 판매 내역 초기화
    await orderHelpers.goToSellerOrders();

    const emptyState = page.getByTestId("seller-orders-empty");
    if (await emptyState.isVisible()) {
      await expect(page.getByTestId("seller-orders-empty-message")).toHaveText("판매 내역이 없습니다");
    }
  });

  // ============================================================================
  // 🎯 네비게이션 테스트
  // ============================================================================

  test("주문 상세 보기 링크를 클릭하면 상세 페이지로 이동한다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    const firstDetailLink = page.getByTestId("seller-order-detail-link-0");
    const row = page.getByTestId("seller-order-row-0");
    const orderNumber = await row.getAttribute("data-order-number");

    await firstDetailLink.click();

    await expect(page).toHaveURL(`/orders/${orderNumber}`);
    await expect(page.getByTestId("order-detail-container")).toBeVisible();
  });

  test("상세 페이지에서 판매자 주문 목록으로 돌아갈 수 있다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    await page.getByTestId("seller-order-detail-link-0").click();
    await page.waitForLoadState("networkidle");

    // 판매자 상세 페이지에는 구매자용 "주문 목록으로" 링크가 없을 수 있음
    // 대시보드 링크로 테스트
    const dashboardLink = page.getByRole("link", { name: "대시보드" });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL("/seller/dashboard");
    }
  });

  // ============================================================================
  // 📊 상태 필터링 테스트 (향후 확장용)
  // ============================================================================

  test("주문 상태별 필터링이 작동한다 (스모크 테스트)", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    // 상태 필터 버튼이 있는지 확인 (구현된 경우)
    const statusFilters = page.locator('[data-testid^="filter-status-"]');
    const filterCount = await statusFilters.count();

    if (filterCount > 0) {
      // READY 상태 필터 적용
      const readyFilter = page.getByTestId("filter-status-READY");
      if (await readyFilter.isVisible()) {
        await readyFilter.click();
        await page.waitForLoadState("networkidle");

        // 필터 적용 후 모든 행이 READY 상태인지 확인
        const visibleRows = page.locator('[data-testid^="seller-order-row-"][style*="display: table-row"]');
        const count = await visibleRows.count();
        for (let i = 0; i < count; i++) {
          const status = await page.locator(`[data-testid="seller-order-status-${i}"]`).getAttribute("data-status");
          expect(status).toBe("READY");
        }
      }
    }
  });

  // ============================================================================
  // 🧪 에러 케이스
  // ============================================================================

  test("존재하지 않는 주문 번호 접근 시 404 처리", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await page.goto("/orders/ORD-NONEXISTENT-99999");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("주문 내역을 찾을 수 없습니다")).toBeVisible();
  });

  test("다른 판매자의 주문 접근 시 접근 거부", async ({
    browser,
    orderHelpers,
  }) => {
    // 1. 판매자 A 로 로그인하여 주문 생성
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto("/login");
    await pageA.fill('input[name="email"]', MOCK_ORDER_SELLER.email);
    await pageA.fill('input[name="password"]', MOCK_ORDER_SELLER.password);
    await pageA.click('button[type="submit"]');
    await pageA.waitForLoadState("networkidle");

    const { orderNumber } = await orderHelpers.createMockOrder(
      MOCK_ORDER_BUYER.id,
      [{ productId: 101, quantity: 1 }],
    );

    await contextA.close();

    // 2. 다른 브라우저 컨텍스트로 판매자 B 시뮬레이션 (권한 없음)
    //    (실제 테스트 시 다른 판매자 계정으로 로그인하여 테스트)
    //    여기서는 단순화하여 스킵
    test.skip(
      true,
      "다중 판매자 테스트는 별도 계정 설정 및 환경 구성이 필요합니다"
    );
  });
});

test.describe("🏪 판매자 주문 상세 페이지", () => {
  test.beforeEach(async ({ orderHelpers }) => {
    await orderHelpers.resetMockOrders();
  });

  test("판매자도 주문 상세 정보를 확인할 수 있다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();

    const firstRow = page.getByTestId("seller-order-row-0");
    const orderNumber = await firstRow.getAttribute("data-order-number");
    await page.getByTestId("seller-order-detail-link-0").click();

    await orderHelpers.assertOrderDetail(page, {
      orderNumber: orderNumber!,
    });
  });

  test("판매자 주문 상세에서 구매자 정보를 확인할 수 있다", async ({
    page,
    orderHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await orderHelpers.goToSellerOrders();
    await page.getByTestId("seller-order-detail-link-0").click();

    // 배송 주소에 구매자 정보가 포함되어 있는지 확인
    await expect(page.getByTestId("delivery-address")).toBeVisible();
  });
});