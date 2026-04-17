// src/components/auth/AccessDenied.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  requiredRole?: 'SELLER';
  message?: string;
}

export default function AccessDenied({ requiredRole, message }: AccessDeniedProps) {
  const router = useRouter();

  const getTitle = () => {
    if (requiredRole === 'SELLER') return '판매자 전용 페이지';
    return '접근 권한이 없습니다';
  };

  const getDescription = () => {
    if (message) return message;
    if (requiredRole === 'SELLER') return '이 페이지는 판매자 계정만 접근할 수 있습니다.';
    return '해당 리소스에 접근할 권한이 없습니다.';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* 🔒 아이콘 */}
      <div className="mb-6 p-4 bg-gray-100 rounded-full">
        <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {getTitle()}
      </h1>
      
      <p className="text-gray-600 mb-8 max-w-md">
        {getDescription()}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg 
                     hover:bg-gray-50 transition-colors font-medium"
        >
          이전 페이지
        </button>
        {/*
        <Link
          href="/seller/dashboard"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 transition-colors font-medium"
        >
          판매자 대시보드
        </Link>
        */}
      </div>
    </div>
  );
}