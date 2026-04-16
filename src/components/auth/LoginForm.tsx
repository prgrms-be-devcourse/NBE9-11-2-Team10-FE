// @/components/auth/LoginForm.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@/schemas/auth.schema';
import { browserLoginService } from '@/lib/services/browserAuthService';

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (formData: FormData) => {
    setError(undefined);
    setFieldErrors({});

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await browserLoginService({ email, password });

      if (!result.success) {
        if (result.error?.field) {
          setFieldErrors({ [result.error.field]: result.error.message });
        } else {
          setError(result.error?.message || '로그인에 실패했습니다.');
        }
        return;
      }

      router.push('/');
      router.refresh(); // 서버 컴포넌트 데이터 새로고침
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4" noValidate>
      {/* 이메일 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          defaultValue=""
          className={`w-full px-3 py-2.5 border rounded-lg text-sm ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="example@email.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
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
          className={`w-full px-3 py-2.5 border rounded-lg text-sm ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="8~20자, 영문과 숫자 포함"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition"
      >
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}