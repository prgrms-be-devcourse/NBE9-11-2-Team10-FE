// lib/api/types.ts
export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'LOCKED';

export interface RsData<T> {
  resultCode: string;
  msg: string;
  data: T | null;
}

export interface LoginSuccessData {
  flowState: 'AUTH_SUCCESS';
  user: {
    id: string;
    email: string;
    nickname?: string;
    roles: Role;
  };
}

export interface LoginTfaRequiredData {
  flowState: 'TFA_REQUIRED';
  tfaSessionId: string;
  tfaChannels: ('SMS' | 'TOTP')[];
  user: {
    id: string;
    roles: Role;
  };
}

export type LoginData = LoginSuccessData | LoginTfaRequiredData;

// 회원가입, 중복체크 등은 기존과 동일
export interface RegisterData {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface DuplicateCheckData {
  type: 'email' | 'nickname';
  value: string;
  available: boolean;
}