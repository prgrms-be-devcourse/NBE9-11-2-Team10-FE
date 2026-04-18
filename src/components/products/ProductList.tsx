'use client';

import Link from 'next/link';
import { ProductSummary } from '@/types/product';
import { PublicStatus } from '@/schemas/product.schema';
import { useSearchParams } from 'next/navigation';

interface ProductListProps {
  products: ProductSummary[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export default function ProductList({ products, pagination }: ProductListProps) {
  const searchParams = useSearchParams();

  const createPageLink = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));  // ✅ page 만 업데이트, 나머지는 유지
    return `?${params.toString()}`;
  };

  const getStatusBadge = (status: PublicStatus) => {
    const styles = {
      SELLING: 'bg-green-100 text-green-800',
      SOLD_OUT: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      SELLING: '판매중',
      SOLD_OUT: '품절',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${styles[status]}`} data-testid={`status-badge-${status}`} >
        {labels[status]}
      </span>
    );
  };

  if (products.length === 0) {
    return <p className="text-center text-gray-500 py-8">등록된 상품이 없습니다.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.productId}
            href={`/products/${product.productId}`}
            data-testid={`product-card-${product.productId}`}
            className="block border rounded-lg overflow-hidden hover:shadow-lg transition"
          >
            <div className="aspect-square bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  이미지 없음
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium truncate">{product.productName}</h3>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {product.price.toLocaleString()}원
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {product.type === 'BOOK' ? '실물 도서' : '전자책'}
                </span>
                {getStatusBadge(product.status)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ✅ 페이지네이션 */}
      <div className="flex justify-center items-center gap-2 mt-8">
        {/* 이전 버튼: 현재 페이지가 2 이상일 때만 활성화 */}
        {pagination.page > 1 && (  // ✅ 0 → 1
          <Link
            href={createPageLink(pagination.page - 1)}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            data-testid="pagination-prev"
          >
            이전
          </Link>
        )}

        <span className="text-sm text-gray-600" data-testid="pagination-info">
          {/* ✅ totalPages 는 백엔드에서 이미 1-based 로 변환되어 옴 */}
          {pagination.page} / {pagination.totalPages}
        </span>

        {/* 다음 버튼 */}
        {pagination.page < pagination.totalPages && (  // ✅ 0 → 1
          <Link
            href={createPageLink(pagination.page + 1)}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            data-testid="pagination-next"
          >
            다음
          </Link>
        )}
      </div>
    </>
  );
}