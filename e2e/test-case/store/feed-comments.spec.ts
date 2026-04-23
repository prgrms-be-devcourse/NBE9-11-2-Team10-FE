// e2e/tests/feed-comments.spec.ts
import { MOCK_USERS } from "../../mock-server/lib/mock-user-data";
import { test, expect, MOCK_FEEDS, MOCK_SELLER } from "./fixtures/store-fixture";

test.describe("💬 피드 댓글 (Comment) CRUD 및 좋아요", () => {
    const SELLER_ID = String(MOCK_SELLER.id);
    const BUYER_ID = String(MOCK_USERS.BUYER?.id);
    const TARGET_FEED = MOCK_FEEDS[0];

    test.beforeEach(async ({ storeHelpers }) => {
        await storeHelpers.resetMockStoreData();
    });

    // 🔹 헬퍼: 특정 피드의 댓글 섹션 열기
    async function openCommentsForFeed(page: any, feedIndex = 0) {
        const feedItem = page.locator("article").nth(feedIndex);
        const commentBtn = feedItem.getByRole("button", { name: /💬/ });
        await commentBtn.click();
        // 댓글 목록 로딩 완료 대기
        await page.waitForSelector('[data-testid="comments-list"]', {
            state: "visible",
            timeout: 5000
        });
    }

    // ============================================================================
    // ➕ 댓글 생성 (Create) 테스트
    // ============================================================================
    test.describe("댓글 생성 (Create)", () => {
        test("구매자 로그인 - 댓글 생성 성공", async ({ page, storeHelpers, loginAsBuyer }) => {
            await loginAsBuyer();
            await storeHelpers.goToStoreProfile(SELLER_ID);
            await openCommentsForFeed(page, 0);

            const input = page.getByTestId("comment-input");
            await input.fill("이 댓글은 E2E 테스트용으로 작성되었습니다. ✅");
            await page.getByTestId("comment-submit-button").click();

            // 새 댓글이 목록 최상단에 추가되었는지 확인
            const newComment = page.locator('[data-testid="comments-list"] li').first();
            await expect(newComment).toContainText("이 댓글은 E2E 테스트용으로 작성되었습니다.");
            await expect(newComment).toContainText("(나)"); // 작성자 뱃지
        });

        test("댓글 생성 실패 - 빈 내용 / 공백만 입력", async ({ page, storeHelpers, loginAsBuyer }) => {
            await loginAsBuyer();
            await storeHelpers.goToStoreProfile(SELLER_ID);
            await openCommentsForFeed(page, 0);

            const input = page.getByTestId("comment-input");
            const submitBtn = page.getByTestId("comment-submit-button");

            // ✅ 1. 초기 빈 상태: 버튼이 비활성화되어 있는지 확인
            await expect(submitBtn).toBeDisabled();

            // ✅ 2. 공백만 입력 시에도 버튼 비활성화 상태 유지 확인
            await input.fill("   ");
            await expect(submitBtn).toBeDisabled();

            // ✅ 3. Enter 키 입력을 통한 클라이언트 검증 로직 트리거
            // CommentForm.tsx 의 handleKeyDown -> submitComment() 내부의 !content.trim() 검증 실행
            await input.press("Enter");

            await expect(page.getByTestId("comment-form-error"))
                .toContainText("댓글 내용을 입력해주세요.");

            // ✅ 5. 에러 발생 후에도 버튼은 여전히 비활성화 상태여야 함 (방어적 UX)
            await expect(submitBtn).toBeDisabled();
        });

        test("비로그인 사용자 - 댓글 입력 폼 비노출 또는 로그인 유도", async ({ page, storeHelpers,  }) => {
            await storeHelpers.goToStoreProfile(SELLER_ID);
            await openCommentsForFeed(page, 0);

            const input = page.getByTestId("comment-input");

            await input.fill("비로그인 테스트입니다.");

            await input.press("Enter");

            // 서버 측 에러 메세지 입력
            await expect(page.getByTestId("comment-form-error"))
                .toContainText("로그인 후 사용할 수 있습니다.");
        });
    });

    // ============================================================================
    // 🗑️ 댓글 삭제 (Delete) 테스트
    // ============================================================================
    test.describe("댓글 삭제 (Delete)", () => {
        test.beforeEach(async ({ page, storeHelpers, loginAsBuyer }) => {
            await loginAsBuyer();
            await storeHelpers.goToStoreProfile(SELLER_ID);
            await storeHelpers.toggleComments(page, 0);

            // 1. 테스트용 댓글 작성
            const input = page.getByTestId("comment-input");
            await expect(input).toBeVisible();
            await input.fill("🗑️ 삭제 테스트용 임시 댓글입니다.");
            await page.getByTestId("comment-submit-button").click();

            // 2. 생성된 댓글이 DOM 에 정상 렌더링될 때까지 대기
            const targetComment = page.locator('[data-testid="comments-list"] li').first();
            await expect(targetComment).toBeVisible();
            await expect(targetComment).toContainText("삭제 테스트용 임시 댓글입니다.");
        });
        test("작성자 본인 - 댓글 삭제 성공 (확인 다이얼로그 통과)", async ({ page, storeHelpers, loginAsBuyer }) => {
            // 첫 번째 댓글(본인 댓글)의 삭제 버튼 클릭
            const commentItem = page.locator('[data-testid="comments-list"] li').first();
            const deleteBtn = commentItem.getByRole("button", { name: "삭제" });
            await deleteBtn.click();

            // 인라인 확인 UI 노출 확인
            await expect(commentItem).toContainText("정말 삭제하시겠습니까?");
            await commentItem.getByRole("button", { name: "확인" }).click();

            const targetComment = page.locator('[data-testid="comments-list"] li').first();
            await expect(targetComment).toBeVisible();
            await expect(targetComment).not.toContainText("삭제 테스트용 임시 댓글입니다.");
        });

        test("작성자 본인 - 삭제 취소 시 댓글 유지", async ({ page, storeHelpers, loginAsBuyer }) => {
            const commentItem = page.locator('[data-testid="comments-list"] li').first();
            await commentItem.getByRole("button", { name: "삭제" }).click();
            await commentItem.getByRole("button", { name: "취소" }).click();

            // 취소 후에도 삭제 버튼이 다시 보여야 함 (원상복구)
            await expect(commentItem.getByRole("button", { name: "삭제" })).toBeVisible();
        });

        test("타인 (구매자 A) - 타인 댓글 삭제 버튼 비노출", async ({ page, storeHelpers, loginAsBuyer, loginAsSeller }) => {
            await page.getByTestId("comment-input").fill("A의 댓글");
            await page.getByTestId("comment-submit-button").click();

            // 2. 구매자 B 로그인 (또는 판매자)
            await loginAsSeller(); // 판매자는 타인 댓글 삭제 가능해야 하지만, 현재 명세상 "본인 댓글만"으로 가정
            await storeHelpers.goToStoreProfile(SELLER_ID);
            await openCommentsForFeed(page, 0);

            // 타인 댓글에는 삭제 버튼이 없어야 함
            const otherComment = page.locator('[data-testid="comments-list"] li').first();
            await expect(otherComment.getByRole("button", { name: "삭제" })).not.toBeVisible();
        });
    });

    // ============================================================================
    // ❤️ 댓글 좋아요 토글 테스트
    // ============================================================================
    test("구매자 - 댓글 좋아요 토글 성공 및 UI 반영", async ({ page, loginAsBuyer }) => {
        await loginAsBuyer();
        await page.goto(`/stores/${SELLER_ID}`);
        await openCommentsForFeed(page, 0);
      
        const commentItem = page.locator('[data-testid="comments-list"] li').first();
        const likeBtn = commentItem.getByTestId(/comment-like-button-/);
        
        // 초기 상태 확인
        const initialText = await likeBtn.textContent();
        const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || "0", 10);
        const wasLiked = await likeBtn.evaluate(el => el.classList.contains("text-red-500"));
      
        // 좋아요 클릭
        await likeBtn.click();
        
        // UI 즉시 반영 확인 (낙관적 업데이트)
        await expect(likeBtn).toHaveClass(wasLiked ? /text-gray-400/ : /text-red-500/);
        await expect(likeBtn).toContainText(String(wasLiked ? initialCount - 1 : initialCount + 1));
      });
});