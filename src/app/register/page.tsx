// app/register/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SelectType from '@/components/auth/SelectType';
import RegisterForm from '@/components/auth/RegisterForm';

function RegisterContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  // role 파라미터가 없으면 1단계 (유형 선택)
  if (!role) {
    return <SelectType />;
  }

  // role 파라미터가 있으면 2단계 (폼 입력)
  if (role === 'BUYER' || role === 'SELLER') {
    return <RegisterForm key={role} role={role} />;
  }

  // 잘못된 role 값 처리
  return <SelectType />;
}

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterContent />
        </Suspense>
      </div>
    </div>
  );
}