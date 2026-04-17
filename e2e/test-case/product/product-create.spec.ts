// e2e/tests/product-create.spec.ts
import { MOCK_USERS } from '../../mock-server/lib/mock-user-data';
import { test, expect } from './fixtures/product-fixture';
import { MOCK_SELLER, MOCK_BUYER, MockProductFormData } from './fixtures/product-fixture';

test.describe('🛍️ 판매자 전용 상품 생성 페이지', () => {

    // 🔹 테스트 전/후 데이터 초기화 (격리성 보장)
    test.beforeEach(async ({ productHelpers }) => {
        await productHelpers.resetMockProducts();
    });

    // ============================================================================
    // 🔐 인증/인가 테스트 (헤더 기반)
    // ============================================================================

    test('비로그인으로 접근 시 로그인 페이지로 리다이렉트', async ({ page, productHelpers }) => {
        await productHelpers.goToCreateProductPage();
        await expect(page).toHaveURL("login?redirect=%2Fseller%2Fproducts%2Fnew");
    });

    test('구매자 (BUYER) 로 접근 시 403 에러', async ({ page, productHelpers, loginAs }) => {
        await loginAs(MOCK_USERS.BUYER);

        await productHelpers.goToCreateProductPage();

        await expect(
            page.getByText(/이 페이지는 판매자 계정만 접근할 수 있습니다./).or(
                page.locator('meta[name="next-error"]')
            )
        ).toBeVisible();
    });

    test('판매자 (SELLER) 로 접근 시 페이지 정상 렌더링', async ({ page, productHelpers, loginAsSeller }) => {
        // ✅ 판매자 인증 헤더 설정
        await loginAsSeller();

        await productHelpers.goToCreateProductPage();

        // ✅ 페이지 제목 및 폼 요소 확인
        await expect(page).toHaveTitle(/새 상품 등록|판매자 센터/);
        await expect(page.getByRole('heading', { name: '새 상품 등록' })).toBeVisible();

        // ✅ 필수 필드 표시 확인
        await expect(page.locator('#productName')).toBeVisible();
        await expect(page.locator('#price')).toBeVisible();
        await expect(page.locator('#stock')).toBeVisible();
        await expect(page.locator('#type')).toBeVisible();

        // ✅ 등록하기 버튼
        await expect(page.getByRole('button', { name: '등록하기' })).toBeVisible();
    });

    // ============================================================================
    // 📝 폼 검증 테스트 (Mock Server 검증 로직과 동기화)
    // ============================================================================

    test('상품명 비어있을 때 서버 검증 에러 (1~100자)', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        // ✅ 빈 상품명으로 제출
        await productHelpers.fillProductForm(page, {
            productName: '',  // ❌ 빈 값
            price: 10000,
            stock: 10,
            type: 'BOOK',
        });

        await productHelpers.submitProductForm(page);

        // ✅ Mock Server 의 검증 메시지 확인
        await expect(page.getByText('상품명은 필수입니다.')).toBeVisible();

        // ✅ 입력 필드 에러 스타일
        await expect(page.locator('#productName')).toHaveClass(/border-red-500/);
    });

    test('가격이 음수일 때 에러 (0 이상의 정수)', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        await productHelpers.fillProductForm(page, {
            productName: '테스트 상품',
            price: -1000,  // ❌ 음수
            stock: 10,
            type: 'BOOK',
        });

        await productHelpers.submitProductForm(page);

        // ✅ Mock Server 메시지 확인
        await expect(page.getByText('가격은 1 이상이어야 합니다.')).toBeVisible();
    });

    test('재고가 음수일 때 에러', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        await productHelpers.fillProductForm(page, {
            productName: '테스트 상품',
            price: 10000,
            stock: -5,  // ❌ 음수
            type: 'BOOK',
        });

        await productHelpers.submitProductForm(page);

        await expect(page.getByText('재고는 1 이상이어야 합니다.')).toBeVisible();
    });

    test('상품 유형이 유효하지 않을 때 에러', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        // ✅ type 필드를 강제로 잘못된 값으로 설정 (HTML 조작)
        await page.evaluate(() => {
            const select = document.querySelector('#type') as HTMLSelectElement;
            if (select) {
                const option = document.createElement('option');
                option.value = 'INVALID';
                option.textContent = 'Invalid';
                select.add(option);
                select.value = 'INVALID';
            }
        });

        await productHelpers.fillProductForm(page, {
            productName: '테스트 상품',
            price: 10000,
            stock: 10,
            // type 은 위에서 조작
        });

        await productHelpers.submitProductForm(page);

        // ✅ Mock Server 메시지: "상품 종류는 BOOK, EBOOK 중 하나여야 합니다."
        await expect(page.getByText(/Invalid option: expected one of "BOOK"|"EBOOK"/)).toBeVisible();
    });

    test('이미지 URL 이 잘못된 형식일 때 에러', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        await productHelpers.fillProductForm(page, {
            productName: '테스트 상품',
            price: 10000,
            stock: 10,
            type: 'BOOK',
            imageUrl: 'not-a-valid-url',  // ❌ 잘못된 URL
        });

        await productHelpers.submitProductForm(page);

        await expect(page.getByText('올바른 이미지 URL 형식이어야 합니다.')).toBeVisible();
    });

    // ============================================================================
    // ✅ 성공 시나리오 테스트 (응답 포맷 매칭)
    // ============================================================================

    test('유효한 데이터로 상품 생성 성공 (응답 포맷 검증)', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        const testData: MockProductFormData = {
            productName: 'Playwright 테스트 상품',
            price: 25000,
            stock: 50,
            type: 'BOOK',
            description: 'E2E 테스트를 위해 생성된 상품입니다.',
            imageUrl: 'https://example.com/test-product.jpg',
        };

        await productHelpers.fillProductForm(page, testData);

        await productHelpers.submitProductForm(page);

        // ✅ 상세 페이지로 리다이렉트
        await expect(page).toHaveURL(/\/products\/\d+/);

        // ✅ 생성된 상품 페이지에서 내용 확인
        await expect(page.getByRole('heading', { name: testData.productName })).toBeVisible();
        await expect(page.getByText(`${testData.price.toLocaleString()}원`)).toBeVisible();
    });

    test('선택 필드 (description, imageUrl) 생략 시에도 생성 성공', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        // ✅ 필수 필드만 입력
        await productHelpers.fillProductForm(page, {
            productName: '최소 필수 상품',
            price: 5000,
            stock: 1,
            type: 'EBOOK',
            // description, imageUrl 생략
        });

        await productHelpers.submitProductForm(page);

        // ✅ 성공 응답 확인
        await expect(page).toHaveURL(/\/products\/\d+/);
        await expect(page.getByRole('heading', { name: '최소 필수 상품' })).toBeVisible();
    });

    test('description 이 빈 문자열일 때 정상 처리', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        await productHelpers.fillProductForm(page, {
            productName: '빈 설명 상품',
            price: 10000,
            stock: 10,
            type: 'BOOK',
            description: '',  // ✅ 빈 문자열은 허용 (Mock Server 에서 '' 로 처리)
        });

        await productHelpers.submitProductForm(page);

        await expect(page).toHaveURL(/\/products\/\d+/);
    });

    // ============================================================================
    // 🎨 UI/UX 테스트
    // ============================================================================

    test('취소 버튼 클릭 시 이전 페이지로 이동', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        const cancelButton = page.getByRole('button', { name: '취소' });
        await expect(cancelButton).toBeVisible();

        // ✅ 브라우저 히스토리 활용 (router.back())
        await page.evaluate(() => window.history.pushState({}, '', '/seller/products'));
        await cancelButton.click();

        // ✅ 이전 페이지 확인
        await expect(page).toHaveURL(/\/seller\/products/);
    });

    test('상품 유형 셀렉트: BOOK ↔ EBOOK 전환', async ({ page, productHelpers, loginAsSeller }) => {
        await loginAsSeller();
        await productHelpers.goToCreateProductPage();

        const typeSelect = page.locator('#type');

        // ✅ 기본값: BOOK
        await expect(typeSelect).toHaveValue('BOOK');

        // ✅ EBOOK 선택
        await typeSelect.selectOption('EBOOK');
        await expect(typeSelect).toHaveValue('EBOOK');

        // ✅ BOOK 재선택
        await typeSelect.selectOption('BOOK');
        await expect(typeSelect).toHaveValue('BOOK');
    });
});