import { APIRequestContext, expect, test } from "@playwright/test";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function loginAs(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
    data: { email, password },
  });

  expect(response.status()).toBe(200);
}

test.describe("내 프로필 API", () => {
  test("비로그인 상태에서 /users/me 는 401 을 반환해야 한다", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/users/me`);

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      status: 401,
      errorCode: "AUTH_REQUIRED",
      detail: "로그인 후 사용할 수 있습니다.",
    });
  });

  test("BUYER 로그인 후 /users/me 는 내 프로필을 반환해야 한다", async ({ request }) => {
    await loginAs(request, "buyer@example.com", "buyer1234!");

    const response = await request.get(`${API_BASE_URL}/api/v1/users/me`);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        id: 1001,
        email: "buyer@example.com",
        name: "구매자",
        nickname: "구매자님",
        phoneNumber: "010-2222-3333",
        address: "서울시 강남구 테헤란로 123 202호",
      },
    });
  });

  test("SELLER 로그인 후 /sellers/me 는 내 프로필을 반환해야 한다", async ({ request }) => {
    await loginAs(request, "seller@example.com", "seller1234!");

    const response = await request.get(`${API_BASE_URL}/api/v1/sellers/me`);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        id: 1002,
        email: "seller@example.com",
        name: "홍길동",
        nickname: "판매자님",
        phoneNumber: "010-1111-2222",
        address: "경기 성남시 분당구 판교역로 166 1102동 304호",
        businessNumber: "123-45-67890",
        bio: "",
      },
    });
  });

  test("BUYER 는 /users/me 수정 시 address 기반 payload 를 저장해야 한다", async ({ request }) => {
    await loginAs(request, "buyer@example.com", "buyer1234!");

    const updateResponse = await request.put(`${API_BASE_URL}/api/v1/users/me`, {
      data: {
        nickname: "짱아형아",
        phoneNumber: "010-2345-4564",
        address: "부산광역시 부산진구 어쩌구",
      },
    });

    expect(updateResponse.status()).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      success: true,
      data: {
        nickname: "짱아형아",
        phoneNumber: "010-2345-4564",
        address: "부산광역시 부산진구 어쩌구",
      },
    });
  });

  test("SELLER 는 /sellers/me 수정 시 address, bio, businessNumber 를 함께 저장해야 한다", async ({
    request,
  }) => {
    await loginAs(request, "seller@example.com", "seller1234!");

    const updateResponse = await request.put(`${API_BASE_URL}/api/v1/sellers/me`, {
      data: {
        nickname: "짱아형아",
        phoneNumber: "010-2345-4564",
        address: "부산광역시 부산진구 어쩌구",
        bio: "이번에는 시를 써봤습니다.",
        businessNumber: "123-234-345678",
      },
    });

    expect(updateResponse.status()).toBe(200);
    await expect(updateResponse.json()).resolves.toMatchObject({
      success: true,
      data: {
        nickname: "짱아형아",
        phoneNumber: "010-2345-4564",
        address: "부산광역시 부산진구 어쩌구",
        bio: "이번에는 시를 써봤습니다.",
        businessNumber: "123-234-345678",
      },
    });
  });
});
