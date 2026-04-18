
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
  };

  // ✅ 서버 액션 호출
  const result = await fetchProductList(query);

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          detail={result.detail}
          errorCode={result.errorCode}
          status={result.status}
          validationErrors={result.validationErrors}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">상품 목록</h1>
      
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
  );
}