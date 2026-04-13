// hooks/useRegister.ts
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/request';

export const useRegister = () => {
  const router = useRouter();

  const handleRegister = useCallback(async (payload: any) => {
    try {
      // confirmPassword 필드는 BE로 보내지 않음
      const { confirmPassword, ...restPayload } = payload;
      
      await authApi.register(restPayload);
      
      // 성공 시 (201 Created)
      // 로그인 페이지로 리다이렉트 또는 자동 로그인 처리
      return { success: true };
      
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message, code: err.resultCode };
      }
      return { success: false, error: '서버 오류가 발생했습니다.' };
    }
  }, [router]);

  return { handleRegister };
};