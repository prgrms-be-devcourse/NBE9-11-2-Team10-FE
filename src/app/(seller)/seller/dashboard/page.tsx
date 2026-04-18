// app/seller/dashboard/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import SellerGuard from "@/components/auth/SellerGuard";
import AccessDenied from "@/components/auth/AccessDenied";

export const metadata: Metadata = {
  title: "대시보드 | 판매자 센터",
  description: "판매자 센터 대시보드입니다.",
};

// ============================================================================
// 🖼️ 판매자 대시보드 (임시)
// ============================================================================
export default function SellerDashboardPage() {
  return (
    <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {/* 🔹 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              👋 판매자 센터
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              상품 관리, 주문 처리, 판매 현황을 한눈에 확인하세요.
            </p>
          </div>

          {/* 🔹 임시 안내 카드 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                  🚧
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  대시보드 개발 중
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  현재는 상품 관리 기능만 제공됩니다. 추후 주문 관리, 판매 통계,
                  알림 센터 등이 추가될 예정입니다.
                </p>
              </div>
            </div>
          </div>

          {/* 🔹 퀵 액션 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ✅ 상품 관리 */}
            <Link
              href="/seller/products/new"
              className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📦</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  새 상품 등록
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                판매할 새로운 상품을 등록하고 관리하세요.
              </p>
            </Link>

            {/* ✅ 상품 목록 (나중에 구현될 프로필 페이지로 연결) */}
            <Link
              href="/seller/products"
              className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📋</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  내 상품 관리
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                등록한 상품 목록을 조회하고 수정/삭제하세요.
              </p>
            </Link>

            {/* ✅ 주문 관리 (임시 비활성화) */}
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🧾</span>
                <h3 className="font-semibold text-gray-500">주문 관리</h3>
              </div>
              <p className="text-sm text-gray-400">준비 중인 기능입니다.</p>
            </div>

            {/* ✅ 판매 통계 (임시 비활성화) */}
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📊</span>
                <h3 className="font-semibold text-gray-500">판매 통계</h3>
              </div>
              <p className="text-sm text-gray-400">준비 중인 기능입니다.</p>
            </div>

            {/* ✅ 설정 (임시 비활성화) */}
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 opacity-60 cursor-not-allowed">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">⚙️</span>
                <h3 className="font-semibold text-gray-500">판매자 설정</h3>
              </div>
              <p className="text-sm text-gray-400">준비 중인 기능입니다.</p>
            </div>

            {/* ✅ 도움말 */}
            <Link
              href="/help"
              className="group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">❓</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  도움말 / 문의
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                사용 가이드를 확인하거나 문의하세요.
              </p>
            </Link>
          </div>

          {/* 🔹 하단 푸터 (선택) */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© 2024 판매자 센터. 모든 권리 보유.</p>
          </div>
        </div>
      </div>
    </SellerGuard>
  );
}
