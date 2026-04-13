// stores/useAuthStore.ts
import { create } from 'zustand';
import { Role, UserStatus } from '../lib/api/types';

interface User {
  id: string;
  email: string;
  nickname?: string;
  roles: Role;
}

interface AuthState {
  user: User | null;
  status: UserStatus | null;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setStatus: (status: UserStatus) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void; // 로컬 상태만 초기화, 실제 로그아웃은 API 호출
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: null,
  isLoading: false,
  
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => {
    // ✅ 쿠키는 서버가 삭제하므로, 프론트는 로컬 상태만 정리
    set({ user: null, status: null });
  },
}));