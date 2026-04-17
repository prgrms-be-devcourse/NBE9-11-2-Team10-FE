// e2e/scripts/lib/mock-data.ts

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
  };
  
  // ✅ 에러 응답 팩토리 (일관된 포맷 유지)
  export const createErrorResponse = (
    status: number,
    errorCode: string,
    detail: string,
    instance: string
  ) => ({
    detail,
    instance,
    status,
    title: status === 400 ? 'Bad Request' : status === 404 ? 'Not Found' : 'Error',
    type: `https://api.example.com/errors/${errorCode}`,
    errorCode,
    timestamp: new Date().toISOString(),
  });