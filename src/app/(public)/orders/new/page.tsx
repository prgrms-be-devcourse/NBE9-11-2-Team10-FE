import { fetchProductDetail } from "@/lib/services/product.service";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import OrderForm from "@/components/order/OrderForm";

interface PageProps {
  searchParams: Promise<{
    productId?: string;
    quantity?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const productId = params.productId ? Number(params.productId) : null;

  if (!productId) {
    return {
      title: "주문하기",
    };
  }

  const result = await fetchProductDetail(productId);
  
  if (!result.success || !result.data) {
    return {
      title: "주문하기",
    };
  }

  return {
    title: `${result.data.productName} - 주문하기`,
    description: `${result.data.productName} 주문 페이지`,
  };
}

export default async function NewOrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const productId = params.productId ? Number(params.productId) : null;
  const quantity = params.quantity ? Number(params.quantity) : 1;

  // ✅ 상품 ID 검증
  if (!productId || !Number.isInteger(productId) || productId < 1) {
    notFound();
  }

  // ✅ 상품 정보 조회
  const result = await fetchProductDetail(productId);

  if (!result.success) {
    if (result.status === 404) notFound();
    
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            ⚠️ {result.detail}
          </h2>
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

  // ✅ 재고 및 판매 상태 검증
  if (product.stock < quantity || product.status !== "SELLING") {
    return (
      <div className="container mx-auto px-4 py-12 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            {product.stock < quantity ? "재고가 부족합니다" : "구매할 수 없는 상품입니다"}
          </h2>
          <p className="text-gray-500">
            {product.stock < quantity 
              ? `현재 재고: ${product.stock}개 (요청: ${quantity}개)`
              : `상품 상태: ${product.status}`}
          </p>
          <Link
            href={`/products/${productId}`}
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            상품 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // ✅ 주문 정보 준비
  const orderInfo = {
    productId: product.productId,
    productName: product.productName,
    price: product.price,
    quantity,
    totalPrice: product.price * quantity,
    sellerNickname: product.nickname,
    imageUrl: product.imageUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 🔹 헤더 */}
        <div className="mb-8">
          <Link
            href={`/products/${productId}`}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            ← 상품 페이지로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">주문하기</h1>
        </div>

        {/* 🔹 주문 폼 */}
        <OrderForm orderInfo={orderInfo} />
      </div>
    </div>
  );
}