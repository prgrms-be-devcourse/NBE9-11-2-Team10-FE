// e2e/test-case/auth/fixture/auth-fixture.ts
import { test as base, expect, Page } from "@playwright/test";
import { MOCK_USERS } from "../../../mock-server/lib/mock-user-data";

export type MockUser = {
  id: number;
  email: string;
  password: string;
  nickname: string;
  role: 'BUYER' | 'SELLER';
};

export type AuthRole = MockUser['role'];

// -----------------------------------------------------------------------------
// 🔹 단일 픽스처로 통합 (안전한 저장소 처리)
// -----------------------------------------------------------------------------
export const test = base.extend<{
  authHelper: {
    login: (role?: AuthRole) => Promise<MockUser>;
    logout: () => Promise<void>;
    reset: () => Promise<void>;
    expectRedirectToLogin: (expectedRedirect?: string) => Promise<void>;
    expectRedirectToAccessDenied: () => Promise<void>;
    expectLoading: () => Promise<void>;
    expectLoggedIn: (nickname: string) => Promise<void>;
  };
}>({
  authHelper: async ({ page }, use) => {
    // ✅ 테스트용 기본 URL (환경변수 또는 기본값)
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const helpers = {
      // 🔹 로그인
      login: async (role: AuthRole = 'BUYER') => {
        const user = role === 'SELLER' ? MOCK_USERS.SELLER : MOCK_USERS.BUYER;
        
        await page.goto(`${BASE_URL}/login`);
        await page.waitForLoadState("networkidle");
        await page.fill('input[name="email"]', user.email);
        await page.fill('input[name="password"]', user.password);

        const responsePromise = page.waitForResponse(
          (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200,
        );
        await page.click('button[type="submit"]');
        await responsePromise;
        await page.waitForLoadState("networkidle");

        await expect(page.getByText(`${user.nickname} 님`, { exact: false })).toBeVisible({ timeout: 5000 });
        return user;
      },

      // 🔹 로그아웃
      logout: async () => {
        const btn = page.getByTestId('logout-button');
        if (await btn.isVisible()) {
          await btn.click();
          await page.waitForLoadState('networkidle');
        }
        // ✅ 쿠키 기반 인증이므로 쿠키만 정리하면 충분
        await page.context().clearCookies();
      },

      // 🔹 인증 상태 초기화 (수정된 핵심 부분)
      reset: async () => {
        // 1. 쿠키 초기화 (항상 안전)
        await page.context().clearCookies();
        
        // 2. localStorage/sessionStorage 초기화 (origin 이 있는 상태에서만 실행)
        //    → 먼저 유효한 페이지로 이동한 후 실행
        try {
          await page.goto(`${BASE_URL}/login`, { waitUntil: 'commit' });
          await page.evaluate(() => {
            try {
              localStorage.clear();
              sessionStorage.clear();
            } catch (e) {
              // 크로스 오리진 등 접근 불가 시 무시 (안전 처리)
              console.warn('Storage clear skipped:', e);
            }
          });
        } catch (e) {
          // 페이지 이동 실패 시에도 테스트는 계속 진행
          console.warn('Reset navigation failed, continuing:', e);
        }
        
        // 3. 페이지 리로드 (선택사항)
        await page.reload({ waitUntil: 'networkidle' });
      },

      // 🔹 로그인 페이지 리다이렉트 확인
      expectRedirectToLogin: async (expectedRedirect?: string) => {
        await page.waitForURL(/\/login/, { timeout: 10000 });
        if (expectedRedirect) {
          const url = new URL(page.url());
          expect(url.searchParams.get('redirect')).toBe(expectedRedirect);
        }
      },

      // 🔹 접근 거부 페이지 리다이렉트 확인
      expectRedirectToAccessDenied: async () => {
        await page.waitForURL(/\/access-denied/, { timeout: 10000 });
      },

      // 🔹 가드 로딩 상태 확인
      expectLoading: async () => {
        await expect(
          page.getByText('접근 권한을 확인 중입니다...').or(
            page.locator('[data-testid="guard-loading"]')
          )
        ).toBeVisible({ timeout: 3000 });
      },

      // 🔹 로그인 상태 확인
      expectLoggedIn: async (nickname: string) => {
        await expect(page.getByText(`${nickname} 님`, { exact: false })).toBeVisible({ timeout: 5000 });
      },
    };

    await use(helpers);
  },
});

export { expect };
export { MOCK_USERS };