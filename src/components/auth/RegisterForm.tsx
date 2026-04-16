// components/auth/RegisterForm.tsx
'use client';

import { useActionState, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressSearchInput } from './AddressSearchInput';
import { 
  updateFormField, 
  submitRegister
} from '@/lib/actions/authActions';
import { initialRegisterState} from '@/types/auth';
import { RegisterRole } from '@/schemas/auth.schema';

interface RegisterFormProps {
  role: RegisterRole;
}

export default function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter();
  
  const initialState = { 
    ...initialRegisterState, 
    formData: { 
      ...initialRegisterState.formData, 
      role
    } 
  };
  
  const [state, formAction, isPending] = useActionState(submitRegister, initialState);
  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);

  useEffect(() => {
    if (state.success && state.message === '회원가입이 완료되었습니다.') {
      
      // 2. 1.5 초 뒤에 라우팅 (사용자가 메시지를 읽을 시간 확보)
      const timer = setTimeout(() => {
        router.push('/login');
      }, 1500);
      
      return () => clearTimeout(timer); // 클린업
    }
  }, [state.success, state.message, router]);

  const roleText = role === 'BUYER' ? '구매자' : '판매자';

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {roleText} 회원가입
      </h2>

      <form action={formAction} className="space-y-4" noValidate>
        
        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이메일 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              name="email"
              type="email"
              defaultValue={state.formData.email}
              // disabled={isEmailChecked}
              className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${
                state.errors.email ? 'border-red-500' : 'border-gray-300'
              } ${isEmailChecked ? 'bg-gray-100' : ''}`}
              placeholder="example@email.com"
            />
            <button
              type="button"
              // disabled={isEmailChecked}
              className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {isEmailChecked ? '확인됨' : '중복 확인'}
            </button>
          </div>
          {state.errors.email && (
            <p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            name="password"
            type="password"
            defaultValue={state.formData.password}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
              state.errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="8~20자, 영문과 숫자 포함"
          />
          {state.errors.password && (
            <p className="mt-1 text-sm text-red-600">{state.errors.password}</p>
          )}
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            defaultValue={state.formData.name}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
              state.errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="실명을 입력해 주세요"
          />
          {state.errors.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name}</p>
          )}
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            닉네임 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              name="nickname"
              type="text"
              defaultValue={state.formData.nickname}
              // disabled={isNicknameChecked}
              className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${
                state.errors.nickname ? 'border-red-500' : 'border-gray-300'
              } ${isNicknameChecked ? 'bg-gray-100' : ''}`}
              placeholder="2~20자, 영문/숫자/한글/_"
            />
            <button
              type="button"
              // disabled={isNicknameChecked}
              className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {isNicknameChecked ? '확인됨' : '중복 확인'}
            </button>
          </div>
          {state.errors.nickname && (
            <p className="mt-1 text-sm text-red-600">{state.errors.nickname}</p>
          )}
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            name="phoneNumber"
            type="tel"
            defaultValue={state.formData.phoneNumber}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
              state.errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="010-0000-0000"
          />
          {state.errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">{state.errors.phoneNumber}</p>
          )}
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주소 <span className="text-red-500">*</span>
          </label>
          <AddressSearchInput
            roadAddress={state.formData.roadAddress}
            error={state.errors.roadAddress}
            disabled={isPending}
          />
          <input
            type="text"
            name="detailAddress"
            defaultValue={state.formData.detailAddress}
            placeholder="상세주소 (동/호수, 층)"
            disabled={isPending}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
              state.errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {state.errors.detailAddress && (
            <p className="mt-1 text-sm text-red-600">{state.errors.detailAddress}</p>
          )}
          {/* <input type="hidden" name="roadAddress" value={state.formData.roadAddress} />
          <input type="hidden" name="detailAddress" value={state.formData.detailAddress} /> */}
        </div>

        {/* 서버 메시지 (성공/실패 공통) */}
        {state.message && (
          <div className={`p-3 rounded-lg text-sm ${
            state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {state.message}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition mt-6"
        >
          {isPending ? '처리 중...' : '가입하기'}
        </button>

        {/* role hidden field */}
        <input type="hidden" name="role" defaultValue={role} />
      </form>
    </div>
  );
}