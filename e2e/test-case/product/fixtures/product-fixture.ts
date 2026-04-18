// e2e/tests/fixtures/product-fixture.ts
import { test as base, expect, Page } from "@playwright/test";
import { MOCK_USERS, MockUser } from "@/../e2e/mock-server/lib/mock-user-data";

// ============================================================================
// 👤 판매자 인증 헬퍼
// ============================================================================
export const MOCK_SELLER = {
  id: 1002,
  email: "seller@example.com",
  nickname: "판매자님",
  role: "SELLER" as const,
};

export const MOCK_BUYER = {
  id: 1001,
  email: "buyer@example.com",
  nickname: "구매자님",
  role: "BUYER" as const,
};

// ✅ 테스트용 상품 데이터 (Mock Server 와 동기화)
export const MOCK_PRODUCTS = {
  // BOOK 타입 - 판매중
  springIntro: {
    id: 1,
    name: "스프링 입문",
    price: 18000,
    type: "BOOK",
    status: "SELLING",
    imageUrl: "https://example.com/images/spring-intro.jpg",
  },
  // EBOOK 타입 - 판매중
  abcEbook: {
    id: 2,
    name: "ABC",
    price: 10000,
    type: "EBOOK",
    status: "SELLING",
    imageUrl: "https://example.com/images/book1.jpg",
  },
  // 품절 상품
  soldOut: {
    id: 3,
    name: "품절된 상품",
    price: 25000,
    type: "EBOOK",
    status: "SOLD_OUT",
    imageUrl: null,
  },
  // 상세 정보용 (description 포함)
  detailed: {
    id: 1,
    name: "스프링 입문",
    price: 18000,
    type: "BOOK",
    status: "SELLING",
    stock: 50,
    description: "자바 스프링 프레임워크 기초 가이드",
    imageUrl: "https://example.com/images/spring-intro.jpg",
  },
} as const;

