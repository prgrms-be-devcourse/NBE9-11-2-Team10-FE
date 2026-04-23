// app/page.tsx
'use client';

import { useAuthStore } from "@/stores/useAuthStore";
import { ProductListResult, ProductSummary } from "@/types/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`)
      .then((res) => res.json())
      .then((result: ProductListResult) => {
        if (result.success) {
          setProducts(result.data.content);
        } 
      })
      .catch(() => {
      });
  }, []);

  const handleMoveStore = () => {
    if (!user?.id) return;
    router.push(`/stores/${user.id}`);
  };

  return (
    <main className="flex-grow bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {user?.role === "SELLER" && (
        <button
          onClick={handleMoveStore}
          className="
            w-full
            h-20
            px-6 py-3
            bg-green-600
            text-white
            font-semibold
            text-big
            rounded-lg
            shadow-md
            hover:bg-blue-700
            hover:shadow-lg
            transition-all
            active:scale-[0.98]
          "
        >
          ⭐ 나의 판매자 공간으로 이동하기 ⭐
        </button>
      )}

        <div className="flex gap-6">
    
          {/* 왼쪽: 상품 목록 */}
          <section className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">🔥 상품 목록</h3>
              <button 
                onClick={() => router.push('/products')}
                className="text-sm text-blue-600 font-medium hover:underline">더보기 &gt;</button>
            </div>
              <div className="space-y-4">
                {products.slice(0, 10).map((product: ProductSummary) => (
                  <Link
                  key={product.productId}
                  href={`/products/${product.productId}`}
                  className="block"
                  >
                    <div className="flex items-center p-3 border rounded-md hover:shadow-md transition bg-gray-50">
                      <div className="w-12 h-16 bg-gray-300 rounded mr-4 flex-shrink-0 overflow-hidden relative">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <div>
                      <p className="font-semibold text-gray-700">{product.productName}</p>
                      <p className="text-sm text-gray-500">{product.nickname} • {product.price.toLocaleString()}원</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
          </section>

          {/* 오른쪽: 나중에 콘텐츠 */}
          {/* <section className="flex-1 bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">✨ 판매자 목록</h3> */}
              {/* <button 
                onClick={() => router.push('/products')}
                className="text-sm text-blue-600 font-medium hover:underline">더보기 &gt;</button> */}
            {/* </div>
            <div className="space-y-4"> */}
            {/* {placeholderBooks.map((i) => ( */}
                  {/* <div className="flex items-center p-3 border rounded-md hover:shadow-md transition bg-gray-50">
                    <div className="w-12 h-16 bg-gray-300 rounded mr-4 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-gray-700">신간 도서 제목</p>
                      <p className="text-sm text-gray-500">저자 이름 • 18,000 원</p>
                    </div>
                  </div> */}
                {/* ))} */}
            {/* </div>
          </section> */}

        </div>
      </div>
    </main>
  );
}