// app/seller/products/[id]/page.tsx
import { fetchProductDetail } from "@/lib/services/product.service";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SellerGuard from "@/components/auth/SellerGuard";
import AccessDenied from "@/components/auth/AccessDenied";
import { StatusBadge } from "@/components/products/StatusBadge";
import Image from "next/image";
import DeactivateForm from "@/components/seller/DeactivateForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `상품 관리 #${id} | 판매자 센터`,
    description: "상품 정보를 조회하고 수정하세요.",
  };
}

// ============================================================================
// 🖼️ 판매자 전용 상품 상세 (관리용)
// ============================================================================
export default async function SellerProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);

  // ✅ ID 유효성 검증
  if (!Number.isInteger(productId) || productId < 1) {
    notFound();
  }

  // ✅ 데이터 조회
  const result = await fetchProductDetail(productId);

  // ❌ 에러 처리
  if (!result.success) {
    if (result.status === 404) notFound();
    return (
      <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
        <div className="container mx-auto px-4 py-12 min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              ⚠️ {result.detail}
            </h2>
            <Link
              href="/seller/dashboard"
              className="text-blue-600 hover:underline"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </SellerGuard>
    );
  }

  const product = result.data;

  return (
    <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 🔹 Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/seller/dashboard" className="hover:text-blue-600">
                대시보드
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.productName}
            </li>
          </ol>
        </nav>

        {/* 🔹 메인 컨텐츠 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          {/* 🖼️ 이미지 섹션 */}
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.productName}
                fill
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                <span className="text-sm">이미지가 없습니다</span>
              </div>
            )}
          </div>

          {/* 📋 상품 정보 + 액션 */}
          <div className="flex flex-col justify-between">
            <div>
              {/* 상태 & 유형 */}
              <div className="flex items-center justify-between mb-4">
                <StatusBadge status={product.status} />
                <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {product.type === "BOOK" ? "📖 실물 도서" : "📱 전자책"}
                </span>
              </div>

              {/* 상품명 & 가격 */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.productName}
              </h1>
              <p className="text-3xl font-bold text-blue-600 mb-6">
                {product.price.toLocaleString()}원
              </p>

              {/* 관리자용 정보 */}
              <div className="space-y-3 mb-8 text-sm text-gray-600 border-t border-gray-100 pt-4">
                <InfoRow label="상품 ID" value={`#${product.productId}`} />
                <InfoRow
                  label="재고"
                  value={`${product.stock.toLocaleString()}개`}
                  valueColor={
                    product.stock === 0
                      ? "text-red-500 font-semibold"
                      : "text-green-600"
                  }
                />
                <InfoRow label="등록일" value={formatDate(product.createdAt)} />
                <InfoRow
                  label="최근 수정"
                  value={formatDate(product.updatedAt)}
                />
              </div>

              {/* 설명 */}
              {product.description && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    상품 설명
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {product.description}
                  </div>
                </div>
              )}
            </div>

            {/* 🎯 관리자 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <Link
                href={`/seller/products/${product.productId}/edit`}
                className="flex-1 py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-xl 
                           hover:bg-blue-700 text-center transition-all"
              >
                ✏️ 상품 수정하기
              </Link>

              <DeactivateForm productId={product.productId} />
            </div>
          </div>
        </div>

        {/* 🔹 하단 네비게이션 */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/seller/dashboard"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← 대시보드로
          </Link>
          {product.status === "SELLING" && (
            <Link
              href={`/products/${product.productId}`}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              target="_blank"
            >
              공개 페이지에서 보기 ↗
            </Link>
          )}
        </div>
      </div>
    </SellerGuard>
  );
}

// ============================================================================
// 🧩 보조 컴포넌트 (기존과 동일)
// ============================================================================

function InfoRow({
  label,
  value,
  valueColor = "text-gray-900",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={valueColor}>{value}</span>
    </div>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}
