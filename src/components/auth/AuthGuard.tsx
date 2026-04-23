// components/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, status, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (status === 'loading' || status === 'idle') return;

    // 🔹 비로그인 사용자: 로그인 페이지로
    if (!user || status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
  }, [user, status, router, pathname]);

  // 로딩 중
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">로그인을 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  // 비로그인
  if (!user || status === 'unauthenticated') {
    return fallback || null;
  }

  return <>{children}</>;
}