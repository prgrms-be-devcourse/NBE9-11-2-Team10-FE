import { test, expect } from "@playwright/test";
import { expectErrorMessageVisible } from "../../utils/helper";

test.describe('로그인 폼 (LoginForm)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // ✅ 시나리오 1: 성공 케이스
  test('유효한 정보로 로그인이 성공해야 한다', async ({ page }) => {
    // Mock Server: 'success@example.com' + 'TestPass123!' → 200 OK
    await page.fill('input[name="email"]', 'success@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    
    await page.click('button[type="submit"]');

    // Server Action 성공 시 /dashboard 로 리다이렉트
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // (선택) 대시보드 페이지에 사용자 정보가 렌더링되었는지 확인
    // await expect(page.locator('text=길동이')).toBeVisible();
  });

  // ❌ 시나리오 2: 비밀번호 형식 오류 (클라이언트/서버 공통 검증)
  test('비밀번호 형식이 올바르지 않으면 에러가 표시되어야 한다', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short'); // 8자 미만
    
    await page.click('button[type="submit"]');

    // Zod 스키마 에러 메시지 확인
    await expectErrorMessageVisible(page, '비밀번호는 8자 이상이어야 합니다.');
    
    // 에러 발생 시 입력 필드에 에러 스타일 적용 확인
    await expect(page.locator('input[name="password"]')).toHaveClass(/border-red-500|bg-red-50/);

    // 로그인 실패 시에도 페이지는 유지 (리다이렉트 없음)
    await expect(page).toHaveURL('/login');
  });

  // ❌ 시나리오 3: 이메일 형식 오류
  test('이메일 형식이 올바르지 않으면 에러가 표시되어야 한다', async ({ page }) => {
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'TestPass123!');
    
    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '올바른 이메일 형식이 아닙니다.');
    await expect(page.locator('input[name="email"]')).toHaveClass(/border-red-500|bg-red-50/);

    // 로그인 실패 시에도 페이지는 유지 (리다이렉트 없음)
    await expect(page).toHaveURL('/login');
  });

  // ❌ 시나리오 4: 아이디 또는 비밀번호 불일치 (404 - USER_004)
  test('존재하지 않는 이메일로 로그인 시 에러가 표시되어야 한다', async ({ page }) => {
    // Mock Server: 'notfound@example.com' → 404 Not Found
    await page.fill('input[name="email"]', 'notfound@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    
    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '아이디 또는 비밀번호가 일치하지 않습니다.');
    
    // 로그인 실패 시에도 페이지는 유지 (리다이렉트 없음)
    await expect(page).toHaveURL('/login');
  });

  // ❌ 시나리오 5: 비밀번호 불일치 (404 - USER_004)
  test('잘못된 비밀번호로 로그인 시 에러가 표시되어야 한다', async ({ page }) => {
    // Mock Server: 'success@example.com' + 'WrongPassword!' → 404
    await page.fill('input[name="email"]', 'success@example.com');
    await page.fill('input[name="password"]', 'WrongPassword2!');
    
    await page.click('button[type="submit"]');

    await expectErrorMessageVisible(page, '아이디 또는 비밀번호가 일치하지 않습니다.');

    // 로그인 실패 시에도 페이지는 유지 (리다이렉트 없음)
    await expect(page).toHaveURL('/login');
  });

  // ❌ 시나리오 6: 필수 필드 공백 제출
  test('필수 필드를 비우고 제출하면 에러가 표시되어야 한다', async ({ page }) => {
    await page.click('button[type="submit"]');

    // 이메일 필수 검증
    await expectErrorMessageVisible(page, '올바른 이메일 형식이 아닙니다.');

    // 로그인 실패 시에도 페이지는 유지 (리다이렉트 없음)
    await expect(page).toHaveURL('/login');
  });
});