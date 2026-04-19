// e2e/tests/fixtures/store-fixture.ts
import { test as base, expect, Page } from "@playwright/test";
import { MOCK_USERS, MockUser } from "@/../e2e/mock-server/lib/mock-user-data";
import {
  FeaturedProductStore,
  FeedStore,
} from "../../../mock-server/lib/mock-feed-data";

// ============================================================================
// 👤 Mock 사용자 (기존과 공유)
// ============================================================================
export const MOCK_SELLER = MOCK_USERS.SELLER;

export const MOCK_BUYER = MOCK_USERS.BUYER;

// ============================================================================
// 📦 Mock 스토어 프로필 데이터
// ============================================================================
export const MOCK_STORE_PROFILE = {
  sellerId: MOCK_SELLER.id,
  nickname: "북스셀러_길동",
  bio: "좋은 책을 소개하는 스토어입니다.",
  profileImageUrl: null,
  stats: {
    followerCount: 128,
    productCount: 15,
    feedCount: 42,
  },
  businessInfo: undefined,
};

export const MOCK_FEEDS = FeedStore.findBySellerId(String(MOCK_SELLER.id));

export const MOCK_FEATURED_PRODUCTS = FeaturedProductStore.findBySellerId(
  String(MOCK_SELLER.id),
);

