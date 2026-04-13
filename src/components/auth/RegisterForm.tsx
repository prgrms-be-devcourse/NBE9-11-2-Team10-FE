// components/auth/RegisterForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/useRegister';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import { useState } from 'react';
import { RegisterFormValues, registerSchema } from '@/schemas/auth.schema';

interface RegisterFormProps {
  role: 'BUYER' | 'SELLER';
}

export default function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter();
  const { handleRegister } = useRegister();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { role },
  });

  // 중복체크 훅 사용 (email, nickname)
  const emailCheck = useDuplicateCheck('email');
  const nicknameCheck = useDuplicateCheck('nickname');

  // 비밀번호 확인 검증 (Zod 스키마에서 처리하거나 여기서 처리 가능)
  // 여기서는 스키마에서 처리한다고 가정하고 UI 피드백만 추가

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    const { confirmPassword, ...submitData } = data;
    const result = await handleRegister(submitData);
    setIsSubmitting(false);

    if (result.success) {
      if (role === 'SELLER') {
        alert('판매자 가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.');
        router.push('/auth/pending');
      } else {
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
      }
    } else {
      // BE에서 내려준 에러 코드에 따른 처리
      if (result.code === 'F-3') { // 중복
        alert(result.error);
      } else {
        alert(result.error);
      }
    }
  };

  // 주소 검색 (외부 주소 API 연동 영역)
  const handleSearchAddress = () => {
    alert('주소 검색 API 연동 영역 (예: Daum Postcode)');
    // 검색 완료 후: setValue('address', result.address);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">회원가입</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 이메일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <div className="flex gap-2">
            <input
              type="email"
              {...register('email')}
              className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="example@email.com"
            />
            <button
              type="button"
              onClick={() => emailCheck.trigger(watch('email'))}
              disabled={!emailCheck.isAvailable && emailCheck.isChecked} // 중복이면 비활성화
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 whitespace-nowrap disabled:opacity-50"
            >
              {emailCheck.isChecked ? (emailCheck.isAvailable ? '사용 가능' : '중복 확인') : '중복 확인'}
            </button>
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          {emailCheck.message && <p className={`mt-1 text-xs ${emailCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>{emailCheck.message}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            {...register('password')}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            {...register('name')}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
          <div className="flex gap-2">
            <input
              type="text"
              {...register('nickname')}
              className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.nickname ? 'border-red-500' : 'border-gray-300'}`}
            />
            <button
              type="button"
              onClick={() => nicknameCheck.trigger(watch('nickname'))}
              disabled={!nicknameCheck.isAvailable && nicknameCheck.isChecked}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 whitespace-nowrap disabled:opacity-50"
            >
              {nicknameCheck.isChecked ? (nicknameCheck.isAvailable ? '사용 가능' : '중복 확인') : '중복 확인'}
            </button>
          </div>
          {errors.nickname && <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>}
          {nicknameCheck.message && <p className={`mt-1 text-xs ${nicknameCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>{nicknameCheck.message}</p>}
        </div>

        {/* 주소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
          <div className="flex gap-2">
            <input
              type="text"
              {...register('address')}
              readOnly // 주소 검색으로 입력되도록 설정 권장
              className="flex-1 px-3 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="주소 검색 버튼을 눌러주세요"
            />
            <button
              type="button"
              onClick={handleSearchAddress}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 whitespace-nowrap"
            >
              주소 검색
            </button>
          </div>
        </div>

        {/* 가입하기 버튼 */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full py-3 mt-4 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '처리 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
}