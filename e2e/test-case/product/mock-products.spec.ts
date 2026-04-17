import { test, expect } from '@playwright/test';

const MOCK_API = 'http://localhost:4000/api/v1';
const SELLER_ID = '1002'; // MOCK_USERS.SELLER.id

test.describe('상품 관리 E2E', () => {
  
  test.beforeEach(async ({ request }) => {
    // 테스트 전 목 데이터 초기화
    await request.delete(`${MOCK_API}/stores/me/products/__reset`);
  });

  test('판매자가 상품을 등록할 수 있다', async ({ request }) => {
    const response = await request.post(`${MOCK_API}/stores/me/products`, {
      headers: { 'x-mock-user-id': SELLER_ID },
      data: {
        productName: '테스트 상품',
        price: 15000,
        stock: 30,
        type: 'BOOK',
        description: 'E2E 테스트용 상품입니다.',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      productId: expect.any(Number),
      productName: '테스트 상품',
      price: 15000,
      stock: 30,
      type: 'BOOK',
      status: 'SELLING',
    });
  });

  test('인증 없이 상품 등록 시 401 반환', async ({ request }) => {
    const response = await request.post(`${MOCK_API}/stores/me/products`, {
      data: { productName: 'Unauthorized', price: 1000, stock: 1, type: 'BOOK' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.errorCode).toBe('AUTH_REQUIRED');
  });

  test('상품 목록을 페이징과 필터로 조회할 수 있다', async ({ request }) => {
    const response = await request.get(`${MOCK_API}/products?page=0&size=2&type=BOOK`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      content: expect.arrayContaining([
        expect.objectContaining({ type: 'BOOK' })
      ]),
      page: 0,
      size: 2,
      totalElements: expect.any(Number),
    });
  });

  test('존재하지 않는 상품 조회 시 404 반환', async ({ request }) => {
    const response = await request.get(`${MOCK_API}/products/99999`);
    
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.errorCode).toBe('PRODUCT_001');
  });

  test('판매자만 상품을 수정할 수 있다', async ({ request }) => {
    // 1. 상품 등록
    const createRes = await request.post(`${MOCK_API}/stores/me/products`, {
      headers: { 'x-mock-user-id': SELLER_ID },
      data: { productName: '원본', price: 10000, stock: 10, type: 'BOOK' },
    });
    const { productId } = await createRes.json();

    // 2. 동일 판매자가 수정
    const updateRes = await request.put(`${MOCK_API}/stores/me/products/${productId}`, {
      headers: { 'x-mock-user-id': SELLER_ID },
      data: { productName: '수정됨', price: 12000 },
    });
    expect(updateRes.status()).toBe(200);
    expect((await updateRes.json()).productName).toBe('수정됨');

    // 3. 다른 사용자 (구매자) 가 수정 시도 → 403
    const forbiddenRes = await request.put(`${MOCK_API}/stores/me/products/${productId}`, {
      headers: { 'x-mock-user-id': '1001' }, // BUYER
      data: { productName: '불법수정' },
    });
    expect(forbiddenRes.status()).toBe(403);
  });

  test('상품 비활성화 후 목록에서 조회되지 않는다', async ({ request }) => {
    // 1. 상품 등록
    const createRes = await request.post(`${MOCK_API}/stores/me/products`, {
      headers: { 'x-mock-user-id': SELLER_ID },
      data: { productName: '비활성화 대상', price: 5000, stock: 5, type: 'FOOD' },
    });
    const { productId } = await createRes.json();

    // 2. 비활성화
    const deactivateRes = await request.patch(
      `${MOCK_API}/stores/me/products/${productId}/inactive`,
      { headers: { 'x-mock-user-id': SELLER_ID } }
    );
    expect(deactivateRes.status()).toBe(200);

    // 3. 목록 조회 시 제외됨 확인
    const listRes = await request.get(`${MOCK_API}/products?type=FOOD`);
    const listBody = await listRes.json();
    expect(listBody.content).not.toContainEqual(
      expect.objectContaining({ productId })
    );

    // 4. 상세 조회 시 404
    const detailRes = await request.get(`${MOCK_API}/products/${productId}`);
    expect(detailRes.status()).toBe(404);
  });
});