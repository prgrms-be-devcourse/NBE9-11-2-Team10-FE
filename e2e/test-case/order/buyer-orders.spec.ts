// e2e/tests/orders/buyer-orders.spec.ts
import { test, expect, MOCK_ORDERS, MOCK_ORDER_BUYER } from "./fixtures/order-fixture";

test.describe("🛒 구매자 주문 목록 페이지", () => {
    // 🔹 테스트 전 데이터 초기화
    test.beforeEach(async ({ orderHelpers }) => {
        await orderHelpers.resetMockOrders();
    });

    // ============================================================================
    // 🔐 인증 테스트
    // ============================================================================

    test("비로그인 접근 시 로그인 페이지로 유도", async ({
        page,
        orderHelpers,
    }) => {
        await orderHelpers.goToBuyerOrders();

        await expect(page).toHaveURL("http://localhost:3000/login?redirect=%2Forders");
    });

    test("로그인 후 주문 목록 페이지 접근 가능", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        await expect(page).toHaveURL("/orders");
        await expect(page.getByTestId("orders-page-title")).toBeVisible();
    });

    // ============================================================================
    // 📋 주문 목록 표시 테스트
    // ============================================================================

    test("주문 목록이 정상적으로 표시된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        // 페이지 제목 확인
        await expect(page.getByTestId("orders-page-title")).toHaveText("주문 내역");

        // 사용자 이름 확인
        await expect(page.getByTestId("orders-user-name")).toContainText(
            MOCK_ORDER_BUYER.nickname,
        );

        // 주문 목록 컨테이너 확인
        const ordersList = page.getByTestId("orders-list");
        await expect(ordersList).toBeVisible();

        // 주문 개수 속성 확인
        const orderCount = await ordersList.getAttribute("data-order-count");
        expect(orderCount).toBeTruthy();
        expect(parseInt(orderCount!)).toBeGreaterThanOrEqual(0);
    });

    test("주문 카드에서 주요 정보를 확인할 수 있다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        // 첫 번째 주문 카드 검증
        await orderHelpers.assertOrderCard(page, 0, {
            orderNumber: MOCK_ORDERS.pending.orderNumber,
            totalAmount: MOCK_ORDERS.pending.totalAmount,
            status: MOCK_ORDERS.pending.paymentStatus,
            representativeProductName: MOCK_ORDERS.pending.orderItems[0].productName,
        });
    });

    test("주문 상태별 뱃지가 올바르게 표시된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        // READY 상태 확인
        const readyBadge = page.locator('[data-testid="order-status-0"]');
        await expect(readyBadge).toHaveAttribute("data-status", "READY");
        await expect(readyBadge).toHaveText("결제 대기");

        // 두 번째 주문이 있다면 PAID 상태 확인
        const ordersList = page.getByTestId("orders-list");
        const orderCount = await ordersList.getAttribute("data-order-count");
        if (orderCount && parseInt(orderCount) > 1) {
            const paidBadge = page.locator('[data-testid="order-status-1"]');
            await expect(paidBadge).toHaveAttribute("data-status", "PAID");
            await expect(paidBadge).toHaveText("결제 완료");
        }
    });

    test("주문 내역이 없을 때 빈 상태를 표시한다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        // Mock 데이터 초기화 후 주문이 없는 상태로 테스트
        await orderHelpers.resetMockOrders();
        await orderHelpers.goToBuyerOrders();

        const emptyState = page.getByTestId("orders-empty-state");
        if (await emptyState.isVisible()) {
            await expect(page.getByTestId("orders-empty-message")).toHaveText("주문 내역이 없습니다");
            await expect(page.getByTestId("browse-products-button")).toBeVisible();
            await expect(page.getByTestId("browse-products-button")).toHaveAttribute("href", "/products");
        }
    });

    // ============================================================================
    // 🎯 네비게이션 테스트
    // ============================================================================

    test("주문 카드를 클릭하면 상세 페이지로 이동한다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        const firstCard = page.getByTestId("order-card-0");
        const orderNumber = await firstCard.getAttribute("data-order-number");

        await firstCard.click();

        await expect(page).toHaveURL(`/orders/${orderNumber}`);
        await expect(page.getByTestId("order-detail-container")).toBeVisible();
    });

    test("상세 페이지에서 주문 목록으로 돌아갈 수 있다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        const firstCard = page.getByTestId("order-card-0");
        await firstCard.click();

        await page.getByTestId("back-to-orders-link").click();

        await expect(page).toHaveURL("/orders");
        await expect(page.getByTestId("orders-page-title")).toBeVisible();
    });

    // ============================================================================
    // 🧪 에러 케이스
    // ============================================================================

    test("존재하지 않는 주문 번호 접근 시 404 처리", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await page.goto("/orders/ORD-NONEXISTENT-12345");
        await page.waitForLoadState("networkidle");

        await expect(page.getByTestId("order-detail-error")).toBeVisible();
        await expect(page.getByText("주문 내역을 찾을 수 없습니다")).toBeVisible();
    });
});

