// hooks/useAuth.ts
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { ApiError } from '../lib/api/request';

export const useAuth = () => {
  const router = useRouter();
  const { setUser, setStatus, logout: clearLocal } = useAuthStore();

  // ✅ 로그인: 응답에 토큰 없음, 사용자 정보만 저장
  const login = useCallback(async (identifier: string, password: string, role: 'BUYER' | 'SELLER') => {
    try {
      const rsData = await authApi.login({ identifier, password, targetRole: role });
      
      if (rsData.data?.flowState === 'AUTH_SUCCESS') {
        setUser(rsData.data.user); // 쿠키는 브라우저가 자동 관리
        setStatus('ACTIVE');
        router.push('/dashboard');
        return { success: true };
      } 
      
      // 추후 2FA 구현 시 사용
      if (rsData.data?.flowState === 'TFA_REQUIRED') {
        router.push(`/auth/2fa?sessionId=${rsData.data.tfaSessionId}`);
        return { success: false, requires2fa: true };
      }
      
      return { success: false, error: rsData.msg };
      
    } catch (err) {
      if (err instanceof ApiError) {
        return { success: false, error: err.message, code: err.resultCode };
      }
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
  }, [setUser, setStatus, router]);

  // ✅ 로그아웃: 서버에 쿠키 삭제 요청 + 로컬 상태 초기화
  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // 서버: Set-Cookie: accessToken=; Max-Age=0
    } catch (e) {
      // 쿠키 삭제 실패해도 로컬은 정리 (사용자 경험 우선)
      console.warn('Logout API failed, clearing local state anyway');
    } finally {
      clearLocal();
      router.push('/login');
    }
  }, [clearLocal, router]);

  // ✅ 사용자 정보 동기화 (페이지 로드 시 쿠키 기반 인증 확인)
  const syncUser = useCallback(async () => {
    try {
      const rsData = await authApi.me();
      if (rsData.data?.user) {
        setUser(rsData.data.user);
        return true;
      }
    } catch {
      // 401 등 인증 실패 시 자동으로 로그인 페이지로
    }
    return false;
  }, [setUser]);

  return { login, logout, syncUser };
};