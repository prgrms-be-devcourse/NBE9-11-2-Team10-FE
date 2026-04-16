import { test, expect } from "@playwright/test";

test.describe('로그아웃 기능 (Header)', () => {

  test.beforeEach(async ({ page }) => {
    // 로그인 페이지에서 시작
    await page.goto('/login');
    
    // ✅ 사전 조건: 로그인 수행
    await page.fill('input[name="email"]', 'success@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
    await expect(page.locator('header').getByText('길동이 님')).toBeVisible();
  });

  // ✅ 시나리오 1: 정상 로그아웃 - 헤더 상태 변화 및 쿠키 삭제 검증
  test('로그아웃 성공 시 헤더가 게스트 상태로 전환되고 쿠키가 삭제되어야 한다', async ({ page, context }) => {
    // 로그아웃 전 헤더 상태 재확인
    await expect(page.getByRole('link', { name: '로그인' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '회원가입' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '내 정보' })).toBeVisible();
    await expect(page.getByRole('link', { name: '장바구니' })).toBeVisible();

    // 로그아웃 버튼 클릭
    await page.getByRole('button', { name: '로그아웃' }).click();

    // 🔍 헤더 UI 변화 검증 (게스트 상태)
    await expect(page.getByRole('button', { name: '로그아웃' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
    await expect(page.locator('header').getByText('Guest')).toBeVisible();
    await expect(page.getByRole('link', { name: '내 정보' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '장바구니' })).not.toBeVisible();

    // 🔍 페이지 이동 검증
    await expect(page).toHaveURL('/login');

    await page.waitForTimeout(300);

    // 🔍 쿠키 삭제 검증
    const cookies = await context.cookies();
    const accessToken = cookies.find(c => c.name === 'accessToken');
    const refreshToken = cookies.find(c => c.name === 'refreshToken');

    expect(accessToken).toBeUndefined();
    expect(refreshToken).toBeUndefined();
  });

  // ✅ 시나리오 2: 서버 에러 발생 시에도 로컬 상태는 로그아웃 처리 (UX 우선)
  test('서버 에러로 로그아웃 실패하더라도 로컬 상태는 초기화되어야 한다', async ({ page, context }) => {
    // 🎭 Mock: 서버 500 에러 시뮬레이션
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: "서버 내부 오류가 발생했습니다.",
          errorCode: "INTERNAL_ERROR",
          timestamp: new Date().toISOString(),
        }),
      });
    });

    // 로그아웃 버튼 클릭
    await page.getByRole('button', { name: '로그아웃' }).click();

    // 🔍 로컬 상태는 초기화되었는지 검증 (헤더가 게스트 상태로 변경)
    await expect(page.getByRole('button', { name: '로그아웃' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.locator('header').getByText('Guest')).toBeVisible();

    // 🔍 페이지 이동 검증
    await expect(page).toHaveURL('/login');

    // 🔍 로컬 스토리지 캐시 삭제 확인
    const cachedUser = await page.evaluate(() => localStorage.getItem('cached_user'));
    expect(cachedUser).toBeNull();

    // 💡 참고: 서버 에러 시 쿠키는 서버 응답에 따라 삭제되지 않을 수 있음
    // 실제 운영환경에서는 재로그인 시 서버에서 쿠키 무효화를 다시 시도하거나,
    // 토큰 만료 처리를 통해 보안을 유지합니다.
  });

  // ✅ 시나리오 3: 네트워크 오류 시에도 로컬 상태 초기화 (오프라인/타임아웃 대응)
  test('네트워크 오류로 로그아웃 요청이 실패하더라도 로컬 상태는 초기화되어야 한다', async ({ page }) => {
    // 🎭 Mock: 네트워크 오류 시뮬레이션 (연결 실패)
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.abort('failed');
    });

    // 로그아웃 버튼 클릭
    await page.getByRole('button', { name: '로그아웃' }).click();

    // 🔍 로컬 상태 초기화 검증
    await expect(page.getByRole('button', { name: '로그아웃' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.locator('header').getByText('Guest')).toBeVisible();
    await expect(page).toHaveURL('/login');

    // 🔍 로컬 스토리지 캐시 삭제 확인
    const cachedUser = await page.evaluate(() => localStorage.getItem('cached_user'));
    expect(cachedUser).toBeNull();
  });

  // ✅ 시나리오 4: 로그아웃 후 새로고침 시에도 인증 상태 유지되지 않음
  test('로그아웃 후 페이지 새로고침 시 게스트 상태로 유지되어야 한다', async ({ page }) => {
    // 로그아웃 수행
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL('/login');

    // 🔁 페이지 새로고침
    await page.reload();

    // 🔍 새로고침 후에도 게스트 상태 유지 확인
    await expect(page.getByRole('button', { name: '로그아웃' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
    await expect(page.locator('header').getByText('Guest')).toBeVisible();
    
    // 🔍 로컬 스토리지에 캐시 없음 확인
    const cachedUser = await page.evaluate(() => localStorage.getItem('cached_user'));
    expect(cachedUser).toBeNull();
  });
});