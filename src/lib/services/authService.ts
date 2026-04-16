'use server';

import { LoginFormValues, loginSchema, RegisterRequest } from '@/schemas/auth.schema';
import { LoginResponse, RegisterResponse } from '@/types/auth';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

export async function registerService(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const fullAddress = `${data.roadAddress} ${data.detailAddress}`.trim();
    
    // 서버가 기대하는 포맷으로 변환
    const payload = {
      ...data,
      address: fullAddress
    };

    const { roadAddress, detailAddress, ...serverPayload } = payload;

    console.log('🔗 registerService fetching:', process.env.API_URL + '/api/v1/auth/register');

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serverPayload),
      // Next.js fetch 캐시 비활성화 (민감한 회원가입 데이터)
      cache: 'no-store', 
    });

    const result = await response.json();

    // 성공 응답 처리
    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    // 실패 응답 처리 (RFC 7807 포맷 매핑)
    return {
      success: false,
      detail: result.detail || '회원가입에 실패했습니다.',
      errorCode: result.errorCode,
      validationErrors: result.validationErrors,
      status: response.status,
    };
  } catch (error) {
    console.error('[registerService] Network Error:', error);
    return {
      success: false,
      detail: '네트워크 오류가 발생했습니다. 다시 시도해 주세요.',
    };
  }
}

export async function loginService(formData: LoginFormValues): Promise<LoginResponse> {
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
    // 2. 내부 API 호출 (서버 → 서버 통신)
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });

    const result = await response.json();

    if (!response.ok) {
      // API 명세서의 에러 포맷에 맞춰 처리
      return {
        success: false,
        error: {
          code: result.errorCode || 'UNKNOWN_ERROR',
          message: result.detail || '로그인 처리 중 오류가 발생했습니다.',
        },
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('[LoginService Error]', err);
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: '서버와 통신할 수 없습니다.' },
    };
  }
}