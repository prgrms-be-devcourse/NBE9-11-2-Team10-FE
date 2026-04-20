// components/auth/RegisterForm.tsx
'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressSearchInput } from './AddressSearchInput';
import {
  updateFormField,
  submitRegister
} from '@/lib/actions/authActions';
import { DuplicateCheckType, initialRegisterState } from '@/types/auth';
import { RegisterRole } from '@/schemas/auth.schema';
import { checkDuplicate } from '@/lib/api/auth';

interface RegisterFormProps {
  role: RegisterRole;
}

type DuplicateCheckKey = 'email' | 'nickname';
type DuplicateCheckStatus = { checked: boolean; available: boolean; loading: boolean; message: string };
type DuplicateCheckState = Record<DuplicateCheckKey, DuplicateCheckStatus>;

const duplicateCheckKeyByType: Record<DuplicateCheckType, DuplicateCheckKey> = {
  EMAIL: 'email',
  NICKNAME: 'nickname',
};

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
  // ✅ 중복 체크 상태 관리
  const [checkState, setCheckState] = useState<DuplicateCheckState>({
    email: { checked: false, available: false, loading: false, message: '' },
    nickname: { checked: false, available: false, loading: false, message: '' },
  });

  const emailInputRef = useRef<HTMLInputElement>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.success && state.errors && Object.keys(state.errors).length > 0) {
      setCheckState(prev => {
        const updated = { ...prev };
        if (state.errors.email) {
          updated.email = { checked: false, available: false, loading: false, message: '' };
        }
        if (state.errors.nickname) {
          updated.nickname = { checked: false, available: false, loading: false, message: '' };
        }
        return updated;
      });
    }
  }, [state.success, state.errors]);

  // ✅ 중복 체크 실행 함수
  const handleDuplicateCheck = useCallback(async (type: DuplicateCheckType) => {
    const key = duplicateCheckKeyByType[type];
    const inputRef = key === 'email' ? emailInputRef : nicknameInputRef;
    const value = inputRef.current?.value || '';

    if (!value.trim()) {
      setCheckState(prev => ({
        ...prev,
        [key]: { ...prev[key], message: '값을 입력해 주세요.', checked: true, available: false, loading: false },
      }));
      return;
    }

    setCheckState(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true, message: '', checked: false }
    }));

    try {
      const result = await checkDuplicate(type, value);

      setCheckState(prev => {
        if (result.success && result.available !== undefined) {
          return {
            ...prev,
            [key]: {
              checked: true,
              available: result.available!,
              loading: false,
              message: result.available
                ? `사용 가능한 ${type === 'EMAIL' ? '이메일' : '닉네임'}입니다.`
                : `이미 사용 중인 ${type === 'EMAIL' ? '이메일' : '닉네임'}입니다.`
            }
          };
        }
        return {
          ...prev,
          [key]: {
            ...prev[key],
            loading: false,
            message: result.error || '중복 확인 중 오류가 발생했습니다.',
            checked: false,
            available: false
          }
        };
      });
    } catch {
      setCheckState(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          loading: false,
          message: '중복 확인 중 오류가 발생했습니다.',
          checked: false,
          available: false
        }
      }));
    }
  }, []);

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
              ref={emailInputRef}  // ✅ ref 추가
              name="email"
              type="email"
              data-testid="email-input"
              defaultValue={state.formData.email}
              // ✅ disabled 조건: 중복체크 성공 시에만 비활성화
              disabled={checkState.email.checked && checkState.email.available}
              className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${state.errors.email || (checkState.email.message && !checkState.email.available)
                ? 'border-red-500'
                : 'border-gray-300'
                } text-gray-900`}
              placeholder="example@email.com"
            />
            <button
              type="button"
              data-testid="email-duplicate-check-btn"
              onClick={() => handleDuplicateCheck('EMAIL')}  // ✅ ref 로 값 읽으므로 파라미터 불필요
              disabled={checkState.email.loading || (checkState.email.checked && checkState.email.available)}
              className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {checkState.email.loading
                ? '확인 중...'
                : checkState.email.checked && checkState.email.available
                  ? '확인됨'
                  : '중복 확인'}
            </button>
          </div>
          {/* ✅ 에러 메시지 우선순위: 중복체크 에러 > 서버 에러 */}
          {checkState.email.checked ? (
            <p className={`mt-1 text-sm ${checkState.email.available ? 'text-green-600' : 'text-red-600'}`}>
              {checkState.email.message}
            </p>
          ) : state.errors.email ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
          ) : null}
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
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${state.errors.password ? 'border-red-500' : 'border-gray-300'
              } text-gray-900`}
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
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${state.errors.name ? 'border-red-500' : 'border-gray-300'
              } text-gray-900`}
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
              ref={nicknameInputRef}  // ✅ ref 추가
              name="nickname"
              type="text"
              data-testid="nickname-input"
              defaultValue={state.formData.nickname}
              disabled={checkState.nickname.checked && checkState.nickname.available}
              className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${state.errors.nickname || (checkState.nickname.message && !checkState.nickname.available)
                  ? 'border-red-500'
                  : 'border-gray-300'
                } text-gray-900`}
              placeholder="2~20자, 영문/숫자/한글/_"
            />
            <button
              type="button"
              data-testid="nickname-duplicate-check-btn"
              onClick={() => handleDuplicateCheck('NICKNAME')}
              disabled={checkState.nickname.loading || (checkState.nickname.checked && checkState.nickname.available)}
              className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {checkState.nickname.loading
                ? '확인 중...'
                : checkState.nickname.checked && checkState.nickname.available
                  ? '확인됨'
                  : '중복 확인'}
            </button>
          </div>
          {checkState.nickname.checked ? (
            <p className={`mt-1 text-sm ${checkState.nickname.available ? 'text-green-600' : 'text-red-600'}`}>
              {checkState.nickname.message}
            </p>
          ) : state.errors.nickname ? (
            <p className="mt-1 text-sm text-red-600">{state.errors.nickname}</p>
          ) : null}
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
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${state.errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              } text-gray-900`}
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
            className={`w-full px-3 py-2.5 border rounded-lg text-sm ${state.errors.address ? 'border-red-500' : 'border-gray-300'
              } text-gray-900`}
          />
          {state.errors.detailAddress && (
            <p className="mt-1 text-sm text-red-600">{state.errors.detailAddress}</p>
          )}
          {state.errors.address && (
            <p className="mt-1 text-sm text-red-600">{state.errors.address}</p>
          )}
          <input type="hidden" name="roadAddress" value={state.formData.roadAddress || ''} />
          <input type="hidden" name="detailAddress" value={state.formData.detailAddress || ''} />
        </div>

        {/* 서버 메시지 (성공/실패 공통) */}
        {state.message && (
          <div className={`p-3 rounded-lg text-sm ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
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