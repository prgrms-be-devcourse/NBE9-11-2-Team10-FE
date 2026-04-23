export type MockUser = {
    id: number;
    email: string;
    password: string;
    name?: string;
    nickname: string;
    phoneNumber?: string;
    roadAddress?: string;
    detailAddress?: string;
    address?: string;
    profileImageUrl?: string | null;
    businessNumber?: string;
    bio?: string;
    role: 'BUYER' | 'SELLER';
  };
  
  // ✅ 시나리오별 사용자 데이터
export const MOCK_USERS: Record<string, MockUser> = {
    SUCCESS: {
      id: 1,
      email: 'success@example.com',
      password: 'TestPass123!',
      name: '홍길동',
      nickname: '길동이',
      phoneNumber: '010-1111-2222',
      roadAddress: '경기 성남시 분당구 판교역로 166',
      detailAddress: '1102동 304호',
      address: '경기 성남시 분당구 판교역로 166 1102동 304호',
      profileImageUrl: null,
      role: 'BUYER',
    },
    DUPLICATE: {
      id: 999,
      email: 'duplicate@example.com',
      password: 'password123',
      nickname: '중복닉네임',
      role: 'BUYER',
    },
    BUYER: {
      id: 1001,
      email: 'buyer@example.com',
      password: 'buyer1234!',
      name: '구매자',
      nickname: '구매자님',
      phoneNumber: '010-2222-3333',
      roadAddress: '서울시 강남구 테헤란로 123',
      detailAddress: '202호',
      address: '서울시 강남구 테헤란로 123 202호',
      profileImageUrl: null,
      role: 'BUYER' as const,
    },
    SELLER: {
      id: 1002,
      email: 'seller@example.com',
      password: 'seller1234!',
      name: '홍길동',
      nickname: '판매자님',
      phoneNumber: '010-1111-2222',
      roadAddress: '경기 성남시 분당구 판교역로 166',
      detailAddress: '1102동 304호',
      address: '경기 성남시 분당구 판교역로 166 1102동 304호',
      businessNumber: '123-45-67890',
      bio: '',
      profileImageUrl: null,
      role: 'SELLER' as const,
    },
  };

export const findMockUserById = (id: string | number): MockUser | undefined =>
  Object.values(MOCK_USERS).find((user) => user.id.toString() === id.toString());

export const updateMockUser = (
  id: string | number,
  updates: Partial<MockUser>,
): MockUser | null => {
  const user = findMockUserById(id);
  if (!user) return null;

  Object.assign(user, updates);
  return user;
};
