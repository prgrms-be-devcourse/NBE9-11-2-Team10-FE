import { test, expect } from "@playwright/test";

const NEXT_APP = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

test.describe("쿠키 포워딩 검증 (Next.js 라우터 통함)", () => {
  test.beforeAll(() => {
    // 🔍 실행 시점의 실제 환경변수 확인
    console.log("🔍 [E2E ENV CHECK]");
    console.log("  NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    console.log("  NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
    console.log("  NODE_ENV:", process.env.NODE_ENV);
  });

  test.beforeEach(async ({ page }) => {
    // 🔹 브라우저 컨텍스트에 테스트용 쿠키 주입
    await page.context().addCookies([
      {
        name: "accessToken",
        value: "e2e_mock_cookie_xyz789",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false, // 로컬 테스트용
      },
    ]);
  });

  test("디버그 엔드포인트가 정상적으로 응답하는지 먼저 확인", async ({
    page,
  }) => {
    // 🔹 1. 상태 코드 먼저 확인
    const response = await page.request.get(
      `${NEXT_APP}/api/for-debug/forward-headers`,
    );

    // 🔹 2. HTML 이 반환되었는지 체크 (방어 코드)
    const contentType = response.headers()["content-type"] || "";
    if (contentType.includes("text/html")) {
      const html = await response.text();
      console.error("❌ HTML 응답 수신 (예상: JSON):");
      console.error(html.substring(0, 500)); // 앞부분만 로그
      throw new Error(
        `Expected JSON but received HTML. Status: ${response.status()}`,
      );
    }

    // 🔹 3. 이제 JSON 파싱 시도
    const body = await response.json();

    // 🔹 4. 실제 검증
    expect(response.status()).toBe(200);
    expect(body.status).toBe("success");

    console.log("✅ 디버그 엔드포인트 응답 성공:", body.cookie);
  });

  test("브라우저 쿠키가 Next.js 를 통해 백엔드 형식으로 포워딩된다", async ({
    page,
  }) => {
    // ✅ Next.js 디버그 라우터 호출 (page.request 는 브라우저 쿠키 컨텍스트를 공유함)
    const response = await page.request.get(
      `${NEXT_APP}/api/for-debug/forward-headers`,
    );
    const body = await response.json();

    // 🔍 응답 검증
    expect(response.status()).toBe(200);
    expect(body.status).toBe("success");
    expect(body.cookie).toBe("accessToken=e2e_mock_cookie_xyz789");
    expect(body.forwardedHeaders["Content-Type"]).toBe("application/json");

    console.log("✅ 쿠키 포워딩 검증 성공:", body.cookie);
  });

  test("쿠키가 없을 경우 Cookie 헤더가 포함되지 않는다", async ({ page }) => {
    // 쿠키가 없는 새로운 컨텍스트 생성
    const context = await page.context().browser()?.newContext();
    const newPage = await context!.newPage();

    const response = await newPage.request.get(
      `${NEXT_APP}/api/for-debug/forward-headers`,
    );
    const body = await response.json();

    expect(body.cookie).toBeNull();
    expect(body.forwardedHeaders["Cookie"]).toBeUndefined();
  });
});