// ✅ 커스텀 픽스처: 상품 관련 헬퍼 메서드 제공
export const test = base.extend<{
  productHelpers: {
    goToProductList: (params?: Record<string, string>) => Promise<void>;
    goToProductDetail: (productId: number) => Promise<void>;
    assertProductCard: (
      page: Page,
      product: typeof MOCK_PRODUCTS.springIntro,
    ) => Promise<void>;
    applyFilter: (
      page: Page,
      type: "type" | "status",
      value: string,
    ) => Promise<void>;
    goToCreateProductPage: () => Promise<void>;
    fillProductForm: (
      page: Page,
      data: Partial<MockProductFormData>,
    ) => Promise<void>;
    submitProductForm: (page: Page) => Promise<void>;
    assertFormError: (
      page: Page,
      fieldName: string,
      errorMessage: string,
    ) => Promise<void>;
    resetMockProducts: () => Promise<void>;
    goToSellerProductDetail: (productId: number) => Promise<void>;
    goToSellerProductEdit: (productId: number) => Promise<void>;
    deactivateProduct: (productId: number) => Promise<void>;
  };
  loginAs: (user: MockUser) => Promise<void>;
  loginAsSeller: () => Promise<void>;
}>({
  productHelpers: async ({ page }, use) => {
    const helpers = {
      // 🔹 상품 목록 페이지 이동 (쿼리 파라미터 지원)
      goToProductList: async (params?: Record<string, string>) => {
        const url = new URL(
          "/products",
          process.env.BASE_URL || "http://localhost:3000",
        );
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
        }
        await page.goto(url.toString());
        await page.waitForLoadState("networkidle");
      },

      // 🔹 상품 상세 페이지 이동
      goToProductDetail: async (productId: number) => {
        await page.goto(`/products/${productId}`);
        await page.waitForLoadState("networkidle");
      },

      // 🔹 상품 카드 내용 검증 (목록 페이지용)
      assertProductCard: async (
        page: Page,
        product: typeof MOCK_PRODUCTS.springIntro,
      ) => {
        const card = page.locator(`[data-testid="product-card-${product.id}"]`);

        await expect(card).toBeVisible();
        await expect(card.getByText(product.name)).toBeVisible();
        await expect(
          card.getByText(`${product.price.toLocaleString()}원`),
        ).toBeVisible();

        // 타입 뱃지
        const typeLabel = product.type === "BOOK" ? "실물 도서" : "전자책";
        await expect(card.getByText(typeLabel)).toBeVisible();

        // 상태 뱃지
        const statusLabel = product.status === "SELLING" ? "판매중" : "품절";
        await expect(card.getByText(statusLabel)).toBeVisible();
      },

      // 🔹 필터 적용 (클릭 기반)
      applyFilter: async (
        page: Page,
        filterType: "type" | "status",
        value: string,
      ) => {
        const button = page.locator(
          `[data-testid="filter-${filterType}-${value}"]`,
        );
        await button.click();
        await page.waitForLoadState("networkidle");
      },
      // ✅ 판매자 상품 생성 페이지 이동
      goToCreateProductPage: async () => {
        await page.goto("/seller/products/new");
        await page.waitForLoadState("networkidle");
      },
      // ✅ 상품 폼 채우기
      fillProductForm: async (
        page: Page,
        data: Partial<MockProductFormData>,
      ) => {
        // ✅ 1. 폼 요소들이 하이드레이션될 때까지 대기 (최대 5 초)
        await page.waitForSelector("#productName", {
          state: "visible",
          timeout: 5000,
        });

        // ✅ 2. 필드별 입력 (타입에 맞는 메서드 사용)
        if (data.productName !== undefined) {
          const input = page.locator("#productName");
          await input.waitFor({ state: "visible" }); // ✅ 상호작용 가능할 때까지 대기
          await input.fill(data.productName);
        }

        if (data.price !== undefined) {
          const input = page.locator("#price");
          await input.waitFor({ state: "visible" });
          await input.fill(String(data.price));
        }

        if (data.stock !== undefined) {
          const input = page.locator("#stock");
          await input.waitFor({ state: "visible" });
          await input.fill(String(data.stock));
        }

        if (data.type !== undefined) {
          const select = page.locator("#type");
          await select.waitFor({ state: "attached" });
          // ✅ select 는 fill 이 아닌 selectOption 사용
          await select.selectOption(data.type);
        }

        if (data.description !== undefined) {
          const textarea = page.locator("#description");
          await textarea.waitFor({ state: "visible" });
          await textarea.fill(data.description);
        }

        if (data.imageUrl !== undefined) {
          const input = page.locator("#imageUrl");
          await input.waitFor({ state: "visible" });
          await input.fill(data.imageUrl || "");
        }

        // ✅ 3. 입력 후 약간의 지연 (React 상태 업데이트 대기)
        await page.waitForTimeout(100);
      },
      // ✅ 폼 제출
      submitProductForm: async (page: Page) => {
        const submitButton = page.getByRole("button", {
          name: /등록하기|수정하기|처리 중/,
        });
        await submitButton.click();
        await page.waitForLoadState("networkidle");
      },

      // ✅ 폼 에러 메시지 검증
      assertFormError: async (
        page: Page,
        fieldName: string,
        errorMessage: string,
      ) => {
        // ✅ 에러 메시지 텍스트 확인
        await expect(page.getByText(errorMessage)).toBeVisible();

        // ✅ 입력 필드 에러 스타일 확인 (Tailwind 클래스)
        const input = page.locator(`#${fieldName}, [name="${fieldName}"]`);
        await expect(input).toHaveClass(
          /border-red-500|bg-red-50|focus:ring-red-500/,
        );
      },
      // ✅ Mock 데이터 초기화 (E2E 테스트 격리용)
      resetMockProducts: async () => {
        await page.request.delete(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/stores/me/products/__reset`,
        );
      },
      goToSellerProductDetail: async (productId: number) => {
        await page.goto(`/seller/products/${productId}`);
        await page.waitForLoadState("networkidle");
      },

      // ✅ 판매자 전용 상품 수정 페이지 이동
      goToSellerProductEdit: async (productId: number) => {
        await page.goto(`/seller/products/${productId}/edit`);
        await page.waitForLoadState("networkidle");
      },

      // ✅ 상품 비활성화 (삭제) 실행 및 확인
      deactivateProduct: async (productId: number) => {
        await page.goto(`/seller/products/${productId}`);
        await page.waitForLoadState("networkidle");

        const deactivateBtn = page.getByRole("button", { name: "비활성화" });
        await expect(deactivateBtn).toBeVisible();

        // ✅ confirm 다이얼로그 처리 (Playwright 에서 모킹)
        page.on("dialog", async (dialog) => {
          expect(dialog.message()).toContain("비활성화하시겠습니까?");
          await dialog.accept();
        });

        await deactivateBtn.click();
        await page.waitForLoadState("networkidle");
      },
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helpers);
  },
  // ✅ 실제 로그인 수행: 로그인 폼 제출 → 쿠키 발급 → 인증 완료
  loginAs: async ({ page }, use) => {
    const loginAs = async (user: MockUser) => {
      // ✅ 1. 로그인 페이지로 이동
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // ✅ 2. 로그인 폼 작성
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);

      // ✅ 3. 네트워크 응답 대기 (로그인 성공 확인)
      const loginResponse = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/auth/login") && res.status() === 200,
      );

      // ✅ 4. 폼 제출
      await page.click('button[type="submit"]');

      // ✅ 5. 로그인 응답 및 리다이렉트 대기
      await loginResponse;
      await page.waitForURL(/^(?!.*\/login)/); // 로그인 페이지에서 벗어날 때까지 대기
      await page.waitForLoadState("networkidle");

      // ✅ 6. 로그인 성공 확인 (헤더에 사용자 정보 표시)
      await expect(page.getByText(`${user.nickname} 님`)).toBeVisible();

      // ✅ 7. (선택) 쿠키 발급 확인
      const cookies = await page.context().cookies();
      const hasAccessToken = cookies.some((c) => c.name === "accessToken");
      if (!hasAccessToken) {
        console.warn(
          "⚠️ accessToken 쿠키가 발급되지 않았습니다. 서버 설정을 확인하세요.",
        );
      }
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(loginAs);
  },

  // ✅ 판매자로 로그인 편의 함수
  loginAsSeller: async ({ loginAs }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async () => {
      await loginAs(MOCK_USERS.SELLER);
    });
  },
});

export interface MockProductFormData {
  productName: string;
  price: number;
  stock: number;
  type: "BOOK" | "EBOOK";
  description?: string;
  imageUrl?: string | null;
}

export { expect };
