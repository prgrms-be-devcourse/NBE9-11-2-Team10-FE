import { test, expect, MOCK_STORE_PROFILE, MOCK_SELLER } from './fixtures/store-fixture';

test.describe('✏️ 판매자 프로필 수정 페이지', () => {
  const SELLER_ID = String(MOCK_SELLER.id);

  test.beforeEach(async ({ storeHelpers }) => {
    await storeHelpers.resetMockStoreData();
  });

  // ============================================================================
  // 🔹 페이지 로딩 및 초기 상태 테스트
  // ============================================================================

  test('프로필 수정 페이지 - 기존 데이터로 폼이 사전 채워짐', async ({
    page,
    storeEditHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // 페이지 제목 검증
    await expect(page.getByRole('heading', { name: '판매자 프로필 수정' })).toBeVisible();

    // 폼 초기값 검증
    await storeEditHelpers.assertFormPreFilled(page, MOCK_STORE_PROFILE);
  });

  test('취소 버튼 - 프로필 보기 페이지로 이동', async ({
    page,
    storeEditHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    await storeEditHelpers.clickCancelButton(page);

    await expect(page).toHaveURL(`/store/${SELLER_ID}`);
    await expect(
      page.getByRole('heading', { name: MOCK_STORE_PROFILE.nickname }),
    ).toBeVisible();
  });

  // ============================================================================
  // 🔹 폼 유효성 검증 테스트
  // ============================================================================

  test('닉네임 검증 - 2~20 자 제한', async ({ page, storeEditHelpers, loginAsSeller }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // 1 자 닉네임 입력
    await storeEditHelpers.fillProfileForm(page, { nickname: 'A' });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
      page,
      'nickname',
      '닉네임은 2 자 이상이어야 합니다.',
    );

    await page.getByLabel('닉네임').clear();

    // 21 자 닉네임 입력
    await storeEditHelpers.fillProfileForm(page, {
      nickname: 'A'.repeat(21),
    });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
      page,
      'nickname',
      '닉네임은 20 자를 초과할 수 없습니다.',
    );
    
  });

  test('닉네임 검증 - 허용 문자만 입력 가능', async ({
    page,
    storeEditHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // 특수문자 포함 닉네임
    await storeEditHelpers.fillProfileForm(page, { nickname: 'user@name!' });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
      page,
      'nickname',
      '닉네임은 영문, 숫자, 한글, _ 만 사용할 수 있습니다.',
    );
  });

  test('소개 (bio) 검증 - 500 자 제한', async ({
    page,
    storeEditHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    await storeEditHelpers.fillProfileForm(page, { bio: 'A'.repeat(501) });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
      page,
      'bio',
      '소개는 500 자를 초과할 수 없습니다.',
    );
  });

  test('프로필 이미지 URL 검증 - 올바른 형식만 허용', async ({
    page,
    storeEditHelpers,
    loginAsSeller
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    await storeEditHelpers.fillProfileForm(page, {
      profileImageUrl: 'not-a-valid-url',
    });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
      page,
      'profileImageUrl',
      '올바른 URL 형식이어야 합니다.',
    );
  });

  test('사업자 정보 검증 - 상호명/대표자명 길이 제한', async ({
    page,
    storeEditHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // 상호명 101 자 입력
    await storeEditHelpers.fillProfileForm(page, {
      businessName: 'A'.repeat(101),
    });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
        page,
        'businessInfo.businessName', // ✅ 전체 경로 키
        '상호명은 100 자를 초과할 수 없습니다.',
      );

    // 대표자명 51 자 입력
    await storeEditHelpers.fillProfileForm(page, {
      ceoName: 'B'.repeat(51),
    });
    await storeEditHelpers.clickSaveButton(page);
    await storeEditHelpers.assertFieldError(
        page,
        'businessInfo.ceoName', // ✅ 전체 경로 키
        '대표자명은 50 자를 초과할 수 없습니다.',
      );
  });

  // ============================================================================
  // 🔹 성공 시나리오 테스트
  // ============================================================================

  test('프로필 수정 성공 - 닉네임만 변경', async ({
    page,
    storeEditHelpers,
    storeHelpers,
    loginAsSeller,
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    const newNickname = '업데이트된_닉네임';
    await storeEditHelpers.fillProfileForm(page, { nickname: newNickname });
    await storeEditHelpers.clickSaveButton(page);

    // 리다이렉트 검증
    await expect(page).toHaveURL(`/store/${SELLER_ID}`);

    // 업데이트된 닉네임이 프로필에 반영되었는지 검증
    await expect(
      page.getByTestId('profile-nickname'),
    ).toHaveText(newNickname);
  });

  test('프로필 수정 성공 - 소개 및 사업자 정보 함께 변경', async ({
    page,
    storeEditHelpers,
    loginAsSeller
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    await storeEditHelpers.fillProfileForm(page, {
      bio: '업데이트된 소개 문구입니다.',
      businessName: '(주)업데이트컴퍼니',
      ceoName: '홍길동',
    });
    await storeEditHelpers.clickSaveButton(page);

    await expect(page).toHaveURL(`/store/${SELLER_ID}`);
    await expect(page.getByTestId('profile-bio')).toHaveText(
      '업데이트된 소개 문구입니다.',
    );
    // 사이드바에 사업자 정보가 표시되는지 검증 (구현에 따라 조정)
    await expect(page.getByText('(주)업데이트컴퍼니')).toBeVisible();
  });

  test('프로필 이미지 URL 변경 - 빈 값으로 초기화 가능', async ({
    page,
    storeEditHelpers,
    loginAsSeller
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // 기존 이미지 URL 을 빈 문자열로 설정
    await storeEditHelpers.fillProfileForm(page, { profileImageUrl: '' });
    await storeEditHelpers.clickSaveButton(page);

    await expect(page).toHaveURL(`/store/${SELLER_ID}`);
    // 이미지가 초기화되어 이니셜 아바타가 표시되는지 검증
    await expect(
      page.getByTestId('profile-avatar').locator('span'),
    ).toBeVisible();
  });

  // ============================================================================
  // 🔹 에러 처리 테스트
  // ============================================================================

  test('닉네임 중복 - 409 에러 처리', async ({ page, storeEditHelpers, loginAsSeller }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // 이미 사용 중인 닉네임으로 설정 (mock-store-profile-data.ts 의 takenNicknames 참조)
    await storeEditHelpers.fillProfileForm(page, { nickname: 'admin' });
    await storeEditHelpers.clickSaveButton(page);

    // 전역 에러 메시지 표시 검증
    await storeEditHelpers.assertGlobalError(
      page,
      '이미 사용 중인 닉네임입니다.',
    );
    // 페이지는 리다이렉트되지 않고 폼 상태 유지
    await expect(page).toHaveURL(`/store/${SELLER_ID}/edit`);
  });

  // ============================================================================
  // ♿ 접근성 및 사용성 테스트
  // ============================================================================

  test('폼 레이블과 입력 필드가 올바르게 연결됨', async ({
    page,
    storeEditHelpers,
    loginAsSeller
  }) => {
    await loginAsSeller();
    await storeEditHelpers.goToEditPage(page, SELLER_ID);

    // label[for] 와 input[id] 매칭 검증
    const nicknameInput = page.locator('input#nickname');
    const nicknameLabel = page.locator('label[for="nickname"]');
    await expect(nicknameLabel).toBeVisible();
    await expect(nicknameInput).toBeVisible();
    await expect(nicknameInput).toHaveAttribute('name', 'nickname');
  });
});