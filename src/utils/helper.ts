import { headers } from 'next/headers';
// ============================================================================
// 🔍 헬퍼: RFC 7807 에러 파싱

import { ProblemDetailError } from "@/types/common";

// ============================================================================
export const parseProblemDetail = (error: ProblemDetailError) => ({
    detail: error.detail || '요처 처리 중 오류가 발생했습니다.',
    errorCode: error.errorCode,
    status: error.status,
    validationErrors: error.validationErrors,
});

export const handleApiError = async (response: Response): Promise<ProblemDetailError> => {
    try {
        const errorData = await response.json();
        return errorData as ProblemDetailError;
    } catch {
        return {
            type: 'https://api.example.com/errors/UNKNOWN',
            title: response.statusText || 'Error',
            status: response.status,
            detail: '서버에서 알 수 없는 오류가 발생했습니다.',
            errorCode: 'UNKNOWN_ERROR',
        };
    }
};

// ============================================================================
// 🔐 헬퍼: 브라우저의 Cookie 헤더를 그대로 백엔드로 포워딩
// ============================================================================
export const getForwardedHeaders = async (extraHeaders?: Record<string, string>): Promise<Record<string, string>> => {
    const headersList = await headers();
    const cookie = headersList.get('cookie'); // 🍪 원본 Cookie 헤더 추출
  
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
  
    // ✅ Cookie 가 있으면 그대로 포워딩 (Spring 에서 처리)
    if (cookie) {
      baseHeaders['Cookie'] = cookie;
    }
  
    // ✅ E2E 테스트용 헤더 병합 (선택사항)
    if (extraHeaders) {
      Object.assign(baseHeaders, extraHeaders);
    }
  
    return baseHeaders;
  };