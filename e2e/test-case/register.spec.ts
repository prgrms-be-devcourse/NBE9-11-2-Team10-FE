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

    await expect(page.locator('text=주소는 필수입니다')).toBeVisible();
  });
});