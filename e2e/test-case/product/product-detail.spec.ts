// e2e/tests/product-detail.spec.ts
import { test, expect } from './fixtures/product-fixture';
import { MOCK_PRODUCTS } from './fixtures/product-fixture';

test.describe('🔍 상품 상세 페이지', () => {
  
  // 🔹 기본 로딩: 유효한 상품 ID
  test('유효한 상품 ID 로 상세 페이지 로딩', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.detailed.id);
    
    // ✅ 상품명 헤더
    await expect(page.getByRole('heading', { name: MOCK_PRODUCTS.detailed.name })).toBeVisible();
    
    // ✅ 가격 표시 (콤마 포함)
    await expect(page.getByText(`${MOCK_PRODUCTS.detailed.price.toLocaleString()}원`)).toBeVisible();
    
    // ✅ 이미지 표시
    const image = page.locator('img[alt="' + MOCK_PRODUCTS.detailed.name + '"]');
    await expect(image).toBeVisible();
    
    // ✅ 상품 유형
    await expect(page.getByText('실물 도서')).toBeVisible();
    
    // ✅ 상태 뱃지
    await expect(page.getByText('판매중')).toBeVisible();
  });

  // 🔹 재고 정보 표시
  test('재고 정보 정확히 표시', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.detailed.id);
    
    // ✅ 재고 행 존재 확인
    const stockRow = page.locator('text=재고').locator('..');
    await expect(stockRow).toBeVisible();
    
    // ✅ 재고 수량 표시
    await expect(stockRow.getByText(`${MOCK_PRODUCTS.detailed.stock}개`)).toBeVisible();
  });

  // 🔹 상품 설명 표시 (줄바꿈 처리)
  test('상품 설명 - 줄바꿈 및 최대 길이 처리', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.detailed.id);
    
    // ✅ 설명 섹션 존재
    await expect(page.getByText('상품 설명')).toBeVisible();
    
    // ✅ 설명 내용 표시 (whitespace-pre-wrap 로 줄바꿈 유지)
    const description = page.locator('text=' + MOCK_PRODUCTS.detailed.description.split('\n')[0]);
    await expect(description).toBeVisible();
  });

  // 🔹 액션 버튼: 판매중 + 재고 있음
  test('구매하기 버튼 - 판매중이고 재고 있을 때 활성화', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.detailed.id);
    
    const buyButton = page.getByRole('button', { name: '구매하기' });
    
    // ✅ 버튼 표시 및 활성화 상태
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toBeEnabled();
    await expect(buyButton).toHaveClass(/bg-blue-600/);
    
    // ✅ 장바구니 버튼도 활성화
    const cartButton = page.getByRole('button', { name: '장바구니 담기' });
    await expect(cartButton).toBeEnabled();
  });

  // 🔹 액션 버튼: 품절 상품
  test('구매하기 버튼 - 품절일 때 비활성화', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.soldOut.id);
    
    const buyButton = page.getByRole('button', { name: '구매 불가' });
    
    // ✅ 버튼 텍스트 변경 및 비활성화
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toBeDisabled();
    await expect(buyButton).toHaveClass(/bg-gray-200|opacity-50/);
    
    // ✅ 장바구니도 비활성화
    const cartButton = page.getByRole('button', { name: '장바구니 담기' });
    await expect(cartButton).toBeDisabled();
  });

  // 🔹 404: 존재하지 않는 상품
  test('존재하지 않는 상품 ID 접근 시 404 처리', async ({ page }) => {
    // 유효하지 않은 큰 ID
    await page.goto('/products/99999');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/404:/);
  });

  // 🔹 400: 잘못된 ID 형식
  test('잘못된 상품 ID 형식 접근 시 404 처리', async ({ page }) => {
    // 문자열 ID
    await page.goto('/products/abc');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/404:/);
  });

  // 🔹 Breadcrumb 네비게이션
  test('브레드크럼 - 목록 페이지로 이동 가능', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.springIntro.id);
    
    // ✅ Breadcrumb 표시 확인
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    
    // ✅ '상품 목록' 링크 클릭
    await page.getByRole('link', { name: '상품 목록' }).click();
    
    // ✅ 목록 페이지로 이동 확인
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('heading', { name: '상품 목록' })).toBeVisible();
  });

  // 🔹 이미지 없는 상품 처리
  test('이미지 URL 이 null 인 상품 - 이미지 컨테이너 유지', async ({ page, productHelpers }) => {
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.soldOut.id);
    
    // ✅ 이미지 컨테이너 존재
    const imageContainer = page.locator('.aspect-square').first();
    await expect(imageContainer).toBeVisible();
  });

  // 🔹 반응형: 모바일 레이아웃
  test('모바일 뷰포트 - 레이아웃 적응', async ({ page, productHelpers }) => {
    // ✅ 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await productHelpers.goToProductDetail(MOCK_PRODUCTS.detailed.id);
    
    // ✅ 상품명 여전히 표시
    await expect(page.getByRole('heading', { name: MOCK_PRODUCTS.detailed.name })).toBeVisible();
    
    // ✅ 버튼들이 세로 정렬 또는 적절한 간격 유지
    const actionButtons = page.locator('button').filter({ hasText: /구매|장바구니/ });
    await expect(actionButtons.first()).toBeVisible();
    
    // ✅ 이미지가 화면 너비에 맞게 조정
    const image = page.locator('img').first();
    const box = await image.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375); // 뷰포트 너비 이내
  });
});