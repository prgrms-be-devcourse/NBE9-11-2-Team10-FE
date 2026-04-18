import { Metadata } from "next";
import Link from "next/link";
import SellerGuard from "@/components/auth/SellerGuard";

export const metadata: Metadata = {
  title: "상품 관리 | 판매자 센터",
};

export default function SellerProductListPlaceholder() {
  return (
    <SellerGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🚧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            상품 목록 페이지 개발 중
          </h1>
          <p className="text-gray-600 mb-6">
            나중에 판매자 프로필 페이지에서 상품 목록 관리 기능을 제공할
            예정입니다.
          </p>
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </SellerGuard>
  );
}
