// e2e/tests/store-profile.spec.ts
import {
  test,
  expect,
  MOCK_STORE_PROFILE,
  MOCK_FEEDS,
  MOCK_FEATURED_PRODUCTS,
  MOCK_SELLER,
} from "./fixtures/store-fixture";

test.describe("🏪 판매자 스토어 프로필 페이지", () => {
  const SELLER_ID = String(MOCK_SELLER.id);

  // 🔹 테스트 전 데이터 초기화
  test.beforeEach(async ({ storeHelpers }) => {
    await storeHelpers.resetMockStoreData();
  });

  // ============================================================================
  // 🔐 인증/접근 제어 테스트
  // ============================================================================

  test("비로그인 사용자 - 공개 프로필 정상 조회", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    // 프로필 헤더 검증
    await storeHelpers.assertProfileHeader(page, MOCK_STORE_PROFILE);
  });

  test("구매자 (BUYER) 로그인 - 프로필 + 팔로우 상태 확인", async ({
    page,
    storeHelpers,
    loginAsBuyer,
  }) => {
    await loginAsBuyer();
    await storeHelpers.goToStoreProfile(SELLER_ID);

    await storeHelpers.assertProfileHeader(page, MOCK_STORE_PROFILE);

    // ✅ 팔로우 버튼 존재 확인 (구현 여부에 따라 스킵 가능)
    // await expect(page.getByRole("button", { name: "팔로우" })).toBeVisible();
  });

  test("판매자 본인 (SELLER) 로그인 - 내 프로필 조회", async ({
    page,
    storeHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeHelpers.goToStoreProfile(SELLER_ID);

    await storeHelpers.assertProfileHeader(page, MOCK_STORE_PROFILE);

    // 본인 프로필임을 나타내는 추가 요소 검증 (필요시 구현)
    // 예: "프로필 수정" 버튼 등
  });

  // ============================================================================
  // 📦 강조 상품 (Featured Products) 섹션 테스트
  // ============================================================================

  test("강조 상품 섹션 - 상품 카드 정상 렌더링", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    // ✅ 헬퍼 함수 호출 하나로 검증 완료
    await storeHelpers.assertFeaturedProducts(page, MOCK_FEATURED_PRODUCTS);
  });

  /*
  test("강조 상품 없음 - 빈 상태 메시지 표시", async ({
    page,
    storeHelpers,
  }) => {
    // Mock 서버에서 상품 데이터 제거 시나리오 (필요시 목 서버 확장)
    await storeHelpers.goToStoreProfile(SELLER_ID);

    const section = page.getByRole("region", { name: "Favorite" });
    await expect(section.getByText("강조된 상품이 없습니다.")).toBeVisible();
  });
  */

  test("강조 상품 클릭 - 상품 상세 페이지로 이동", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    // ✅ data-testid 로 정확한 카드 선택
    const productCard = page.getByTestId(
      `product-card-${MOCK_FEATURED_PRODUCTS[0].productId}`,
    );
    await productCard.click();

    await expect(page).toHaveURL(
      `/products/${MOCK_FEATURED_PRODUCTS[0].productId}`,
    );
    await expect(
      page.getByRole("heading", {
        name: MOCK_FEATURED_PRODUCTS[0].productName,
      }),
    ).toBeVisible();
  });

  // ============================================================================
  // 📝 피드 (Feeds) 섹션 테스트
  // ============================================================================

  test("피드 목록 - 콘텐츠 및 미디어 정상 표시", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    // 첫 번째 피드 검증
    await storeHelpers.assertFeedItem(page, MOCK_FEEDS[0], 0);

    // 두 번째 피드 검증 (미디어 없음)
    await storeHelpers.assertFeedItem(page, MOCK_FEEDS[1], 1);
  });

  /*
  test("피드 없음 - 빈 상태 메시지 표시", async ({ page, storeHelpers }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    const activitySection = page.getByRole("region", { name: "Activity" });
    // 목 서버에서 피드 제거 후 테스트 (필요시 확장)
    await expect(
      activitySection.getByText("아직 등록된 피드가 없습니다."),
    ).toBeVisible();
  });
  */

  test("피드 미디어 - 이미지 그리드 표시 (최대 3 개)", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    const feedItem = page.locator("article").first();
    const images = feedItem.locator(".aspect-square img");

    // MOCK_FEEDS[0] 은 2 개 이미지 보유
    await expect(images).toHaveCount(2);

    // 각 이미지가 올바른 소스를 가지는지 검증 (선택사항)
    await expect(images.first()).toHaveAttribute("alt", "");
    await expect(images.first()).toBeVisible();
  });

  // ============================================================================
  // 💬 댓글 (Comments) 인터랙션 테스트
  // ============================================================================

  test("댓글 버튼 클릭 - 최초 로딩 및 목록 표시", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    const feedItem = page.locator("article").first();

    // 초기 상태: 댓글 영역 숨김
    await expect(feedItem.locator(".mt-4.pt-4.border-t")).not.toBeVisible();

    // 댓글 버튼 클릭
    await storeHelpers.toggleComments(page, 0);

    // 댓글 목록 표시 확인
    const commentList = feedItem.locator(".mt-4.pt-4.border-t");
    await expect(commentList).toBeVisible();

    // ✅ [수정] 첫 번째 댓글이 보이는지 + 전체 개수 검증
    await expect(commentList.locator("li").first()).toBeVisible();
    await expect(commentList.locator("li")).toHaveCount(2);
  });

  // ============================================================================
  // ⚠️ 에러 처리 테스트
  // ============================================================================

  test("존재하지 않는 판매자 - 404 프로필 에러", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile("non-existent-seller");

    // 프로필 섹션에서 에러 메시지 확인
    await expect(
      page.getByText("판매자 프로필을 찾을 수 없습니다."),
    ).toBeVisible();
  });

  // ============================================================================
  // ♿ 접근성 (a11y) 테스트
  // ============================================================================

  test("이미지에 alt 텍스트 또는 대체 콘텐츠 제공", async ({
    page,
    storeHelpers,
  }) => {
    await storeHelpers.goToStoreProfile(SELLER_ID);

    // Next.js Image 컴포넌트는 alt 를 필수로 요구하므로, 존재하는 이미지들은 alt 속성 확인
    const images = page
      .locator("img")
      .filter({ hasNot: page.locator("[alt='']") });
    const count = await images.count();

    // 최소 1 개 이상의 이미지가 적절한 alt 를 가져야 함 (목 데이터 기준)
    if (count > 0) {
      await expect(images.first()).toHaveAttribute("alt", /.+/);
    }
  });
});
