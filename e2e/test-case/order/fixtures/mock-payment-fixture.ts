// e2e/tests/fixtures/mock-payment-fixture.ts
import { test as base, expect, Page, BrowserContext } from "@playwright/test";
import { MOCK_USERS } from "../../../mock-server/lib/mock-user-data";

const MOCK_ORDER_BUYER = MOCK_USERS.BUYER;
const MOCK_ORDER_SELLER = MOCK_USERS.SELLER;

export const test = base.extend<{
    mockPayment: {
        // 🔹 Mock Server URL 설정
        setMockServerUrl: (url: string) => void;

        // 🔹 결제 시나리오 설정 (성공/실패/타임아웃 등)
        setPaymentScenario: (scenario: PaymentScenario) => Promise<void>;

        // 🔹 Mock 데이터 초기화
        resetMockData: () => Promise<void>;

        resetScenario: () => Promise<void>;
    };
    // ✅ 수정: 실제 로그인 후 이동하는 함수로 변경
    goToAsBuyer: (url: string) => Promise<void>;
    goToAsSeller: (url: string) => Promise<void>;

    // ✅ 기존 login 함수도 유지 (별도 호출용)
    loginAsBuyer: () => Promise<void>;
    loginAsSeller: () => Promise<void>;
}>({
    mockPayment: async ({ page, context }, use) => {
        const MOCK_SERVER_URL = process.env.MOCK_SERVER_URL || "http://localhost:4000";

        // 🔹 모든 요청에 E2E 인증 헤더 자동 주입
        await context.setExtraHTTPHeaders({
            "x-e2e-user-id": String(MOCK_USERS.BUYER.id),
        });

        const helpers = {
            setMockServerUrl: (url: string) => {
                // NEXT_PUBLIC_API_URL 환경변수 오버라이드 (테스트 실행 시 설정 권장)
                process.env.NEXT_PUBLIC_API_URL = url;
            },

            setPaymentScenario: async (scenario: string) => {
                const response = await context.request.post(
                  `${MOCK_SERVER_URL}/api/v1/__debug/__e2e/set-payment-scenario`,
                  { data: { scenario } }
                );
                if (response.status() !== 200) {
                  throw new Error(`Failed to set payment scenario: ${await response.text()}`);
                }
              },

            resetMockData: async () => {
                await context.request.post(`${MOCK_SERVER_URL}/api/v1/__reset`);
                await context.request.fetch(`${MOCK_SERVER_URL}/api/v1/__reset`, { method: "POST" });
              },

            resetScenario: async () => {
                await context.request.post(`${MOCK_SERVER_URL}/api/v1/__debug/__e2e/reset-payment-scenario`);
            },
        };

        await use(helpers);
    },
    goToAsBuyer: async ({ page, context, loginAsBuyer }, use) => {
        await use(async (url: string) => {
            await context.setExtraHTTPHeaders({
                "x-e2e-user-id": `${MOCK_USERS.BUYER.id}`, // MOCK_USERS.BUYER.id
              });
            // 1. 현재 로그인 상태 확인 (간단한 체크)
            const isAlreadyLoggedIn = await page
                .locator(`text=${MOCK_ORDER_BUYER.nickname} 님`)
                .isVisible()
                .catch(() => false);

            // 2. 로그인이 안 되어 있으면 실행
            if (!isAlreadyLoggedIn) {
                await loginAsBuyer(); // ✅ 기존 로그인 픽스처 재사용
            }

            // 3. 목표 페이지로 이동
            await page.goto(url);
            await page.waitForLoadState("networkidle");
        });
    },

    // 🔹 판매자로 로그인 후 페이지 이동
    goToAsSeller: async ({ page, loginAsSeller }, use) => {
        await use(async (url: string) => {
            const isAlreadyLoggedIn = await page
                .locator(`text=${MOCK_ORDER_SELLER.nickname} 님`)
                .isVisible()
                .catch(() => false);

            if (!isAlreadyLoggedIn) {
                await loginAsSeller();
            }

            await page.goto(url);
            await page.waitForLoadState("networkidle");
        });
    },

    // 🔹 기존 로그인 픽스처 (그대로 유지)
    loginAsBuyer: async ({ page }, use) => {
        await use(async () => {
            await page.goto("/login");
            await page.waitForLoadState("networkidle");

            await page.fill('input[name="email"]', MOCK_ORDER_BUYER.email);
            await page.fill('input[name="password"]', MOCK_ORDER_BUYER.password);

            const responsePromise = page.waitForResponse(
                (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200,
            );

            await page.click('button[type="submit"]');
            await responsePromise;
            await page.waitForURL(/^(?!.*\/login)/);
            await page.waitForLoadState("networkidle");

            await expect(page.getByText(`${MOCK_ORDER_BUYER.nickname} 님`)).toBeVisible();
        });
    },

    loginAsSeller: async ({ page }, use) => {
        await use(async () => {
            await page.goto("/login");
            await page.waitForLoadState("networkidle");

            await page.fill('input[name="email"]', MOCK_ORDER_SELLER.email);
            await page.fill('input[name="password"]', MOCK_ORDER_SELLER.password);

            const responsePromise = page.waitForResponse(
                (res) => res.url().includes("/api/v1/auth/login") && res.status() === 200,
            );

            await page.click('button[type="submit"]');
            await responsePromise;
            await page.waitForURL(/^(?!.*\/login)/);
            await page.waitForLoadState("networkidle");

            await expect(page.getByText(`${MOCK_ORDER_SELLER.nickname} 님`)).toBeVisible();
        });
    },
});

// 🔹 Mock Server 지원 시나리오 타입
/*
export type PaymentScenario = 
  | "SUCCESS"
  | "NOT_FOUND_PAYMENT"
  | "NOT_FOUND_PAYMENT_SESSION"
  | "REJECT_ACCOUNT_PAYMENT"
  | "REJECT_CARD_PAYMENT"
  | "REJECT_CARD_COMPANY"
  | "FORBIDDEN_REQUEST"
  | "INVALID_PASSWORD"
  | "ALREADY_PROCESSED_PAYMENT"
  | "INVALID_REQUEST"
  | "INVALID_API_KEY"
  | "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING"
  | "UNKNOWN_PAYMENT_ERROR"
  | "NETWORK_ERROR_FINAL_FAILED";
  */

export type PaymentScenario =
    | "SUCCESS"
    | "REJECT_CARD_PAYMENT"
    | "REJECT_CARD_COMPANY"
    | "INVALID_REQUEST"
    | "ALREADY_PROCESSED_PAYMENT"
    | "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING"
    | "NETWORK_ERROR_FINAL_FAILED";

export { expect };