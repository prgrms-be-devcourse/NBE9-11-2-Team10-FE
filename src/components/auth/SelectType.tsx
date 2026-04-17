// components/auth/SelectType.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LucideShoppingCart, LucideStore } from 'lucide-react'; // 아이콘 라이브러리 (예시)

export default function SelectType() {
  const router = useRouter();

  const handleSelect = (role: 'BUYER' | 'SELLER') => {
    // 2단계 폼으로 이동하면서 role 전달
    router.push(`/register?role=${role}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">가입 유형을 선택해 주세요.</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* 구매자 카드 */}
        <button
          onClick={() => handleSelect('BUYER')}
          className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white group"
        >
          <div className="w-16 h-16 mb-4 text-gray-400 group-hover:text-blue-500 transition-colors">
            {/* 장바구니 아이콘 (예시 SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600">구매자 회원가입</span>
        </button>

        {/* 판매자 카드 */}
        <button
          onClick={() => handleSelect('SELLER')}
          className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 bg-white group"
        >
          <div className="w-16 h-16 mb-4 text-gray-400 group-hover:text-green-500 transition-colors">
            {/* 상점 아이콘 (예시 SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-700 group-hover:text-green-600">판매자 회원가입</span>
        </button>
      </div>
    </div>
  );
}