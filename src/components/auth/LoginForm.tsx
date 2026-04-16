// components/auth/LoginForm.tsx
'use client';

import { useActionState } from 'react'; // Next.js 15/React 19 기준
// 'useFormState' from 'react-dom' 은 구버전용
import { loginAction} from '@/lib/actions/authActions';
import { useState, useEffect } from 'react';
import { LoginActionState } from '@/types/auth';

// 초기 상태 정의
const initialState: LoginActionState = {
  success: false,
  error: undefined,
};

export default function LoginForm() {
  // useActionState: [상태, 폼액션함수, 로딩여부]
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    initialState
  );

  // 로컬 UI 상태 (아이디저장/자동로그인 체크박스 등)
  const [saveId, setSaveId] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const handleGoogleLogin = () => {
    alert('구글 로그인 기능은 개발 중입니다.');
    // 추후: window.location.href = `/api/auth/google` 등 서버 라우트로 이동
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">텐텐</h1>
      </div>

      {/* form 의 action 에 서버 액션 전달 */}
      <form action={formAction} className="space-y-6" noValidate>
        
        {/* 이메일 입력 */}
        <div>
          <div className="relative">
            <input
              name="email"
              type="email"
              placeholder="아이디 (이메일)"
              defaultValue="" // 자동완성 방지 또는 저장된 값 설정 가능
              className={`w-full px-4 py-4 bg-gray-100 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-0 text-gray-700 placeholder-gray-400 transition-all ${
                state?.fieldErrors?.email ? 'border-red-500 bg-red-50' : ''
              }`}
            />
          </div>
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.email}</p>
          )}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <div className="relative">
            <input
              name="password" // ✅ name 속성이 필수
              type="password"
              placeholder="비밀번호"
              className={`w-full px-4 py-4 bg-gray-100 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-0 text-gray-700 placeholder-gray-400 transition-all ${
                state?.fieldErrors?.password ? 'border-red-500 bg-red-50' : ''
              }`}
            />
          </div>
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.password}</p>
          )}
        </div>

        {/* 전역 에러 메시지 (서버 응답) */}
        {state?.error && !state.fieldErrors && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md animate-pulse">
            <p className="text-sm text-red-600 text-center">{state.error}</p>
          </div>
        )}

        {/* 옵션 행 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input 
                type="checkbox" 
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={saveId}
                onChange={(e) => setSaveId(e.target.checked)}
              />
              아이디 저장
            </label>
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input 
                type="checkbox" 
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
              />
              자동로그인
            </label>
          </div>
          
          {/* 버튼 타입은 submit 유지 */}
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {/* 구글 로그인 */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          구글 로그인
        </button>
      </form>
    </div>
  );
}