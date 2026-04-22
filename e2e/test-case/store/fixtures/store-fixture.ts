// e2e/tests/fixtures/store-fixture.ts
import { test as base, expect, Page } from "@playwright/test";
import { MOCK_USERS, MockUser } from "@/../e2e/mock-server/lib/mock-user-data";
import {
  FeedStore,
} from "../../../mock-server/lib/mock-feed-data";
import { FeaturedProductStore } from "../../../mock-server/lib/mock-featured-product";

// ============================================================================
// 👤 Mock 사용자 (기존과 공유)
// ============================================================================
export const MOCK_SELLER = MOCK_USERS.SELLER;

export const MOCK_BUYER = MOCK_USERS.BUYER;

// e2e/tests/fixtures/store-fixture.ts 에 추가할 내용

// ============================================================================
// 🛠️ 프로필 수정 페이지 헬퍼
// ============================================================================
export const StoreProfileEditHelpers = {
  // 📍 수정 페이지 이동
  goToEditPage: async (page: Page, sellerId: string) => {
    await page.goto(`/stores/${sellerId}/edit`);
    await expect(page).toHaveURL(`/stores/${sellerId}/edit`);
  },

  // 📍 폼 필드 입력
  fillProfileForm: async (
    page: Page,
    data: {
      nickname?: string;
      bio?: string;
      profileImageUrl?: string;
      businessName?: string;
      ceoName?: string;
    },
  ) => {
    if (data.nickname !== undefined) {
      const field = page.getByLabel('닉네임');
      await field.clear(); // ✅ 기존 값 완전 제거
      await field.fill(data.nickname);
    }
    if (data.bio !== undefined) {
      const field = page.getByLabel('소개');
      await field.clear();
      await field.fill(data.bio);
    }
    if (data.profileImageUrl !== undefined) {
      const field = page.getByLabel('프로필 이미지 URL');
      await field.clear();
      await field.fill(data.profileImageUrl);
    }
    if (data.businessName !== undefined) {
      const field = page.getByLabel('상호명');
      await field.clear();
      await field.fill(data.businessName);
    }
    if (data.ceoName !== undefined) {
      const field = page.getByLabel('대표자명');
      await field.clear();
      await field.fill(data.ceoName);
    }
  },

  // 📍 저장 버튼 클릭
  clickSaveButton: async (page: Page) => {
    const saveBtn = page.getByRole('button', { name: '프로필 저장' });
    await saveBtn.click();
  },

  // 📍 취소/뒤로가기 버튼 클릭
  clickCancelButton: async (page: Page) => {
    const cancelBtn = page.getByRole('link', { name: '← 프로필 보기' });
    await cancelBtn.click();
  },

  // 📍 필드 에러 메시지 검증
  assertFieldError: async (
    page: Page,
    fieldName: string,
    expectedMessage: string,
  ) => {
    const field = page.locator(`#${fieldName.split('.').pop()}`);
    const errorText = field
      .locator('xpath=../..//p[contains(@class, "text-red-500")]')
      .filter({ hasText: expectedMessage });
    await expect(errorText).toBeVisible();
  },

  // 📍 전역 에러 메시지 검증
  assertGlobalError: async (page: Page, expectedMessage: string) => {
    const errorBox = page.locator('.bg-red-50').getByText(expectedMessage);
    await expect(errorBox).toBeVisible();
  },

  // 📍 폼 초기값이 프로필 데이터로 채워졌는지 검증
  assertFormPreFilled: async (page: Page, profile: any) => {
    await expect(page.getByLabel('닉네임')).toHaveValue(profile.nickname);
    if (profile.bio) {
      await expect(page.getByLabel('소개')).toHaveValue(profile.bio);
    }
    if (profile.profileImageUrl) {
      await expect(page.getByLabel('프로필 이미지 URL')).toHaveValue(
        profile.profileImageUrl,
      );
    }
    if (profile.businessInfo?.businessName) {
      await expect(page.getByLabel('상호명')).toHaveValue(
        profile.businessInfo.businessName,
      );
    }
    if (profile.businessInfo?.ceoName) {
      await expect(page.getByLabel('대표자명')).toHaveValue(
        profile.businessInfo.ceoName,
      );
    }
  },
};

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
    goToCreateFeed: (sellerId: string) => Promise<void>;
    goToEditFeed: (sellerId: string, feedId: string) => Promise<void>;
    fillFeedForm: (options: {
      content?: string;
      mediaUrls?: string[];
      isNotice?: boolean;
    }) => Promise<void>;
    submitFeedForm: () => Promise<void>;
    assertFeedFormError: (message: string) => Promise<void>;
    clickDeleteFeed: (feedIndex?: number) => Promise<void>;
    assertFeedDeleted: (feedId: string) => Promise<void>;
  };
  loginAs: (user: MockUser) => Promise<void>;
  loginAsSeller: () => Promise<void>;
  loginAsBuyer: () => Promise<void>;
  storeEditHelpers: typeof StoreProfileEditHelpers;
}>({
  storeHelpers: async ({ page }, use) => {
    const helpers = {
      // 🔹 스토어 프로필 페이지 이동
      goToStoreProfile: async (sellerId: string) => {
        await page.goto(`/stores/${sellerId}`);
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

      goToCreateFeed: async (sellerId: string) => {
        await page.goto(`/stores/${sellerId}/feeds/new`);
        await expect(page.getByTestId("feed-form")).toBeVisible();
      },

      goToEditFeed: async (sellerId: string, feedId: string) => {
        await page.goto(`/stores/${sellerId}/feeds/${feedId}/edit`);
        await expect(page.getByTestId("feed-form")).toBeVisible();
      },
      fillFeedForm: async (options: {
        content?: string
        mediaUrls?: string[]
        isNotice?: boolean
      }) => {
        const { content, mediaUrls, isNotice } = options;
        if (content !== undefined) {
          await page.getByTestId("content-input").fill(content);
        }
        if (isNotice !== undefined) {
          const checkbox = page.getByTestId("notice-checkbox");
          if (isNotice !== (await checkbox.isChecked())) {
            await checkbox.click();
          }
        }
        if (mediaUrls?.length) {
          for (const url of mediaUrls) {
            await page.getByPlaceholder("https://example.com/image.jpg").fill(url);
            await page.getByRole("button", { name: "추가" }).click();
          }
        }
      },

      submitFeedForm: async () => {
        await page.getByTestId("submit-button").click();
      },

      assertFeedFormError: async (message: string) => {
        await expect(page.getByTestId("form-error")).toBeVisible();
        await expect(page.getByTestId("form-error")).toContainText(message);
      },

      clickDeleteFeed: async (feedIndex = 0) => {
        const feedItem = page.locator("article").nth(feedIndex);
        page.once("dialog", (dialog) => dialog.accept());
        await feedItem.getByTestId("feed-actions").getByLabel("삭제").click();
      },

      assertFeedDeleted: async (feedId: string) => {
        // 피드 목록에서 해당 피드가 사라졌는지 확인
        await expect(
          page.locator("article").filter({ hasText: feedId })
        ).not.toBeVisible();
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
  storeEditHelpers: async ({ }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(StoreProfileEditHelpers);
  },
});

export { expect };
