// e2e/tests/orders/payment-flow-simple.spec.ts

import { test, expect } from "./fixtures/mock-payment-fixture";

// ============================================================================
// 📦 테스트 데이터 (mock-product-data.ts 와 일치)
// ============================================================================
const TEST_PRODUCT = {
  id: 1,
  name: "스프링 입문",
  description: "자바 스프링 프레임워크 기초 가이드",
  price: 18000,
} as const;

const TEST_DELIVERY = {
  roadAddress: "서울특별시 강남구 테헤란로 123",
  detailAddress: "456 호",
  recipientName: "홍길동",
  recipientPhone: "010-1234-5678",
  customerEmail: "test@example.com",
};

// ============================================================================
// 🎯 1 단계: 주문 폼 제출 → 결제 페이지 리다이렉트 검증
// ============================================================================
test.describe("📋 1 단계: 주문 폼 제출 및 리다이렉트", () => {
  
  test.beforeEach(async ({ mockPayment, page }) => {
    await mockPayment.resetMockData();
  });

  test("주문 폼 제출 후 결제 페이지로 올바른 파라미터와 함께 리다이렉트된다", async ({ page, goToAsBuyer }) => {
    // 1. 상품 상세 → 주문 페이지 이동
    await goToAsBuyer(`/products/${TEST_PRODUCT.id}`);
    await page.click(`[data-testid="product-buy-button-${TEST_PRODUCT.id}"]`);
    await page.waitForURL("/orders/new**");

    // 2. 배송 정보 입력
    await page.fill('input[name="roadAddress"]', TEST_DELIVERY.roadAddress);
    await page.fill('input[name="detailAddress"]', TEST_DELIVERY.detailAddress);
    await page.fill('input[name="recipientName"]', TEST_DELIVERY.recipientName);
    await page.fill('input[name="recipientPhone"]', TEST_DELIVERY.recipientPhone);
    await page.fill('input[name="customerEmail"]', TEST_DELIVERY.customerEmail);

    // 3. 주문 제출 및 리다이렉트 대기
    await page.click('button[type="submit"]');
    
    // ✅ 검증: /orders/payment 으로 이동했는지 + 필수 쿼리 파라미터가 있는지
    await page.waitForURL(/\/orders\/payment/);
    const currentUrl = new URL(page.url());
    
    // 필수 파라미터 존재 확인
    expect(currentUrl.searchParams.get('orderId')).toMatch(/^ORD-\d{8}-/);
    expect(currentUrl.searchParams.get('amount')).toBe('18000'); // TEST_PRODUCT.price
    expect(currentUrl.searchParams.get('name')).toBeTruthy();
    expect(currentUrl.searchParams.get('phone')).toBeTruthy();
    expect(currentUrl.searchParams.get('email')).toBeTruthy();
  });
});

test.describe("✅ 결제 성공 페이지 (/payment/confirm)", () => {
  
  test.beforeEach(async ({ mockPayment }) => {
    await mockPayment.resetMockData();
    // ✅ 시나리오 설정: 테스트 코드 → Mock Server 직접 호출
    await mockPayment.setPaymentScenario("SUCCESS");
  });

  test("올바른 파라미터로 confirm 페이지 접근 시 결제 완료", async ({ page, goToAsBuyer }) => {
    // 임의의 주문번호로 직접 접근 (Mock Server 가 SUCCESS 시나리오면 조회 스킵)
    await goToAsBuyer(
      `/orders/payment/confirm?paymentKey=mock_key&orderId=ORD-TEST-12345&amount=18000`
    );
    
    await expect(page.getByText("결제가 완료되었습니다!")).toBeVisible();
    await expect(page.locator(".font-mono.font-semibold")).toContainText("ORD-TEST-12345");
  });
});

test.describe("❌ 결제 실패 페이지", () => {
  test("카드 한도 초과 시나리오", async ({ page, goToAsBuyer, mockPayment }) => {
    await mockPayment.resetMockData();
    await mockPayment.setPaymentScenario("REJECT_CARD_PAYMENT");
    
    await goToAsBuyer(
      `/orders/payment/confirm?paymentKey=test&orderId=ORD-TEST-999&amount=18000`
    );
    
    await page.waitForTimeout(2500);
    
    await expect(page.getByRole("heading", { name: "결제 실패" })).toBeVisible();
    await expect(page.getByText("한도초과 혹은 잔액부족")).toBeVisible();
  });
});

// ============================================================================
// 🎯 4 단계: 엣지 케이스 (파라미터 누락/변조)
// ============================================================================
test.describe("⚠️ 엣지 케이스: 파라미터 검증", () => {
  
  test("필수 파라미터가 누락된 confirm 페이지 접근", async ({ page, goToAsBuyer }) => {
    await goToAsBuyer("/orders/payment/confirm"); // 파라미터 없음
    
    // 에러 처리 확인 (구현에 따라 다름)
    await expect(page.getByText(/결제 정보가 올바르지 않습니다|필수 파라미터 누락/)).toBeVisible();
  });

  test("amount 가 숫자가 아닌 경우", async ({ page, goToAsBuyer }) => {
    await goToAsBuyer(
      "/orders/payment/confirm?paymentKey=test&orderId=ORD-123&amount=invalid"
    );
    
    await expect(page.getByText(/결제 금액이 올바르지 않습니다/)).toBeVisible();
  });

  test("amount 가 0 또는 음수인 경우", async ({ page, goToAsBuyer }) => {
    await goToAsBuyer(
      "/orders/payment/confirm?paymentKey=test&orderId=ORD-123&amount=0"
    );
    
    await expect(page.getByText(/결제 금액이 올바르지 않습니다/)).toBeVisible();
  });

  test("fail 페이지에서 메시지 인코딩 처리 (XSS 안전성)", async ({ page, goToAsBuyer }) => {
    const specialMessage = "에러 메시지: <script>alert('xss')</script> & 특수문자";
    
    await goToAsBuyer(
      `/orders/payment/fail?code=TEST&message=${encodeURIComponent(specialMessage)}&orderId=ORD-123`
    );
    
    // ✅ 1. 기본 메시지 표시 확인
    await expect(page.getByRole("heading", { name: "결제 실패" })).toBeVisible();
    
    // ✅ 2. [핵심] 스크립트 태그가 실행되지 않고 텍스트로 표시되는지 확인
    //    React 는 기본적으로 자식 문자열을 자동 이스케이프하므로, 
    //    <script> 는 실행되지 않고 그대로 텍스트로 렌더링됨
    await expect(page.getByText("<script>alert('xss')</script>")).toBeVisible();
    
    // ✅ 3. & 기호도 정상 출력 확인
    await expect(page.getByText("& 특수문자")).toBeVisible();
    
    // ✅ 4. (선택) 메시지 요소 내부에 실제 script DOM 노드가 없는지 확인
    //    (페이지 전체의 script 가 아닌, 해당 요소의 자식만 확인)
    const messageParagraph = page.locator('p.text-gray-600.mb-4');
    await expect(messageParagraph.locator('script')).toHaveCount(0);
    
    // ✅ 5. 에러 코드도 정상 출력 확인
    await expect(page.getByText("TEST")).toBeVisible();
  });
});