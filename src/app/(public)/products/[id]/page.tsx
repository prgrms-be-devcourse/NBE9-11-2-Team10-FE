import { fetchProductDetail } from "@/lib/services/product.service";
import { ProductStatus } from "@/schemas/product.schema";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/products/StatusBadge";
import Image from "next/image";

interface PageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// 🖼️ 상품 상세 페이지 (서버 컴포넌트)
// ============================================================================
export default async function ProductDetailPage({ params }: PageProps) {
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
    console.log(JSON.stringify(result));
    if (result.status === 404) notFound();

    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            ⚠️ {result.detail}
          </h2>
          <p className="text-sm text-gray-500">
            에러 코드:{" "}
            <code className="px-2 py-1 bg-gray-100 rounded">
              {result.errorCode}
            </code>
          </p>
          <Link
            href="/products"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const product = result.data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ✅ 빵조각 네비게이션 (Breadcrumb) */}
      <nav className="text-sm text-gray-500 mb-6" aria-label="breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <Link
              href="/products"
              className="hover:text-blue-600 transition-colors"
            >
              상품 목록
            </Link>
          </li>
          <li className="text-gray-300">/</li>
          <li className="text-gray-900 font-medium truncate max-w-[200px]">
            {product.productName}
          </li>
        </ol>
      </nav>

      {/* ✅ 메인 컨텐츠 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        {/* 🔹 이미지 섹션 */}
        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.productName}
              fill
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="eager"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">이미지가 준비되지 않았습니다</span>
            </div>
          )}
        </div>

        {/* 🔹 상품 정보 섹션 */}
        <div className="flex flex-col justify-between">
          <div>
            {/* 상태 뱃지 & 유형 */}
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={product.status} />
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {product.type === "BOOK" ? "📖 실물 도서" : "📱 전자책"}
              </span>
            </div>

            {/* 상품명 & 가격 */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {product.productName}
            </h1>
            <p className="text-3xl font-bold text-blue-600 mb-6">
              {product.price.toLocaleString()}원
            </p>

            {/* 상세 정보 테이블 */}
            <div className="space-y-3 mb-8 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <InfoRow
                label="재고"
                value={
                  product.stock > 0
                    ? `${product.stock.toLocaleString()}개`
                    : "품절"
                }
                valueColor={
                  product.stock === 0
                    ? "text-red-500 font-semibold"
                    : "text-green-600 font-medium"
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
                <h3 className="font-semibold text-gray-900 mb-2">상품 설명</h3>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {product.description}
                </div>
              </div>
            )}
          </div>

          {/* ✅ 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              disabled={product.status !== "SELLING" || product.stock === 0}
              className="flex-1 py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-xl 
                         hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed 
                         transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {product.stock === 0 || product.status !== "SELLING"
                ? "구매 불가"
                : "구매하기"}
            </button>
            <button
              disabled={product.status !== "SELLING"}
              className="flex-1 py-3.5 px-6 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl 
                         hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all active:scale-[0.98]"
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 🧩 보조 컴포넌트
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
