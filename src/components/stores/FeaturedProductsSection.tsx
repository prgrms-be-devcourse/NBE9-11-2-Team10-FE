import { fetchFeaturedProducts } from "@/lib/services/store.service";
import Link from "next/link";
import Image from "next/image";
import { ApiError } from "@/utils/error/stores.error";

interface Props {
  sellerId: string;
}

export async function FeaturedProductsSection({ sellerId }: Props) {
  let featuredProducts;

  try {
    featuredProducts = await fetchFeaturedProducts(sellerId);
  } catch (error) {
    // 404 에러 처리
    if (error instanceof ApiError && error.status === 404) {
      return (
        <section className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Favorite</h2>
          <div className="text-center py-8 text-gray-500">
            판매자 정보를 찾을 수 없습니다.
          </div>
        </section>
      );
    }

    // 기타 에러 처리
    return (
      <section className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Favorite</h2>
        <div className="text-center py-8 text-red-500">
          상품을 불러올 수 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-gray-50 rounded-lg p-6 mb-6"
      data-testid="featured-products-section"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          className="text-xl font-bold text-gray-800"
          data-testid="section-title"
        >
          Favorite
        </h2>
        <Link
          href={`/products?sellerId=${sellerId}&page=1`}
          className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
          data-testid="seller-products-link"
        >
          해당 작가 상품 전체보기
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4" data-testid="products-grid">
        {featuredProducts.products.length > 0 ? (
          featuredProducts.products.map((product) => (
            <Link
              key={product.productId}
              href={`/products/${product.productId}`}
              className="group"
              data-testid={`product-card-${product.productId}`} // ✅ 상품 카드 식별자
            >
              <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                {/* 이미지 */}
                <div className="aspect-square relative mb-3 rounded-md overflow-hidden bg-gray-100">
                  {product.thumbnailUrl ? (
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.productName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      data-testid="product-image"
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center h-full text-gray-400"
                      data-testid="image-placeholder"
                    >
                      {/* placeholder icon */}
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* 상품명 */}
                <h3
                  className="font-medium text-sm text-gray-800 line-clamp-2 mb-1"
                  data-testid="product-name"
                >
                  {product.productName}
                </h3>

                {/* 가격 + 할인 */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-lg font-bold text-gray-900"
                    data-testid="product-price"
                  >
                    {product.price.toLocaleString()}원
                  </span>
                  {product.discountRate && (
                    <span
                      className="text-xs text-red-500 font-medium"
                      data-testid="product-discount"
                    >
                      {product.discountRate}%
                    </span>
                  )}
                </div>

                {/* 품절 뱃지 */}
                {product.isSoldOut && (
                  <span
                    className="inline-block mt-2 text-xs bg-gray-800 text-white px-2 py-1 rounded"
                    data-testid="product-sold-out-badge"
                  >
                    품절
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div
            className="col-span-3 text-center py-8 text-gray-500"
            data-testid="empty-products-message"
          >
            강조된 상품이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
