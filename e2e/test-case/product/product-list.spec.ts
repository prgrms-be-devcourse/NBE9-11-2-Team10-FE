// e2e/tests/product-list.spec.ts
import { test, expect } from "./fixtures/product-fixture";
import { MOCK_PRODUCTS } from "./fixtures/product-fixture";

test.describe("📦 상품 목록 페이지", () => {
  test.beforeEach(async ({ productHelpers }) => {
    await productHelpers.resetMockProducts();
  });
  // 🔹 기본 로딩 테스트
  test("기본 페이지 로딩 및 상품 목록 표시", async ({
    page,
    productHelpers,
  }) => {
    await productHelpers.goToProductList();

    // ✅ 필터 컴포넌트 표시 확인
    await expect(page.getByText("유형:")).toBeVisible();
    await expect(page.getByText("상태:")).toBeVisible();

    // ✅ 상품 카드 최소 1 개 이상 표시
    const cards = page.locator('[data-testid^="product-card-"]');
    await expect(cards).not.toHaveCount(0);
  });

  // 🔹 필터: 유형 (BOOK)
  test("유형 필터 - BOOK 만 표시", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    // BOOK 필터 클릭
    await productHelpers.applyFilter(page, "type", "BOOK");

    // ✅ URL 업데이트 확인
    await expect(page).toHaveURL(/type=BOOK/);

    // ✅ BOOK 타입 상품만 표시 (springIntro)
    await productHelpers.assertProductCard(page, MOCK_PRODUCTS.springIntro);

    // ✅ EBOOK 타입 상품은 표시되지 않음 (abcEbook)
    const ebookCard = page.locator(
      `[data-testid="product-card-${MOCK_PRODUCTS.abcEbook.id}"]`,
    );
    await expect(ebookCard).not.toBeVisible();
  });

  // 🔹 필터: 유형 (EBOOK)
  test("유형 필터 - EBOOK 만 표시", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    await productHelpers.applyFilter(page, "type", "EBOOK");

    await expect(page).toHaveURL(/type=EBOOK/);

    // EBOOK 상품 표시 확인
    await expect(page.getByText(MOCK_PRODUCTS.abcEbook.name)).toBeVisible();

    // BOOK 상품 미표시 확인
    await expect(
      page.getByText(MOCK_PRODUCTS.springIntro.name),
    ).not.toBeVisible();
  });

  // 🔹 필터: 상태 (SELLING)
  test("상태 필터 - 판매중만 표시", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    await productHelpers.applyFilter(page, "status", "SELLING");

    await expect(page).toHaveURL(/status=SELLING/);

    // 판매중 상품 포함 확인
    await expect(
      page.locator('[data-testid="status-badge-SELLING"]').first(),
    ).toBeVisible();

    // 품절 상품은 제외 (품절 상품만 있는 경우)
    const soldOutCard = page.locator(
      `[data-testid="product-card-${MOCK_PRODUCTS.soldOut.id}"]`,
    );
    // 품절 상품 데이터가 있다면 미표시 확인
    if ((await soldOutCard.count()) > 0) {
      await expect(soldOutCard).not.toBeVisible();
    }
  });

  // 🔹 필터: 상태 (SOLD_OUT)
  test("상태 필터 - 품절만 표시", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    await productHelpers.applyFilter(page, "status", "SOLD_OUT");

    await expect(page).toHaveURL(/status=SOLD_OUT/);

    // 품절 뱃지 표시 확인
    await expect(
      page.locator('[data-testid="status-badge-SOLD_OUT"]').first(),
    ).toBeVisible();
  });

  // 🔹 필터: 복합 필터 (유형 + 상태)
  test("복합 필터 - BOOK + 판매중", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    await productHelpers.applyFilter(page, "type", "BOOK");
    await productHelpers.applyFilter(page, "status", "SELLING");

    // ✅ URL 에 두 파라미터 모두 포함
    await expect(page).toHaveURL(
      /type=BOOK.*status=SELLING|status=SELLING.*type=BOOK/,
    );

    // ✅ BOOK 이면서 판매중인 상품만 표시
    await productHelpers.assertProductCard(page, MOCK_PRODUCTS.springIntro);
  });

  // 🔹 필터: 초기화
  test("필터 초기화 버튼 동작", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    // 필터 적용
    await productHelpers.applyFilter(page, "type", "EBOOK");
    await expect(page).toHaveURL(/type=EBOOK/);

    // 초기화 버튼 클릭
    const resetButton = page.getByRole("button", { name: "필터 초기화" });
    await expect(resetButton).toBeVisible();
    await resetButton.click();

    // ✅ URL 에서 필터 파라미터 제거 (page 만 남음)
    await expect(page).toHaveURL(/\/products\?page=1/);
    await expect(page).not.toHaveURL(/type=/);
  });

  // 🔹 페이지네이션: 다음 페이지
  test("페이지네이션 - 다음 페이지 이동 시 파라미터 유지", async ({
    page,
    productHelpers,
  }) => {
    // ✅ size=1 로 설정하여 페이지네이션 테스트
    await productHelpers.goToProductList({ size: "1", type: "BOOK" });

    // ✅ 현재 파라미터 확인
    await expect(page).toHaveURL(/size=1/);
    await expect(page).toHaveURL(/type=BOOK/);

    // ✅ 현재 페이지 표시 확인
    await expect(page.getByText(/1\s*\/\s*\d+/).first()).toBeVisible();

    // 다음 버튼 클릭
    const nextButton = page.getByTestId("pagination-next");
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState("networkidle");

      // ✅ URL 에 페이지만 업데이트되고, size/type 는 유지됨
      await expect(page).toHaveURL(/page=2/);
      await expect(page).toHaveURL(/size=1/); // ✅ size 유지 확인
      await expect(page).toHaveURL(/type=BOOK/); // ✅ type 유지 확인

      // ✅ 페이지 표시 업데이트 확인
      await expect(page.getByText(/2\s*\/\s*\d+/).first()).toBeVisible();
    }
  });

  // 🔹 페이지네이션: 이전 페이지
  test("페이지네이션 - 이전 페이지 이동", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList({ page: "2", size: "1" });

    // 이전 버튼 클릭 (2 페이지 이상일 때)
    const prevButton = page.getByRole("link", { name: "이전" });
    if (await prevButton.isVisible()) {
      await prevButton.click();

      await expect(page).toHaveURL(/page=1/);
    }
  });

  // 🔹 상품 카드 클릭 → 상세 페이지 이동
  test("상품 카드 클릭 시 상세 페이지로 이동", async ({
    page,
    productHelpers,
  }) => {
    await productHelpers.goToProductList();

    // 첫 번째 상품 카드 클릭
    const firstCard = page.locator('[data-testid^="product-card-"]').first();
    await firstCard.click();

    // ✅ 상세 페이지로 이동 확인 (URL 패턴)
    await expect(page).toHaveURL(/\/products\/\d+/);

    // ✅ 상품명 헤더 표시 확인
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("작가정보 보기 버튼 클릭 시 판매자 스토어로 이동", async ({
    page,
    productHelpers,
  }) => {
    await productHelpers.goToProductList();

    await page
      .getByTestId(`seller-store-link-${MOCK_PRODUCTS.springIntro.id}`)
      .click();

    await expect(page).toHaveURL(/\/stores\/1002$/);
  });

  // 🔹 접근성: ARIA 레이블 확인
  test("접근성 - 필터 버튼 ARIA 속성", async ({ page, productHelpers }) => {
    await productHelpers.goToProductList();

    // 필터 버튼들이 aria-pressed 속성을 가지는지 확인
    const filterButtons = page.locator('[data-testid^="filter-"]');
    const count = await filterButtons.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const button = filterButtons.nth(i);
      await expect(button).toHaveAttribute("aria-pressed");
    }
  });
});