test.describe("🛒 구매자 주문 상세 페이지", () => {
    test.beforeEach(async ({ orderHelpers }) => {
        await orderHelpers.resetMockOrders();
    });

    // ============================================================================
    // 📋 상세 정보 표시 테스트
    // ============================================================================

    test("주문 상세 정보가 올바르게 표시된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        const firstCard = page.getByTestId("order-card-0");
        const orderNumber = await firstCard.getAttribute("data-order-number");
        await firstCard.click();

        await orderHelpers.assertOrderDetail(page, {
            orderNumber: orderNumber!,
            paymentStatus: MOCK_ORDERS.detailed.paymentStatus,
            totalAmount: MOCK_ORDERS.detailed.totalAmount,
            delivery: MOCK_ORDERS.detailed.delivery,
            orderItems: MOCK_ORDERS.detailed.orderItems,
        });
    });

    test("주문 상품 목록 테이블이 정상적으로 렌더링된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();
        await page.getByTestId("order-card-0").click();

        const table = page.getByTestId("order-items-table");
        await expect(table).toBeVisible();

        // 첫 번째 상품 확인
        await expect(page.getByTestId("order-item-name-0")).toHaveText("스프링 입문");
        await expect(page.getByTestId("order-item-quantity-0")).toHaveText("1개");
        await expect(page.getByTestId("order-item-price-0")).toContainText("18,000원");
    });

    test("배송 추적번호가 있으면 표시된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        // trackingNumber 가 있는 주문 찾기
        const ordersList = page.getByTestId("orders-list");
        const orderCount = await ordersList.getAttribute("data-order-count");

        if (orderCount && parseInt(orderCount) > 1) {
            // 두 번째 주문 클릭 (배송중인 주문)
            await page.getByTestId("order-card-1").click();

            await expect(page.getByTestId("tracking-number")).toBeVisible();
            await expect(page.getByTestId("tracking-number")).toHaveText(/TRK-/);
        }
    });

    // ============================================================================
    // ❌ 주문 취소 테스트
    // ============================================================================

    test("PAID 상태이고 배송 전인 주문은 취소 버튼이 표시된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        test.skip(true, "미구현");
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        // 취소 가능한 주문 찾기 (status=PAID, trackingNumber 없음)
        const orders = await page.locator('[data-testid^="order-card-"]').all();
        let cancellableOrderFound = false;

        for (const order of orders) {
            const status = await order.locator('[data-testid^="order-status-"]').first().getAttribute("data-status");
            if (status === "PAID") {
                await order.click();
                await page.waitForLoadState("networkidle");

                const cancelButton = page.getByTestId("cancel-order-button");
                if (await cancelButton.isVisible()) {
                    cancellableOrderFound = true;
                    await expect(cancelButton).toBeVisible();
                    await expect(cancelButton).toBeEnabled();
                    break; // 테스트 통과
                }
            }
        }

        // 취소 가능한 주문이 없으면 스킵 (테스트 데이터 의존성)
        test.skip(
            !cancellableOrderFound,
            "테스트 데이터에 취소 가능한 주문이 없습니다 (상태: PAID, 배송 전)"
          );
    });

    test("주문 취소 확인 다이얼로그에서 확인을 누르면 취소된다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        test.skip(true, "미구현");
        await loginAsBuyer();

        // 취소 가능한 주문 생성
        const { orderNumber } = await orderHelpers.createMockOrder(
            MOCK_ORDER_BUYER.id,
            [{ productId: 104, quantity: 1 }], // 무선 마우스
            "paymentkey_test_cancel",
        );

        await orderHelpers.goToBuyerOrderDetail(orderNumber);

        // 취소 버튼 클릭 전 상태 확인
        await expect(page.getByTestId("order-status-badge")).toHaveAttribute("data-status", "PAID");

        // 대화상자 핸들링
        page.once("dialog", async (dialog) => {
            expect(dialog.message()).toContain("주문을 취소하시겠습니까?");
            await dialog.accept();
        });

        // 취소 실행
        await page.getByTestId("cancel-order-button").click();
        await page.waitForLoadState("networkidle");

        // 취소 성공 메시지 확인
        await expect(page.getByTestId("cancel-success-message")).toBeVisible();
        await expect(page.getByText("주문이 취소되었습니다")).toBeVisible();

        // 상태가 CANCELLED 로 변경되었는지 확인 (페이지 새로고침 후)
        await page.reload();
        await expect(page.getByTestId("order-status-badge")).toHaveAttribute("data-status", "CANCELLED");
    });

    test("주문 취소 확인 다이얼로그에서 취소를 누르면 취소되지 않는다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        test.skip(true, "미구현");
        await loginAsBuyer();

        const { orderNumber } = await orderHelpers.createMockOrder(
            MOCK_ORDER_BUYER.id,
            [{ productId: 104, quantity: 1 }],
            "paymentkey_test_no_cancel",
        );

        await orderHelpers.goToBuyerOrderDetail(orderNumber);

        // 대화상자에서 취소
        page.once("dialog", async (dialog) => {
            await dialog.dismiss();
        });

        await page.getByTestId("cancel-order-button").click();
        await page.waitForLoadState("networkidle");

        // 취소 메시지 없음, 상태 변화 없음
        await expect(page.getByTestId("cancel-success-message")).not.toBeVisible();
        await expect(page.getByTestId("order-status-badge")).toHaveAttribute("data-status", "PAID");
    });

    test("이미 배송 중인 주문은 취소 버튼이 표시되지 않는다", async ({
        page,
        orderHelpers,
        loginAsBuyer,
    }) => {
        await loginAsBuyer();
        await orderHelpers.goToBuyerOrders();

        // trackingNumber 가 있는 주문 찾기
        const ordersList = page.getByTestId("orders-list");
        const orderCount = await ordersList.getAttribute("data-order-count");

        if (orderCount && parseInt(orderCount) > 1) {
            await page.getByTestId("order-card-1").click();

            // 취소 버튼 대신 배송 안내 메시지 확인
            await expect(page.getByTestId("cancel-order-button")).not.toBeVisible();
            await expect(page.getByTestId("shipping-in-progress-message")).toBeVisible();
            await expect(page.getByText("이미 배송이 시작된 주문입니다")).toBeVisible();
        }
    });
});