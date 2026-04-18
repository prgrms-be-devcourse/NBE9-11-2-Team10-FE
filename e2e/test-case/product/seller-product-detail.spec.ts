// e2e/tests/seller-product-detail.spec.ts
import { MOCK_USERS } from "../../mock-server/lib/mock-user-data";
import { test, expect, MOCK_PRODUCTS } from "./fixtures/product-fixture";

test.describe("🛍️ 판매자 전용 상품 상세 페이지", () => {
  // 🔹 테스트 전 데이터 초기화
  test.beforeEach(async ({ productHelpers }) => {
    await productHelpers.resetMockProducts();
  });

  // ============================================================================
  // 🔐 인증/인가 테스트
  // ============================================================================

  test("비로그인 접근 시 로그인 페이지로 리다이렉트", async ({
    page,
    productHelpers,
  }) => {
    await productHelpers.goToSellerProductDetail(1);

    // ✅ 로그인 페이지로 리다이렉트 + redirect 파라미터 확인
    await expect(page).toHaveURL(
      /\/login.*redirect=.*%2Fseller%2Fproducts%2F1/,
    );
  });

  test("구매자 (BUYER) 접근 시 403 에러", async ({
    page,
    productHelpers,
    loginAs,
  }) => {
    await loginAs(MOCK_USERS.BUYER);
    await productHelpers.goToSellerProductDetail(1);

    // ✅ 접근 거부 메시지 또는 403 페이지 확인
    await expect(
      page
        .getByText(/이 페이지는 판매자 계정만 접근할 수 있습니다./)
        .or(page.locator('meta[name="next-error"]')),
    ).toBeVisible();
  });

  test("판매자 (SELLER) 접근 시 페이지 정상 렌더링", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    // ✅ 페이지 제목 확인
    await expect(page).toHaveTitle(/상품 관리 #1|판매자 센터/);

    // ✅ 상품명 헤더
    await expect(
      page.getByRole("heading", { name: MOCK_PRODUCTS.detailed.name }),
    ).toBeVisible();

    // ✅ 가격 표시
    await expect(
      page.getByText(`${MOCK_PRODUCTS.detailed.price.toLocaleString()}원`),
    ).toBeVisible();

    // ✅ 상품 ID 표시 (관리자용)
    await expect(page.getByText("#1")).toBeVisible();

    // ✅ 재고 정보
    await expect(
      page.getByText(`${MOCK_PRODUCTS.detailed.stock}개`),
    ).toBeVisible();

    // ✅ 상태 뱃지
    await expect(page.getByText("판매중")).toBeVisible();

    // ✅ 상품 유형
    await expect(page.getByText("실물 도서")).toBeVisible();
  });

  // ============================================================================
  // 📋 정보 표시 테스트
  // ============================================================================

  test("상품 설명 - 줄바꿈 및 공백 처리", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    // ✅ 설명 섹션 존재
    await expect(page.getByText("상품 설명")).toBeVisible();

    // ✅ 설명 내용 (whitespace-pre-wrap 로 표시)
    const descriptionBox = page.locator(".whitespace-pre-wrap");
    await expect(descriptionBox).toContainText(
      MOCK_PRODUCTS.detailed.description,
    );
  });

  test("이미지 없는 상품 - 플레이스홀더 표시", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    // MOCK_PRODUCTS.soldOut 은 imageUrl: null
    await productHelpers.goToSellerProductDetail(3);

    // ✅ 이미지 컨테이너는 존재하지만, 실제 img 태그는 없거나 플레이스홀더 텍스트
    const container = page.locator(".aspect-square").first();
    await expect(container).toBeVisible();
    await expect(container.getByText("이미지가 없습니다")).toBeVisible();
  });

  // ============================================================================
  // 🎯 액션 버튼 테스트
  // ============================================================================

  test("수정하기 버튼 - 판매중 상품에서 표시 및 이동", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    const editBtn = page.getByRole("link", { name: "상품 수정하기" });
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toHaveAttribute("href", "/seller/products/1/edit");

    // ✅ 클릭 시 수정 페이지로 이동
    await editBtn.click();
    await expect(page).toHaveURL("/seller/products/1/edit");
    await expect(
      page.getByRole("heading", { name: "상품 정보 수정" }),
    ).toBeVisible();
  });

  test("비활성화 버튼 - 판매중 상품에서 표시", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    const deactivateBtn = page.getByRole("button", { name: "비활성화" });
    await expect(deactivateBtn).toBeVisible();
    await expect(deactivateBtn).toBeEnabled();
  });
  test("비활성화 실행 - 확인 다이얼로그 및 리다이렉트", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    // ✅ confirm 다이얼로그 핸들링
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("비활성화하시겠습니까?");
      await dialog.accept();
    });

    const deactivateBtn = page.getByRole("button", { name: "비활성화" });
    await deactivateBtn.click();

    // ✅ 대시보드로 리다이렉트
    await expect(page).toHaveURL("/seller/dashboard");

    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    await expect(page).toHaveTitle(/404:/);
    await expect(page.getByText("404")).toBeVisible();
  });

  test("비활성화 취소 - 확인 다이얼로그에서 취소", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    // ✅ 취소 다이얼로그 핸들링
    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    const deactivateBtn = page.getByRole("button", { name: "비활성화" });
    await deactivateBtn.click();

    // ✅ 페이지 이동 없음 (같은 페이지 유지)
    await expect(page).toHaveURL("/seller/products/1");
    await expect(
      page.getByRole("heading", { name: MOCK_PRODUCTS.detailed.name }),
    ).toBeVisible();
  });

  // ============================================================================
  // 🧭 네비게이션 테스트
  // ============================================================================

  test("브레드크럼 - 대시보드 링크 작동", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    const breadcrumbLink = page
      .locator('nav[aria-label="breadcrumb"] a')
      .first();
    await expect(breadcrumbLink).toHaveAttribute("href", "/seller/dashboard");

    await breadcrumbLink.click();
    await expect(page).toHaveURL("/seller/dashboard");
  });

  test("공개 페이지에서 보기 - 새 탭에서 상품 상세 열기", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    // ✅ target="_blank" 링크 확인
    const publicLink = page.getByRole("link", { name: "공개 페이지에서 보기" });
    await expect(publicLink).toBeVisible();
    await expect(publicLink).toHaveAttribute("target", "_blank");
    await expect(publicLink).toHaveAttribute("href", "/products/1");

    // ✅ 새 탭 열기 (Playwright 에서 처리)
    const pagePromise = page.context().waitForEvent("page");
    await publicLink.click();
    const newPage = await pagePromise;
    await newPage.waitForLoadState("networkidle");

    // ✅ 새 탭에서 공개 상품 페이지 확인
    await expect(newPage).toHaveURL("/products/1");
    await expect(
      newPage.getByRole("heading", { name: MOCK_PRODUCTS.detailed.name }),
    ).toBeVisible();
  });

  test("대시보드로 버튼 - 하단 네비게이션", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductDetail(MOCK_PRODUCTS.detailed.id);

    const backLink = page.getByRole("link", { name: "대시보드로" });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/seller/dashboard");
  });

  // ============================================================================
  // ⚠️ 에러 케이스
  // ============================================================================

  test("존재하지 않는 상품 ID - 404 처리", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await page.goto("/seller/products/99999");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/404:/);
    await expect(page.getByText("404")).toBeVisible();
  });

  test("잘못된 ID 형식 (문자열) - 404 처리", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await page.goto("/seller/products/abc");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/404:/);
  });
});
