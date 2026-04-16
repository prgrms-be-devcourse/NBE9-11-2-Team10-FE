import { logout } from '@/lib/api/auth';
import { create } from 'zustand';

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>; // 👈 로직 변경
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  
  setUser: (user) => {
    if (user) {
      // 👇 로그인 시: localStorage 에 캐싱 (JSON 문자열로 저장)
      localStorage.setItem('cached_user', JSON.stringify(user));
      set({ user, status: 'authenticated' });
    } else {
      // 👇 로그아웃 시: 캐시 삭제
      localStorage.removeItem('cached_user');
      set({ user: null, status: 'unauthenticated' });
    }
  },

  // 👇 페이지 로딩 시: 로컬 스토리지에서 복원
  checkAuth: async () => {
    set({ status: 'loading' });
    
    // 약간의 지연을 주어 로딩 애니메이션이 자연스럽게 보이게 할 수 있음 (선택사항)
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const cached = localStorage.getItem('cached_user');
      if (cached) {
        const user = JSON.parse(cached) as User;
        set({ user, status: 'authenticated' });
        return;
      }
      // 캐시가 없다면 비로그인 상태
      set({ user: null, status: 'unauthenticated' });
    } catch (e) {
      console.error('Auth restore failed', e);
      set({ user: null, status: 'unauthenticated' });
    }
  },

  logout: async () => {
    try {
      // 1. 서버에 로그아웃 요청 (쿠키 삭제 처리)
      await logout();
    } catch (e) {
      // 서버 에러가 발생해도 로컬에서는 로그아웃 처리할지 여부는 정책 결정
      // 여기서는 사용자 경험을 위해 로컬 상태는 무조건 초기화합니다.
      console.error('Logout API call failed, but clearing local state', e);
    } finally {
      // 2. 로컬 스토리지 캐시 삭제
      localStorage.removeItem('cached_user');
      
      // 3. Zustand 상태 초기화
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));