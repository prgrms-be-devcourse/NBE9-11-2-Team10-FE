import {
  fetchProductDetail,
  findSellerIdByProductId,
} from "@/lib/services/product.service";
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
    if (result.status === 404) notFound();

    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-slate-50">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
          <div className="space-y-4 rounded-3xl border border-stone-200 bg-white/95 p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-gray-900">
              ⚠️ {result.detail}
            </h2>
            <p className="text-sm text-gray-500">
              에러 코드:{" "}
              <code className="rounded bg-stone-100 px-2 py-1">
                {result.errorCode}
              </code>
            </p>
            <Link
              href="/products"
              className="inline-block mt-4 rounded-xl bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              상품 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = result.data;
  const sellerId = product.sellerId ?? await findSellerIdByProductId(product.productId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-slate-50">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 rounded-3xl border border-stone-200/80 bg-white/90 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <nav className="mb-4 text-sm text-gray-500" aria-label="breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href="/products"
                  className="transition-colors hover:text-blue-600"
                >
                  상품 목록
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="max-w-[200px] truncate font-medium text-gray-900">
                {product.productName}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-8 rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-8">
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 aspect-square">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.productName}
                  fill
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-2 text-stone-400">
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

            <div className="flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <StatusBadge status={product.status} />
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600">
                    {product.type === "BOOK" ? "📖 실물 도서" : "📱 전자책"}
                  </span>
                </div>

                <div className="mb-4">
                  <h1 className="text-2xl font-bold leading-tight text-stone-900 md:text-3xl">
                    {product.productName}
                  </h1>

                  <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                    {sellerId ? (
                      <Link
                        href={`/stores/${sellerId}`}
                        className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 transition hover:bg-blue-50 hover:text-blue-700"
                        data-testid="product-seller-link"
                      >
                        ✍️ 작가님: {product.nickname}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                        ✍️ 작가님: {product.nickname}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mb-6 text-3xl font-bold text-blue-600">
                  {product.price.toLocaleString()}원
                </p>

                <div className="mb-8 space-y-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-sm text-stone-600">
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

                {product.description && (
                  <div className="mb-8">
                    <h3 className="mb-2 font-semibold text-stone-900">상품 설명</h3>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-stone-700">
                      {product.description}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row">
                {product.stock > 0 && product.status === "SELLING" ? (
                  <Link
                    href={`/orders/new?productId=${product.productId}&quantity=1`}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-3.5 text-center font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                    data-testid={`product-buy-button-${product.productId}`}
                  >
                    구매하기
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex-1 cursor-not-allowed rounded-xl bg-stone-200 px-6 py-3.5 text-center font-semibold text-stone-400"
                    data-testid={`product-buy-button-${product.productId}-disabled`}
                    aria-disabled="true"
                    aria-label={product.stock === 0 ? "재고가 없습니다" : "판매 중인 상품이 아닙니다"}
                  >
                    {product.stock === 0 ? "품절" : "판매 종료"}
                  </button>
                )}
              </div>
            </div>
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
