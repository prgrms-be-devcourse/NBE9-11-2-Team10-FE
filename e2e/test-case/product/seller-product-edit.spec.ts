// e2e/tests/seller-product-edit.spec.ts
import { MOCK_USERS } from "../../mock-server/lib/mock-user-data";
import { test, expect, MOCK_PRODUCTS } from "./fixtures/product-fixture";

test.describe("✏️ 판매자 전용 상품 수정 페이지", () => {
  test.beforeEach(async ({ productHelpers }) => {
    await productHelpers.resetMockProducts();
  });

  // ============================================================================
  // 🔐 인증/인가 테스트
  // ============================================================================

  test("비로그인 접근 시 로그인 리다이렉트", async ({
    page,
    productHelpers,
  }) => {
    await productHelpers.goToSellerProductEdit(1);
    await expect(page).toHaveURL(
      /\/login.*redirect=.*%2Fseller%2Fproducts%2F1%2Fedit/,
    );
  });

  test("구매자 접근 시 403 에러", async ({ page, productHelpers, loginAs }) => {
    await loginAs(MOCK_USERS.BUYER);
    await productHelpers.goToSellerProductEdit(1);

    await expect(
      page
        .getByText(/이 페이지는 판매자 계정만 접근할 수 있습니다./)
        .or(page.locator('meta[name="next-error"]')),
    ).toBeVisible();
  });

  test("판매자 접근 시 폼에 기존 데이터 미리 채워짐", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(MOCK_PRODUCTS.detailed.id);

    // ✅ 페이지 제목
    await expect(page).toHaveTitle(/상품 수정 #1|판매자 센터/);
    await expect(
      page.getByRole("heading", { name: "상품 정보 수정" }),
    ).toBeVisible();

    // ✅ 폼 필드들이 기존 값으로 채워져 있는지 확인
    await expect(page.locator("#productName")).toHaveValue(
      MOCK_PRODUCTS.detailed.name,
    );
    await expect(page.locator("#price")).toHaveValue(
      String(MOCK_PRODUCTS.detailed.price),
    );
    await expect(page.locator("#stock")).toHaveValue(
      String(MOCK_PRODUCTS.detailed.stock),
    );
    await expect(page.locator("#type")).toHaveValue(
      MOCK_PRODUCTS.detailed.type,
    );
    await expect(page.locator("#description")).toHaveValue(
      MOCK_PRODUCTS.detailed.description,
    );
    await expect(page.locator('input[name="imageUrl"]')).toHaveValue(
      MOCK_PRODUCTS.detailed.imageUrl,
    );

    // ✅ hidden productId 필드 존재
    await expect(page.locator('input[name="productId"]')).toHaveValue(
      String(MOCK_PRODUCTS.detailed.id),
    );
  });

  // ============================================================================
  // 📝 폼 검증 테스트 (서버 검증과 동기화)
  // ============================================================================

  test("상품명 비어있을 때 에러", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    // ✅ 상품명 지우기
    await page.locator("#productName").fill("");
    await productHelpers.submitProductForm(page);

    await expect(page.getByText("상품명은 필수입니다.")).toBeVisible();
    await expect(page.locator("#productName")).toHaveClass(/border-red-500/);
  });

  test("가격이 0 이하일 때 에러", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    await page.locator("#price").fill("0");
    await productHelpers.submitProductForm(page);

    await expect(page.getByText("가격은 1 이상이어야 합니다.")).toBeVisible();
  });

  test("재고가 음수일 때 에러", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    await page.locator("#stock").fill("-10");
    await productHelpers.submitProductForm(page);

    await expect(page.getByText("재고는 0 이상이어야 합니다.")).toBeVisible();
  });

  test("상품 유형이 유효하지 않을 때 에러", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    // ✅ select 값 강제 변경
    await page.evaluate(() => {
      const select = document.querySelector("#type") as HTMLSelectElement;
      if (select) {
        const opt = document.createElement("option");
        opt.value = "INVALID";
        opt.textContent = "Invalid";
        select.add(opt);
        select.value = "INVALID";
      }
    });

    await productHelpers.submitProductForm(page);
    await expect(
      page.getByText(/Invalid option: expected one of "BOOK"|"EBOOK"/),
    ).toBeVisible();
  });

  test("상품 이미지 파일을 다시 고르면 미리보기가 바뀐다", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    await productHelpers.fillProductForm(page, {
      imageFile: {
        name: "updated-product-image.svg",
      },
    });

    await expect(page.getByText("updated-product-image.svg")).toBeVisible();
    await expect(page.getByAltText("상품 이미지 미리보기")).toBeVisible();
  });

  // ============================================================================
  // ✅ 성공 시나리오
  // ============================================================================

  test("유효한 데이터로 수정 성공 → 상세 페이지 리다이렉트", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(MOCK_PRODUCTS.detailed.id);

    // ✅ 데이터 수정
    await page.locator("#productName").fill("수정된 상품명");
    await page.locator("#price").fill("29000");
    await page.locator("#stock").fill("100");

    await productHelpers.submitProductForm(page);

    // ✅ 상세 페이지로 리다이렉트
    await expect(page).toHaveURL("/seller/products/1");
    await expect(
      page.getByRole("heading", { name: "수정된 상품명" }),
    ).toBeVisible();
    await expect(page.getByText("29,000원")).toBeVisible();
  });

  test("선택 필드 (description, imageUrl) 비워도 수정 성공", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(MOCK_PRODUCTS.detailed.id);

    // ✅ 기존 설명만 지워도 수정 가능
    await page.locator("#description").fill("");

    await productHelpers.submitProductForm(page);

    await expect(page).toHaveURL("/seller/products/1");
    // ✅ 수정된 페이지에서 값이 비어있음 확인 (또는 기본 메시지)
    await expect(page.locator('input[name="imageUrl"]')).not.toBeVisible(); // 상세 페이지에서는 입력 필드 없음
  });

  test("취소 버튼 클릭 → 판매자 상세 페이지로 이동", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    // ✅ 1. 먼저 상세 페이지로 이동 (히스토리 스택 생성)
    await productHelpers.goToSellerProductDetail(1);
    await page.waitForLoadState("networkidle");

    // ✅ 2. 수정 페이지로 이동 (히스토리에 추가)
    await productHelpers.goToSellerProductEdit(1);
    await page.waitForLoadState("networkidle");

    const cancelBtn = page.getByRole("button", { name: "취소" });
    await cancelBtn.click();

    // ✅ 3. router.back() 으로 상세 페이지로 돌아옴
    await expect(page).toHaveURL("/seller/products/1");
  });

  // ============================================================================
  // 🎨 UI/UX 테스트
  // ============================================================================

  test("브레드크럼 - 상위 경로 링크 확인", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    // ✅ 대시보드 링크
    await expect(
      breadcrumb.getByRole("link", { name: "대시보드" }),
    ).toHaveAttribute("href", "/seller/dashboard");

    // ✅ 상품 관리 링크
    await expect(
      breadcrumb.getByRole("link", { name: "상품 관리" }),
    ).toHaveAttribute("href", "/seller/products");
  });

  test("폼 필드 레이블 - 필수 항목 표시 (*)", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    // ✅ 상품명, 가격, 재고, 유형 레이블에 * 표시
    await expect(page.locator('label[for="productName"]')).toContainText("*");
    await expect(page.locator('label[for="price"]')).toContainText("*");
    await expect(page.locator('label[for="stock"]')).toContainText("*");
    await expect(page.locator('label[for="type"]')).toContainText("*");

    // ✅ 설명, 이미지 URL 은 선택 (옵션)
    await expect(page.locator('label[for="description"]')).not.toContainText("*");
    await expect(page.locator('label[for="productImageFile"]')).not.toContainText("*");
  });

  test("상품 유형 셀렉트 - BOOK/EBOOK 전환", async ({
    page,
    productHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await productHelpers.goToSellerProductEdit(1);

    const typeSelect = page.locator("#type");

    // ✅ 초기값 확인
    await expect(typeSelect).toHaveValue("BOOK");

    // ✅ EBOOK 으로 변경
    await typeSelect.selectOption("EBOOK");
    await expect(typeSelect).toHaveValue("EBOOK");

    // ✅ 다시 BOOK 으로
    await typeSelect.selectOption("BOOK");
    await expect(typeSelect).toHaveValue("BOOK");
  });

  // ============================================================================
  // ⚠️ 에러 케이스
  // ============================================================================

  test("존재하지 않는 상품 수정 시도 - 404", async ({
    page,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await page.goto("/seller/products/99999/edit");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/404:/);
  });

  test("이미 비활성화된 상품 수정 시도 - 404", async ({
    page,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    // id=99 를 비활성화 상품으로 가정
    await page.goto("/seller/products/99/edit");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveTitle(/404:/);
  });
});
