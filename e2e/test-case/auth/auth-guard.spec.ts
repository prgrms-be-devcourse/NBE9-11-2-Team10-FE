// e2e/tests/auth/auth-guard.spec.ts
import { test, expect, MOCK_USERS } from "./fixture/auth-fixture";

test.describe('🛡️ AuthGuard - 로그인 필요 경로 접근 제어', () => {
  
  const PROTECTED_ROUTES = [
    '/orders',
  ];

  test.beforeEach(async ({ authHelper }) => {
    await authHelper.reset();
  });

  test('❌ 비로그인 사용자 → 로그인 페이지 리다이렉트', async ({ page, authHelper }) => {
    for (const route of PROTECTED_ROUTES) {
      await test.step(`경로: ${route}`, async () => {
        await page.goto(route);
        await authHelper.expectRedirectToLogin(route);
        await expect(page.locator('input[name="email"]')).toBeVisible();
      });
    }
  });

  test('✅ 로그인한 구매자 → 보호된 경로 정상 접근', async ({ page, authHelper }) => {
    await authHelper.login('BUYER');

    for (const route of PROTECTED_ROUTES) {
      await test.step(`경로: ${route}`, async () => {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await expect(page).not.toHaveURL(/\/login/);
      });
    }
  });
});