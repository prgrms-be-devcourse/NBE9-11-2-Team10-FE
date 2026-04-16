// components/auth/LoginForm.tsx
'use client';

// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useRouter } from 'next/navigation';
import { useState } from 'react';
// import { loginSchema, LoginFormValues } from '@/schemas/auth.schema';
// import { useAuth } from '@/hooks/useAuth';

export default function LoginForm() {
  // const router = useRouter();
  // const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm<LoginFormValues>({
  //   resolver: zodResolver(loginSchema),
  //   mode: 'onChange',
  //   defaultValues: {
  //     identifier: '',
  //     password: ''
  //   },
  // });

  // const onSubmit = async (data: LoginFormValues) => {
  //   setIsLoading(true);
  //   setError(null);

  //   // useAuth 훅 호출 (Cookie-Only 아키텍처에 맞춰 동작)
  //   const result = await login(data.identifier, data.password);
    
  //   setIsLoading(false);

  //   if (result.success) {
  //     // 로그인 성공 시 리다이렉트 (훅 내부에서 처리될 수도 있음)
  //     router.push('/dashboard'); 
  //   } else {
  //     setError(result.error || "Login Failed.");
  //   }
  // };

  const handleGoogleLogin = () => {
    // 추후 구글 OAuth 개발 시 구현
    // 현재는 UI만 동작하도록 함
    alert('구글 로그인 기능은 개발 중입니다.');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      {/* 로고 영역 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">텐텐</h1>
        {/* 필요시 로고 이미지로 교체 가능 */}
      </div>

      <form className="space-y-6">
        
        {/* 아이디 입력 */}
        <div>
          <div className="relative">
            <input
              type="text"
              placeholder="아이디 (이메일)"
              // {...register('identifier')}
              className={`w-full px-4 py-4 bg-gray-100 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-0 text-gray-700 placeholder-gray-400 transition-all`}
            />
          </div>
          {/* {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier.message}</p>} */}
        </div>

        {/* 비밀번호 입력 */}
        <div>
          <div className="relative">
            <input
              type="password"
              placeholder="비밀번호"
              // {...register('password')}
              className={`w-full px-4 py-4 bg-gray-100 border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-0 text-gray-700 placeholder-gray-400 transition-all`}
            />
          </div>
          {/* {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>} */}
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* 옵션 행: 아이디 저장 / 자동로그인 / 로그인 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              아이디 저장
            </label>
            <label className="flex items-center text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              자동로그인
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {/* 구글 로그인 버튼 */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          {/* 구글 아이콘 SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          구글 로그인
        </button>

      </form>
    </div>
  );
}