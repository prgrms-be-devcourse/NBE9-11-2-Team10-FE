
import { ProductListQuery, ProductType, PublicStatus } from '@/schemas/product.schema';
import ProductList from '@/components/products/ProductList';
import ProductFilters from '@/components/products/ProductFilters';
import { fetchProductList } from '@/lib/services/product.service';
import ErrorMessage from '@/components/products/ErrorMessage';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    size?: string;
    type?: ProductType;
    status?: PublicStatus;
    sellerId?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // ✅ 쿼리 파싱 및 검증
  const query: ProductListQuery = {
    page: params.page ? Number(params.page) : 1,
    size: params.size ? Number(params.size) : 10,
    type: params.type,
    status: params.status,
    sellerId: params.sellerId ? Number(params.sellerId) : undefined,
  };

  // ✅ 서버 액션 호출
  const result = await fetchProductList(query);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-slate-50">
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage 
            detail={result.detail}
            errorCode={result.errorCode}
            status={result.status}
            validationErrors={result.validationErrors}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 rounded-3xl border border-stone-200/80 bg-white/90 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur">
          <p className="text-sm font-medium tracking-[0.18em] text-stone-500 uppercase">
            {query.sellerId ? "Author Collection" : "Curated Books"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">
            {query.sellerId ? "작가 상품 전체보기" : "상품 목록"}
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {query.sellerId
              ? "이 작가가 등록한 상품만 모아서 보고 있습니다."
              : "마음에 드는 책과 전자책을 골라보고, 작가 페이지로도 바로 이동해보세요."}
          </p>
        </div>

        {/* ✅ 필터: 현재 선택값을 props 로 전달 (초기 렌더링용) */}
        <ProductFilters 
          defaultType={query.type}
          defaultStatus={query.status}
        />
        
        {/* ✅ 목록 */}
        <ProductList 
          products={result.data.content}
          pagination={result.data}
        />
      </div>
    </div>
  );
}