// ============================================================================
// 🛠️ 커스텀 픽스처: 스토어 프로필 헬퍼
// ============================================================================
export const test = base.extend<{
  storeHelpers: {
    goToStoreProfile: (sellerId: string) => Promise<void>;
    assertProfileHeader: (
      page: Page,
      profile: typeof MOCK_STORE_PROFILE,
    ) => Promise<void>;
    assertFeaturedProducts: (
      page: Page,
      products: typeof MOCK_FEATURED_PRODUCTS,
    ) => Promise<void>;
    assertFeedItem: (
      page: Page,
      feed: (typeof MOCK_FEEDS)[0],
      index?: number,
    ) => Promise<void>;
    toggleComments: (page: Page, feedIndex?: number) => Promise<void>;
    loadMoreComments: (page: Page) => Promise<void>;
    resetMockStoreData: () => Promise<void>;
  };
  loginAs: (user: MockUser) => Promise<void>;
  loginAsSeller: () => Promise<void>;
  loginAsBuyer: () => Promise<void>;
}>({
  storeHelpers: async ({ page }, use) => {
    const helpers = {
      // 🔹 스토어 프로필 페이지 이동
      goToStoreProfile: async (sellerId: string) => {
        await page.goto(`/store/${sellerId}`);
        await page.waitForLoadState("networkidle");
      },

      // 🔹 프로필 헤더 정보 검증
      assertProfileHeader: async (
        page: Page,
        profile: typeof MOCK_STORE_PROFILE,
      ) => {
        const sidebar = page.getByTestId("store-profile-sidebar");

        // 닉네임
        await expect(sidebar.getByTestId("profile-nickname")).toHaveText(
          profile.nickname,
        );

        // 소개 (bio) - 선택 필드
        if (profile.bio) {
          await expect(sidebar.getByTestId("profile-bio")).toHaveText(
            profile.bio,
          );
        }

        // 통계 값들
        await expect(sidebar.getByTestId("stat-value-followers")).toHaveText(
          String(profile.stats.followerCount),
        );
        await expect(sidebar.getByTestId("stat-value-products")).toHaveText(
          String(profile.stats.productCount),
        );
        await expect(sidebar.getByTestId("stat-value-feeds")).toHaveText(
          String(profile.stats.feedCount),
        );

        // 라벨 텍스트도 함께 검증 (선택사항)
        await expect(sidebar.getByText("구독자")).toBeVisible();
        await expect(sidebar.getByText("상품")).toBeVisible();
        await expect(sidebar.getByText("피드")).toBeVisible();
      },

      // 🔹 강조 상품 섹션 검증
      assertFeaturedProducts: async (
        page: Page,
        products: typeof MOCK_FEATURED_PRODUCTS,
      ) => {
        // ✅ 섹션 존재 확인
        const section = page.getByTestId("featured-products-section");
        await expect(section).toBeVisible();

        // ✅ 제목 확인 (선택사항)
        await expect(section.getByTestId("section-title")).toHaveText(
          "Favorite",
        );

        // ✅ 각 상품 카드 검증
        for (const product of products) {
          const card = page.getByTestId(`product-card-${product.productId}`);
          await expect(card).toBeVisible();

          // 상품명
          await expect(card.getByTestId("product-name")).toHaveText(
            product.productName,
          );

          // 가격
          await expect(card.getByTestId("product-price")).toHaveText(
            `${product.price.toLocaleString()}원`,
          );

          // 할인율 (있는 경우)
          if (product.discountRate) {
            expect(card.getByTestId("product-discount")).toBeDefined();
          }

          // 품절 뱃지 (있는 경우)
          if (product.isSoldOut) {
            await expect(
              card.getByTestId("product-sold-out-badge"),
            ).toBeVisible();
          }

          // ✅ 클릭 가능 여부 확인 (링크)
          await expect(card).toHaveAttribute(
            "href",
            `/products/${product.productId}`,
          );
        }
      },

      // 🔹 피드 아이템 검증
      assertFeedItem: async (
        page: Page,
        feed: (typeof MOCK_FEEDS)[0],
        index: number = 0,
      ) => {
        const feedItem = page.locator("article").nth(index);
        await expect(feedItem).toBeVisible();

        // 콘텐츠
        await expect(feedItem.getByText(feed.content)).toBeVisible();

        // 미디어 (이미지)
        if (feed.mediaUrls?.length > 0) {
          const images = feedItem.locator("img");
          await expect(images.first()).toBeVisible();
        }

        // 액션 버튼
        await expect(
          feedItem
            .getByRole("button")
            .filter({ hasText: `❤️ ${feed.likeCount}` }),
        ).toBeVisible();
        await expect(
          feedItem
            .getByRole("button")
            .filter({ hasText: `💬 ${feed.commentCount}` }),
        ).toBeVisible();
      },

      // 🔹 댓글 토글 (댓글 목록 로드 트리거)
      toggleComments: async (page: Page, feedIndex: number = 0) => {
        const feedItem = page.locator("article").nth(feedIndex);
        const commentBtn = feedItem
          .getByRole("button")
          .filter({ hasText: "💬" });
        await commentBtn.click();

        // 로딩 스피너 사라질 때까지 대기
        await page.waitForSelector(".animate-spin", {
          state: "detached",
          timeout: 5000,
        });
      },

      // 🔹 댓글 더보기 로드
      loadMoreComments: async (page: Page) => {
        const loadMoreBtn = page.getByRole("button", {
          name: "이전 댓글 보기",
        });
        await expect(loadMoreBtn).toBeVisible();
        await loadMoreBtn.click();
        await page.waitForLoadState("networkidle");
      },

      // 🔹 Mock 데이터 초기화
      resetMockStoreData: async () => {
        await page.request.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/__reset`,
        );
      },
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helpers);
  },

  // 🔹 로그인 헬퍼 (기존 product-fixture 와 호환)
  loginAs: async ({ page }, use) => {
    const loginAs = async (user: MockUser) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password || "password123");

      const responsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/auth/login") && res.status() === 200,
      );

      await page.click('button[type="submit"]');
      await responsePromise;
      await page.waitForURL(/^(?!.*\/login)/);
      await page.waitForLoadState("networkidle");
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(loginAs);
  },

  loginAsSeller: async ({ loginAs }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async () => {
      await loginAs(MOCK_SELLER);
    });
  },

  loginAsBuyer: async ({ loginAs }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(async () => {
      await loginAs(MOCK_BUYER);
    });
  },
});

export { expect };
