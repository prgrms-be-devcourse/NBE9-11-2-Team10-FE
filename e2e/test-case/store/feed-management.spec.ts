// e2e/tests/feed-management.spec.ts
import { MOCK_USERS } from "../../mock-server/lib/mock-user-data";
import { test, expect, MOCK_FEEDS, MOCK_SELLER } from "./fixtures/store-fixture";

test.describe("✏️ 피드 관리 (CRUD) 기능", () => {
    const SELLER_ID = String(MOCK_SELLER.id);
    const BUYER_ID = String(MOCK_USERS.BUYER?.id);

    test.beforeEach(async ({ storeHelpers }) => {
        await storeHelpers.resetMockStoreData();
    });

    // ============================================================================
    // ➕ 피드 생성 테스트
    // ============================================================================

    test.describe("피드 생성 (Create)", () => {
        test("판매자 로그인 - 피드 생성 성공 (콘텐츠만)", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            // 폼 작성
            await storeHelpers.fillFeedForm({
                content: "🎉 신규 피드 테스트입니다! 정상 등록되는지 확인하세요.",
            });

            // 제출 및 성공 검증
            await storeHelpers.submitFeedForm();

            // 리다이렉트 후 피드 목록에서 새 피드 확인
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);
            await expect(
                page.locator("article").first().getByText("신규 피드 테스트입니다!")
            ).toBeVisible();
        });

        test("판매자 로그인 - 피드 생성 성공 (미디어 포함)", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            await storeHelpers.fillFeedForm({
                content: "📸 이미지가 포함된 피드입니다.",
                mediaUrls: [
                    "https://example.com/images/test-image-1.jpg",
                    "https://example.com/images/test-image-2.jpg",
                ],
            });

            await storeHelpers.submitFeedForm();
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);

            // 미디어 미리보기 검증
            const firstFeed = page.locator("article").first();
            await expect(firstFeed.locator(".aspect-square img")).toHaveCount(2);
        });

        test("판매자 로그인 - 공지사항 피드 생성", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            await storeHelpers.fillFeedForm({
                content: "📢 중요 공지: 시스템 점검 안내",
                isNotice: true,
            });

            await storeHelpers.submitFeedForm();
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);

            // 공지 배지 또는 스타일 검증 (구현에 따라 조정)
            const noticeBadge = page.locator("article").first().getByText("공지");
            await expect(noticeBadge).toBeVisible();
        });

        test("피드 생성 실패 - 내용 미입력", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            // 내용 없이 바로 제출 시도
            await storeHelpers.submitFeedForm();

            // 클라이언트 검증 에러 확인
            await storeHelpers.assertFeedFormError("피드 내용은 1자 이상 입력해야 합니다.");

            // 페이지 이동 없음 확인
            await expect(page).toHaveURL(`/stores/${SELLER_ID}/feeds/new`);
        });

        /*
        test("피드 생성 실패 - 내용 2000자 초과", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            const longContent = "a".repeat(2001);
            await storeHelpers.fillFeedForm({ content: longContent });
            await storeHelpers.submitFeedForm();

            await storeHelpers.assertFeedFormError("피드 내용은 2000자를 초과할 수 없습니다.");
        });
        */

        test("피드 생성 실패 - 잘못된 미디어 URL", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            await page.getByPlaceholder("https://example.com/image.jpg").fill("not-a-url");
            await page.getByRole("button", { name: "추가" }).click();

            // URL 검증 에러 (폼 내부 또는 전역)
            await expect(page.getByText("유효한 URL 형식이 아닙니다.")).toBeVisible();
        });

        test("비로그인 사용자 - 피드 생성 페이지 접근 시 로그인 유도", async ({
            page
        }) => {
            await page.goto(`/stores/${SELLER_ID}/feeds/new`);
            await expect(page).toHaveURL("/login?redirect=%2Fstores%2F1002%2Ffeeds%2Fnew");
        });

        test("구매자 로그인 - 피드 생성 권한 없음 (403)", async ({
            page,
            loginAsBuyer,
        }) => {
            await loginAsBuyer();
            await page.goto(`/stores/${SELLER_ID}/feeds/new`);

            await expect(
                page
                  .getByText(/본인의 스토어만 관리할 수 있습니다./)
                  .or(page.locator('meta[name="next-error"]')),
              ).toBeVisible();
        });
    });

    // ============================================================================
    // ✏️ 피드 수정 테스트
    // ============================================================================

    test.describe("피드 수정 (Update)", () => {
        const TARGET_FEED = MOCK_FEEDS[0];

        test("판매자 본인 - 피드 내용 수정 성공", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToEditFeed(SELLER_ID, TARGET_FEED.feedId);

            // 기존 내용 확인 (초기값 로드)
            const contentInput = page.getByTestId("content-input");
            await expect(contentInput).toHaveValue(TARGET_FEED.content);

            // 내용 수정
            await contentInput.fill("✏️ 수정된 피드 내용입니다.");
            await storeHelpers.submitFeedForm();

            // 목록 페이지로 리다이렉트 및 수정 내용 확인
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);
            await expect(
                page.locator("article").first().getByText("수정된 피드 내용입니다.")
            ).toBeVisible();
        });

        test("판매자 본인 - 미디어 추가/제거 수정", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToEditFeed(SELLER_ID, TARGET_FEED.feedId);

            // 기존 미디어 확인 (MOCK_FEEDS[0] 은 2개 이미지)
            await expect(page.locator(".aspect-square img")).toHaveCount(2);

            // 새 미디어 추가
            await page.getByPlaceholder("https://example.com/image.jpg")
                .fill("https://example.com/images/new-image.jpg");
            await page.getByRole("button", { name: "추가" }).click();

            // 기존 미디어 하나 제거 (첫 번째 이미지)
            await page.locator(".aspect-square").first()
                .getByRole("button", { name: "Remove media" }).click();

            await storeHelpers.submitFeedForm();
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);

            // 수정 결과: 1개 제거 + 1개 추가 = 여전히 2개 (순서 변경 가능)
            const updatedFeed = page.locator("article").first();
            await expect(updatedFeed.locator(".aspect-square img")).toHaveCount(2);
        });

        test("판매자 본인 - 공지사항 토글 수정", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToEditFeed(SELLER_ID, TARGET_FEED.feedId);

            // 공지사항 체크박스 토글
            const noticeCheckbox = page.getByTestId("notice-checkbox");
            await noticeCheckbox.click(); // 체크 -> 해제 또는 반대

            await storeHelpers.submitFeedForm();
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);

            // 공지 배지 상태 변경 확인 (구현에 따라 조정)
            // 예: 기존에 공지였으면 배지 사라짐, 아니면 생김
        });

        test("타인 (구매자) - 타인 피드 수정 시도 시 403", async ({
            page,
            storeHelpers,
            loginAsBuyer,
        }) => {
            await loginAsBuyer();

            // 직접 수정 페이지 접근 시도
            await page.goto(`/stores/${SELLER_ID}/feeds/${TARGET_FEED.feedId}/edit`);

            // 권한 없음 에러 또는 접근 거부
            await expect(
                page
                  .getByText(/본인의 스토어만 관리할 수 있습니다./)
                  .or(page.locator('meta[name="next-error"]')),
              ).toBeVisible();
        });

        test("존재하지 않는 피드 수정 시도 - 404", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await page.goto(`/stores/${SELLER_ID}/feeds/non-existent-feed/edit`);

            await expect(
                page.getByText("피드를 찾을 수 없습니다.")
            ).toBeVisible();
        });
    });

    // ============================================================================
    // 🗑️ 피드 삭제 테스트
    // ============================================================================

    test.describe("피드 삭제 (Delete)", () => {
        const TARGET_FEED = MOCK_FEEDS[0];

        test("판매자 본인 - 피드 삭제 성공", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToStoreProfile(SELLER_ID);

            // 삭제 전 피드 존재 확인
            const feedItem = page.locator("article").first();
            await expect(feedItem).toBeVisible();

            // 삭제 액션 실행
            await storeHelpers.clickDeleteFeed(0);

            // 삭제 후 목록에서 사라짐 확인
            await storeHelpers.assertFeedDeleted(TARGET_FEED.feedId);

            // 또는 전체 피드 개수 감소 확인
            await expect(page.locator("article")).toHaveCount(MOCK_FEEDS.length - 1);
        });

        test("삭제 확인 다이얼로그 - 취소 시 삭제 안 됨", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToStoreProfile(SELLER_ID);

            // 삭제 버튼 클릭
            const feedItem = page.locator("article").first();
            await feedItem.getByTestId("feed-actions").getByLabel("삭제").click();

            // 다이얼로그 취소
            page.once("dialog", (dialog) => dialog.dismiss());

            // 피드가 여전히 존재해야 함
            await expect(feedItem).toBeVisible();
        });

        test("타인 (구매자) - 타인 피드 삭제 시도 시 버튼 비활성화/숨김", async ({
            page,
            storeHelpers,
            loginAsBuyer,
        }) => {
            await loginAsBuyer();
            await storeHelpers.goToStoreProfile(SELLER_ID);

            // 구매자에게는 삭제 버튼이 노출되지 않아야 함
            const feedItem = page.locator("article").first();
            await expect(
                feedItem.getByTestId("feed-actions").getByLabel("삭제")
            ).not.toBeVisible();
        });

        // ============================================================================
        // ♻️ 캐시 무효화 및 부가 검증
        // ============================================================================

        test("피드 생성 후 목록 페이지 캐시 무효화 확인", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();

            // 1. 초기 목록 로드
            await storeHelpers.goToStoreProfile(SELLER_ID);
            const initialCount = await page.locator("article").count();

            // 2. 새 피드 생성
            await storeHelpers.goToCreateFeed(SELLER_ID);
            await storeHelpers.fillFeedForm({ content: "캐시 테스트 피드" });
            await storeHelpers.submitFeedForm();

            // 3. 목록 페이지로 돌아왔을 때 새 피드 포함 확인
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);
            await expect(page.locator("article")).toHaveCount(initialCount + 1);
            await expect(
                page.locator("article").first().getByText("캐시 테스트 피드")
            ).toBeVisible();
        });

        test("피드 수정 후 해당 피드 + 목록 페이지 동시 무효화", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            const targetFeed = MOCK_FEEDS[0];

            // 1. 수정 전 내용 확인 (목록)
            await storeHelpers.goToStoreProfile(SELLER_ID);
            await expect(
                page.locator("article").first().getByText(targetFeed.content)
            ).toBeVisible();

            // 2. 수정 실행
            await storeHelpers.goToEditFeed(SELLER_ID, targetFeed.feedId);
            await page.getByTestId("content-input").fill("✨ 캐시 무효화 테스트");
            await storeHelpers.submitFeedForm();

            // 3. 목록에서 수정된 내용 즉시 반영 확인
            await expect(page).toHaveURL(`/stores/${SELLER_ID}`);
            await expect(
                page.locator("article").first().getByText("캐시 무효화 테스트")
            ).toBeVisible();
        });

        // ============================================================================
        // ⚠️ 에러 처리 및 엣지 케이스
        // ============================================================================

        test("미디어 11 개 이상 추가 시도 시 클라이언트 차단", async ({
            page,
            storeHelpers,
            loginAsSeller,
        }) => {
            await loginAsSeller();
            await storeHelpers.goToCreateFeed(SELLER_ID);

            // 10 개 추가 (최대치)
            for (let i = 0; i < 10; i++) {
                await page.getByPlaceholder("https://example.com/image.jpg")
                    .fill(`https://example.com/img-${i}.jpg`);
                await page.getByRole("button", { name: "추가" }).click();
            }

            // 11 번째 추가 시도
            await page.getByPlaceholder("https://example.com/image.jpg")
                .fill("https://example.com/img-10.jpg");
            await page.getByRole("button", { name: "추가" }).click();

            // 최대 개수 초과 에러
            await expect(page.getByTestId("form-error")).toContainText(
                "이미지/영상은 최대 10개까지 업로드 가능합니다."
            );
        });
    });
});