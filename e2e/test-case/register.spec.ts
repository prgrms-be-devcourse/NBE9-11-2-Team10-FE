import test, { expect } from "@playwright/test";
import { expectErrorMessageVisible } from "../utils/helper";


test.describe('회원가입 폼 (RegisterForm)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/register?role=BUYER');
  });

  // ✅ 시나리오 1: 성공 케이스
  test('유효한 정보로 회원가입이 성공해야 한다', async ({ page }) => {
    // ✅ 목 서버는 이미 globalSetup 에서 실행 중
    // 기본 핸들러가 200 응답을 반환하도록 설정되어 있음

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123#');
    await page.fill('input[name="name"]', '테스트유저');
    await page.fill('input[name="nickname"]', '테스터');
    await page.fill('input[name="phoneNumber"]', '010-1234-5678');
    await page.fill('input[name="roadAddress"]', '예시 도로명 주소');
    await page.fill('input[name="detailAddress"]', '101동 101호');

    await page.click('button[type="submit"]');

    // ✅ Server Action 이 목 서버의 200 응답을 받아 성공 처리
    await expect(page.locator('text=회원가입이 완료되었습니다')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  // ❌ 시나리오 2: 비밀번호 형식 오류
  test('비밀번호 형식이 올바르지 않으면 에러가 표시되어야 한다', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');
    await page.fill('input[name="name"]', '테스트');
    await page.fill('input[name="nickname"]', 'tester');
    await page.fill('input[name="phoneNumber"]', '010-1111-2222');
    await page.fill('input[name="detailAddress"]', '101호');

    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '특수문자를 포함해야 합니다.');
  });

  // ❌ 시나리오 3: 이메일 형식 오류
  test('이메일 형식이 올바르지 않으면 에러가 표시되어야 한다', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'TestPass123');
    await page.fill('input[name="name"]', '테스트');
    await page.fill('input[name="nickname"]', 'tester');
    await page.fill('input[name="phoneNumber"]', '010-1111-2222');
    await page.fill('input[name="detailAddress"]', '101호');

    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '올바른 이메일 형식이 필요합니다.');
  });

  // ❌ 시나리오 4: 중복 이메일 (409 Conflict)
  test('중복 이메일이면 409 에러가 표시되어야 한다', async ({ page }) => {
    // ✅ handlers.ts 에서 'duplicate@example.com' → 409 로직 이미 구현
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'TestPass123@');
    await page.fill('input[name="name"]', '테스트');
    await page.fill('input[name="nickname"]', 'tester');
    await page.fill('input[name="phoneNumber"]', '010-1111-2222');
    await page.fill('input[name="roadAddress"]', '예시 도로명 주소');
    await page.fill('input[name="detailAddress"]', '101호');

    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '이미 사용 중인 이메일입니다');
  });

  // ❌ 시나리오 5: 도로명 주소 누락
  test('도로명 주소를 입력하지 않으면 주소 에러가 표시된다', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123');
    await page.fill('input[name="name"]', '테스트유저');
    await page.fill('input[name="nickname"]', '테스터');
    await page.fill('input[name="phoneNumber"]', '010-1234-5678');
    // roadAddress 누락
    await page.fill('input[name="detailAddress"]', '101동 101호');

    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '주소는 필수입니다');
  });

  // ✅ 시나리오 6: 이메일 중복 체크 - 사용 가능
  test('이메일 중복 체크에서 사용 가능한 이메일이면 성공 메시지가 표시된다', async ({ page }) => {
    await page.fill('input[name="email"]', 'newuser@example.com');

    await page.getByTestId('email-duplicate-check-btn').click();

    // 로딩 상태 거친 후 성공 메시지 확인
    await expectErrorMessageVisible(page, '사용 가능한 이메일입니다.');
    await expect(page.locator('button:has-text("확인됨")')).toBeVisible();
  });

  // ✅ 시나리오 7: 이메일 중복 체크 - 중복된 이메일
  test('이메일 중복 체크에서 이미 사용 중인 이메일이면 에러 메시지가 표시된다', async ({ page }) => {
    await page.fill('input[name="email"]', 'duplicate@example.com');

    await page.getByTestId('email-duplicate-check-btn').click();

    await expectErrorMessageVisible(page, '이미 사용 중인 이메일입니다.');

    // 에러 시 border-red-500 클래스 적용 확인
    await expect(page.locator('input[name="email"]')).toHaveClass(/border-red-500/);

    await expect(page.getByTestId('email-duplicate-check-btn')).toBeEnabled();

    await expect(page.getByTestId('email-duplicate-check-btn')).toHaveText('중복 확인');
  });

  // ✅ 시나리오 8: 닉네임 중복 체크 - 사용 가능
  test('닉네임 중복 체크에서 사용 가능한 닉네임이면 성공 메시지가 표시된다', async ({ page }) => {
    await page.fill('input[name="nickname"]', 'UniqueNick123');

    await page.getByTestId('nickname-duplicate-check-btn').click();

    await expectErrorMessageVisible(page, '사용 가능한 닉네임입니다.');
    await expect(page.locator('button:has-text("확인됨")')).toBeVisible();
    await expect(page.locator('input[name="nickname"]')).toBeDisabled();
  });

  // ✅ 시나리오 9: 닉네임 중복 체크 - 중복된 닉네임
  test('닉네임 중복 체크에서 이미 사용 중인 닉네임이면 에러 메시지가 표시된다', async ({ page }) => {
    await page.fill('input[name="nickname"]', '중복닉네임');

    await page.getByTestId('nickname-duplicate-check-btn').click();

    await expectErrorMessageVisible(page, '이미 사용 중인 닉네임입니다.');
    await expect(page.locator('input[name="nickname"]')).toHaveClass(/border-red-500/);
  });
  // ✅ 시나리오 10: 값 없이 중복 체크 버튼 클릭 시 안내 메시지
  test('값을 입력하지 않고 중복 체크 버튼을 클릭하면 안내 메시지가 표시된다', async ({ page }) => {
    // 이메일
    await page.getByTestId('email-duplicate-check-btn').click();
    await expect(page.locator('text=값을 입력해 주세요.')).toBeVisible();

    // 닉네임
    await page.getByTestId('nickname-duplicate-check-btn').click();
    await expect(page.locator('text=값을 입력해 주세요.').nth(1)).toBeVisible();
  });
});