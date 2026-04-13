// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export default function Header() {
  const { user, status, logout: clearLocal } = useAuthStore();
  const router = useRouter();

  // 로그인 상태 확인
  const isLoggedIn = !!user;

  const handleLogout = async () => {
    try {
      // 서버 쿠키 삭제 요청
      await authApi.logout(); 
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      // 로컬 상태 초기화
      clearLocal();
      router.push('/login');
      router.refresh(); // 클라이언트 상태 갱신
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* 1. 로고 영역 */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded font-bold text-lg">
                T
              </div>
            </Link>
            
            {/* 로그인 시 사용자 이름 표시 */}
            {isLoggedIn ? (
              <span className="text-lg font-semibold text-gray-800">{user.email} 님</span>
            ) : (
              <span className="text-lg font-semibold text-gray-400">Guest</span>
            )}
          </div>

          {/* 2. 검색 영역 */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="도서명을 검색하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button className="absolute right-2 top-2 px-3 py-1 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700">
                검색
              </button>
            </div>
          </div>

          {/* 3. 사용자 기능 버튼 영역 */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link 
                  href="/my-page" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  내 정보
                </Link>
                <Link 
                  href="/cart" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  장바구니
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition shadow-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  로그인
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}