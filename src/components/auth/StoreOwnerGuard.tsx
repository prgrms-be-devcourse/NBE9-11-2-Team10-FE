// src/components/auth/StoreOwnerGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';

interface StoreOwnerGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  sellerId?: string;
}

export default function StoreOwnerGuard({ 
  children, 
  fallback,
  sellerId: propSellerId 
}: StoreOwnerGuardProps) {
  const { user, status, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // props 또는 URL에서 sellerId 추출
  const sellerId = propSellerId ?? params?.sellerId as string;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (status === 'loading' || status === 'idle') return;

    // 1. 비로그인
    if (!user || status === 'unauthenticated') {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. 판매자 아님
    if (user.role !== 'SELLER') {
      if (fallback) return;
      return;
    }

    // 3. ⭐ 본인 스토어 아님
    if (sellerId && user.id.toString() !== sellerId) {
      if (fallback) return;
    }
  }, [user, status, router, pathname, fallback, sellerId]);

  // 로딩
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">소유권을 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  // 권한 없음
  if (!user || status === 'unauthenticated') return null;
  if (user.role !== 'SELLER') {
    if (fallback) return <>{fallback}</>;
    return null;
  }
  if (sellerId && user.id.toString() !== sellerId) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <>{children}</>;
}