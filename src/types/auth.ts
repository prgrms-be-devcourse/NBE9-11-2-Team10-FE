// @/types/auth.ts

import { RegisterRequest } from "@/schemas/auth.schema";

// export type RegisterRole = 'BUYER' | 'SELLER';

// export interface RegisterRequest {
//   email: string;
//   password: string;
//   name: string;
//   nickname: string;
//   phoneNumber: string;
//   roadAddress: string;
//   detailAddress: string;
//   role: RegisterRole;
// }

export interface RegisterSuccessResponse {
  success: true;
  data: {
    id: number;
    email: string;
    createdAt: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
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