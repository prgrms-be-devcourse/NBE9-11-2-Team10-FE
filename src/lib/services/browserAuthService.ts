'use client';

import { LoginFormValues, loginSchema } from '@/schemas/auth.schema';
import { LoginResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_BASE_URL 이 설정되지 않았습니다.');
}

export async function browserLoginService(formData: LoginFormValues): Promise<LoginResponse> {
  // 1. 클라이언트 사이드 검증 (선택: 백엔드에서 재검증하므로 필수 아님)
  const validation = loginSchema.safeParse(formData);
  if (!validation.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: validation.error.issues[0].message,
        field: validation.error.issues[0].path[0] as string,
      },
    };
  }

  try {
    // 2. 브라우저에서 직접 백엔드 호출
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include', // 👈 쿠키 자동 포함/저장
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.detail || '로그인 처리 중 오류가 발생했습니다.',
          field: result.validationErrors?.[0]?.field,
        },
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('[BrowserLoginService Error]', err);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: '서버와 통신할 수 없습니다.' },
    };
  }
}