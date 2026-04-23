// @/types/auth.ts

import { RegisterRequest } from "@/schemas/auth.schema";
import { ValidationError } from "./common";

export interface RegisterSuccessResponse {
  success: true;
  data: {
    id: number;
    email: string;
    createdAt: string;
  };
}

export interface RegisterErrorResponse {
  success: false;
  detail?: string;
  errorCode?: string;
  validationErrors?: ValidationError[];
  status?: number;
}

export type RegisterResponse = RegisterSuccessResponse | RegisterErrorResponse;

// Server Action 반환 타입 (useActionState 용)
export interface RegisterActionState {
  success: boolean;
  message?: string;
  errorCode?: string;
  
  // 폼 데이터 상태 (입력값 유지를 위해 포함)
  formData: RegisterRequest;
  
  // 필드별 에러 상태
  errors: Record<string, string>;
}

export const initialRegisterState: RegisterActionState = {
  success: false,
  message: '',
  formData: {
    email: '',
    password: '',
    name: '',
    nickname: '',
    phoneNumber: '',
    roadAddress: '',
    detailAddress: '',
    role: 'BUYER', // 기본값
  },
  errors: {}
};

export type DuplicateCheckType = 'EMAIL' | 'NICKNAME';

export interface DuplicateCheckResponse {
  success: boolean;
  data: {
    type: DuplicateCheckType;
    value: string;
    available: boolean;
  };
}

export interface ApiErrorResponse {
  detail: string;
  errorCode: string;
  status: number;
  timestamp: string;
}

export interface LoginResponse {
  success: boolean;
  data?: UserInfo;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export type LoginActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: UserInfo
};

export type UserInfo = {
  id: number; email: string; nickname: string; role: 'BUYER' | 'SELLER';
};

export interface UserProfileResponse {
  id: number;
  email: string;
  name?: string;
  nickname: string;
  businessNumber?: string;
  phoneNumber?: string;
  roadAddress?: string;
  detailAddress?: string;
  address?: string;
  profileImageUrl?: string | null;
  imageUrl?: string | null;
  bio?: string;
}

export interface SellerProfileResponse {
  id: number;
  email: string;
  name?: string;
  nickname: string;
  businessNumber?: string;
  phoneNumber?: string;
  roadAddress?: string;
  detailAddress?: string;
  address?: string;
  profileImageUrl?: string | null;
  imageUrl?: string | null;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerPublicResponse {
  imageUrl: string | null;
  name: string;
  nickname: string;
  bio: string | null;
}

export interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
}
