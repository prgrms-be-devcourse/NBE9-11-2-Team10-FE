// @/app/actions/authActions.ts
'use server';

import { registerService } from '@/lib/services/authService';
import { registerSchema } from '@/schemas/auth.schema';
import {
  RegisterActionState,
  initialRegisterState
} from '@/types/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * [Action 1] 폼 입력값 업데이트 전용 액션
 * useActionState 의 상태 불변성 원칙을 지키기 위한 헬퍼
 */
export async function updateFormField(
  prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const field = formData.get('field') as string;
  const value = formData.get('value') as string;

  // 해당 필드의 에러만 초기화 (실시간 피드백)
  const newErrors = { ...prevState.errors };
  delete newErrors[field];

  return {
    ...prevState,
    formData: { ...prevState.formData, [field]: value },
    errors: newErrors,
    message: '', // 새 입력 시 서버 메시지 초기화
  };
}

/**
 * [Action 2] 회원가입 제출 전용 액션
 * 모든 검증과 비즈니스 로직을 처리
 */
export async function submitRegister(
  prevState: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> {
  const updatedFormData = mergeFormData(prevState.formData, formData, FORM_FIELDS);

  const rawPayload = {...updatedFormData};

  const validationResult = registerSchema.safeParse(rawPayload);
  
  if (!validationResult.success) {
    const fieldErrors: Record<string, string> = {};
    validationResult.error.issues.forEach((err) => {
      // nested path 처리 (예: "address.road") → "address" 로 단순화
      const field = err.path[0] as string;
      fieldErrors[field] = err.message;
    });
    
    return {
      ...prevState,
      formData: updatedFormData,
      success: false,
      errors: fieldErrors,
      message: '입력 정보를 확인해 주세요.',
    };
  }

  const payload = validationResult.data;

  // 4. 서비스 호출 (Spring Server)
  const result = await registerService(payload);

  // 5. 결과 처리
  if (result.success) {
    return {
      ...initialRegisterState, // 성공 시 초기화
      success: true,
      message: '회원가입이 완료되었습니다.',
    };
  }

  // 실패 시: 서버에서 내려준 필드별 에러 매핑
  if (result.validationErrors?.length) {
    const fieldErrors: Record<string, string> = {};
    result.validationErrors.forEach((err) => {
      fieldErrors[err.field] = err.message;
    });
    return {
      ...prevState,
      formData: updatedFormData,
      success: false,
      errors: fieldErrors,
      message: result.detail,
    };
  }

  // 시스템 에러
  return {
    ...prevState,
    formData: updatedFormData,
    success: false,
    errors: {},
    message: result.detail || '처리 중 오류가 발생했습니다.',
    errorCode: result.errorCode,
  };
}

// 헬퍼: FormData 의 값을 기존 formData 에 병합
function mergeFormData(prevData: any, formData: FormData, fields: string[]) {
  const merged = { ...prevData };
  fields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null && value !== undefined) {
      merged[field] = value;
    }
  });
  return merged;
}

// 유지할 필드 목록 (hidden field 포함)
const FORM_FIELDS = [
  'email', 'password', 'name', 'nickname', 'phoneNumber',
  'roadAddress', 'detailAddress', 'role'
];