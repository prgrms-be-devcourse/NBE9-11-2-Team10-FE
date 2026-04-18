'use client';

import { useEffect } from 'react';  // ✅ useEffect 임포트
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, UserRole } from '@/stores/useAuthStore';

interface SellerGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ALLOWED_ROLES: UserRole[] = ['SELLER'];

export default function SellerGuard({ children, fallback }: SellerGuardProps) {
  const { user, status, checkAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ 1. 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ✅ 2. 인증 상태가 결정된 후 리다이렉트 처리 (★ 핵심 수정)
  useEffect(() => {
    // 로딩 중이면 아무것도 하지 않음
    if (status === 'loading' || status === 'idle') return;

    // 🔹 비로그인 사용자: 로그인 페이지로
    if (!user || status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 🔹 권한 없는 사용자: 접근 거부 페이지로
    if (!ALLOWED_ROLES.includes(user.role)) {
      if (fallback) return; // fallback 이 있으면 여기서 멈춤 (아래에서 렌더링)
      router.replace('/access-denied?role=SELLER_REQUIRED');
    }
  }, [user, status, router, pathname, fallback]);  // ✅ 의존성 배열에 모든 변수 포함

  // 🔹 로딩 중: 스켈레톤 표시
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">접근 권한을 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  // 🔹 비로그인 또는 권한 없음 + fallback 없을 때: null 반환 (리다이렉트 진행 중)
  if (!user || status === 'unauthenticated') {
    return null;  // ✅ useEffect 에서 이미 리다이렉트 예약됨
  }

  if (!ALLOWED_ROLES.includes(user.role)) {
    // ✅ fallback 이 있으면 표시, 없으면 위 useEffect 에서 리다이렉트
    if (fallback) return <>{fallback}</>;
    return null;
  }

  // ✅ 모든 조건 통과: 자식 컴포넌트 렌더링
  return <>{children}</>;
}