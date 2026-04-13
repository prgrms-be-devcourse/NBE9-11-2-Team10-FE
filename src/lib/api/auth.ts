// lib/api/auth.ts
import { api } from './request';
import { RsData, RegisterData, LoginData, DuplicateCheckData, Role } from './types';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  nickname: string;
  address: string;
  role?: 'BUYER' | 'SELLER';
}

export interface LoginRequest {
  identifier: string;
  password: string;
  targetRole: 'BUYER' | 'SELLER' | 'ADMIN';
}

export const authApi = {
  register: (payload: RegisterRequest) =>
    api.post<RegisterData>('/api/v1/auth/register', payload),

  login: (payload: LoginRequest) =>
    api.post<LoginData>('/api/v1/auth/login', payload),

  // ✅ 로그아웃: 쿠키 삭제는 서버가 처리, 프론트는 상태만 초기화
  logout: () =>
    api.post('/api/v1/auth/logout'),

  // ✅ 토큰 갱신: 프론트는 호출만, 실제 로직은 서버가 처리
  refresh: () =>
    api.post('/api/v1/auth/refresh'),

  me: () =>
    api.get<{ user: { id: string; email: string; roles: Role } }>('/api/v1/auth/me'),

  checkDuplicate: (type: 'email' | 'nickname', value: string) => {
    const params = new URLSearchParams({ type, value });
    return api.get<DuplicateCheckData>(`/api/v1/auth/check-duplicate?${params}`);
  },
};