import { ApiErrorResponse, DuplicateCheckResponse, DuplicateCheckType } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function checkDuplicate(
  type: DuplicateCheckType,
  value: string
): Promise<{ success: boolean; available?: boolean; error?: string }> {
  try {
    const params = new URLSearchParams({ type, value });
    const response = await fetch(
      `${API_BASE_URL}/api/v1/auth/check-duplicate?${params}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // 중복 체크는 항상 최신 데이터 확인
      }
    );

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      return { success: false, error: errorData.detail || '중복 확인 중 오류가 발생했습니다.' };
    }

    const result: DuplicateCheckResponse = await response.json();
    return { success: true, available: result.data.available };
  } catch (err) {
    console.error('[checkDuplicate] Network Error:', err);
    return { success: false, error: '서버와 연결할 수 없습니다.' };
  }
}

export async function logout(): Promise<{ message: string; invalidatedAt: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 🍪 인증 쿠키 전송을 위해 필수
    cache: 'no-store', // 🔒 보안 응답 캐시 방지
  });

  if (!response.ok) {
    throw new Error('로그아웃에 실패했습니다.');
  }

  return response.json();
}