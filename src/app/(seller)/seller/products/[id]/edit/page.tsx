// app/seller/products/[id]/edit/page.tsx
import { fetchProductDetail } from "@/lib/services/product.service";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { handleUpdateProduct } from "@/lib/actions/product.actions";
import SellerGuard from "@/components/auth/SellerGuard";
import AccessDenied from "@/components/auth/AccessDenied";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `상품 수정 #${id} | 판매자 센터`,
    description: "상품 정보를 수정합니다.",
  };
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isInteger(productId) || productId < 1) notFound();

  // ✅ 상품 상세 조회 (판매자 권한 체크는 API 또는 미들웨어에서 처리 권장)
  const result = await fetchProductDetail(productId);

  if (!result.success || result.data.status === "INACTIVE") {
    notFound();
  }

  const product = result.data;

  return (
    <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {/* 🔹 Breadcrumb */}
          <nav className="mb-8" aria-label="breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-gray-500">
              <li>
                <Link href="/seller/dashboard" className="hover:text-blue-600">
                  대시보드
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <Link href="/seller/products" className="hover:text-blue-600">
                  상품 관리
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="text-gray-900 font-medium" aria-current="page">
                상품 수정
              </li>
            </ol>
          </nav>

          {/* 🔹 Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              상품 정보 수정
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              상품{" "}
              <span className="font-semibold text-gray-900">
                #{product.productId}
              </span>{" "}
              의 정보를 수정합니다.
            </p>
          </div>

          {/* 🔹 Form Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <ProductForm
              action={handleUpdateProduct} // ✅ 수정 액션 연결
              mode="edit" // ✅ 수정 모드 활성화
              initialData={{
                // ✅ 기존 데이터 주입
                ...product,
                // imageUrl이 null일 경우 빈 문자열로 처리 (폼 입력용)
                imageUrl: product.imageUrl || "",
              }}
            />
          </div>
        </div>
      </div>
    </SellerGuard>
  );
}
