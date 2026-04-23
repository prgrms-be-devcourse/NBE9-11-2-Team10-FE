import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SellerGuard from "@/components/auth/SellerGuard";
import AccessDenied from "@/components/auth/AccessDenied";
import { fetchMyProductList } from "@/lib/services/product.service";
import { ProductType } from "@/schemas/product.schema";

export const metadata: Metadata = {
  title: "내 상품 관리 | 판매자 센터",
  description: "내가 등록한 상품 목록을 확인하고 관리합니다.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    type?: ProductType;
    status?: "SELLING" | "SOLD_OUT";
  }>;
}

export default async function SellerProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = {
    page: params.page ? Number(params.page) : 1,
    size: params.size ? Number(params.size) : 12,
    type: params.type,
    status: params.status,
  };

  const result = await fetchMyProductList(query);

  if (!result.success) {
    return (
      <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">내 상품 관리</h1>
            <div className="bg-white border border-red-200 rounded-xl p-6">
              <p className="text-red-600 font-medium">
                상품 목록을 불러오지 못했습니다.
              </p>
              <p className="text-sm text-gray-600 mt-2">{result.detail}</p>
            </div>
          </div>
        </div>
      </SellerGuard>
    );
  }

  const products = result.data.content;
  const pagination = result.data;

  return (
    <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                내 상품 관리
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                등록한 상품을 클릭하면 상세 관리 페이지로 이동합니다.
              </p>
            </div>
            <Link
              href="/seller/products/new"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 새 상품 등록
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-700 font-medium">등록한 상품이 없습니다.</p>
              <p className="text-sm text-gray-500 mt-2">
                먼저 상품을 등록하고 판매를 시작해보세요.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.productId}
                    href={`/seller/products/${product.productId}`}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.status === "SELLING"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.status === "SELLING" ? "판매중" : "품절"}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{product.productId}
                        </span>
                      </div>
                      <h2 className="font-semibold text-gray-900 line-clamp-1">
                        {product.productName}
                      </h2>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        {product.price.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {product.type === "BOOK" ? "실물 도서" : "전자책"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-2">
                {pagination.page > 1 && (
                  <Link
                    href={`?page=${pagination.page - 1}&size=${pagination.size}`}
                    className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
                  >
                    이전
                  </Link>
                )}
                <span className="text-sm text-gray-600 px-3">
                  {pagination.page} / {pagination.totalPages}
                </span>
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`?page=${pagination.page + 1}&size=${pagination.size}`}
                    className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
                  >
                    다음
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </SellerGuard>
  );
}
