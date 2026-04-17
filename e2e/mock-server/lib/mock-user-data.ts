export type MockUser = {
    id: number;
    email: string;
    password: string;
    nickname: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  };
  
  // ✅ 시나리오별 사용자 데이터
  export const MOCK_USERS: Record<string, MockUser> = {
    SUCCESS: {
      id: 1,
      email: 'success@example.com',
      password: 'TestPass123!',
      nickname: '길동이',
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
      nickname: '구매자님',
      role: 'BUYER' as const,
    },
    SELLER: {
      id: 1002,
      email: 'seller@example.com',
      password: 'seller1234!',
      nickname: '판매자님',
      role: 'SELLER' as const,
    },
  };
