'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { ProductType, PublicStatus } from '@/schemas/product.schema';

interface ProductFiltersProps {
  // 서버에서 전달받은 현재 필터값 (초기 렌더링용)
  defaultType?: ProductType;
  defaultStatus?: PublicStatus;
}

export default function ProductFilters({ defaultType, defaultStatus }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ✅ 필터 변경 핸들러: URL 업데이트 + 페이지 리셋
  const handleFilterChange = useCallback(
    (key: 'type' | 'status', value: string | null) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
        
        params.set('page', '1'); // ✅ 페이지 리셋
        
        // ✅ 1. URL 업데이트
        router.replace(`?${params.toString()}`, { scroll: false });
        // ✅ 2. 서버 컴포넌트 재실행 트리거 (★ 핵심!)
        router.refresh();
      });
    },
    [router, searchParams]
  );

  // ✅ 초기화 핸들러
  const handleReset = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('size', searchParams.get('size') || '10');
      
      router.replace(`?${params.toString()}`, { scroll: false });
      router.refresh(); // ✅ 서버 데이터 갱신
    });
  }, [router, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
      
      {/* 🔹 상품 유형 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">유형:</span>
        <div className="flex gap-1">
          <FilterButton
            label="전체"
            isActive={!searchParams.has('type')}
            onClick={() => handleFilterChange('type', null)}
            disabled={isPending}
            testId="filter-type-ALL"
          />
          <FilterButton
            label="실물 도서"
            isActive={searchParams.get('type') === 'BOOK'}
            onClick={() => handleFilterChange('type', 'BOOK')}
            disabled={isPending}
            testId="filter-type-BOOK"
          />
          <FilterButton
            label="전자책"
            isActive={searchParams.get('type') === 'EBOOK'}
            onClick={() => handleFilterChange('type', 'EBOOK')}
            disabled={isPending}
            testId="filter-type-EBOOK"
          />
        </div>
      </div>

      {/* 🔹 판매 상태 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">상태:</span>
        <div className="flex gap-1">
          <FilterButton
            label="전체"
            isActive={!searchParams.has('status')}
            onClick={() => handleFilterChange('status', null)}
            disabled={isPending}
            testId="filter-status-ALL"
          />
          <FilterButton
            label="판매중"
            isActive={searchParams.get('status') === 'SELLING'}
            onClick={() => handleFilterChange('status', 'SELLING')}
            disabled={isPending}
            testId="filter-status-SELLING"
          />
          <FilterButton
            label="품절"
            isActive={searchParams.get('status') === 'SOLD_OUT'}
            onClick={() => handleFilterChange('status', 'SOLD_OUT')}
            disabled={isPending}
            testId="filter-status-SOLD_OUT"
          />
        </div>
      </div>

      {/* 🔹 초기화 버튼 */}
      {(searchParams.has('type') || searchParams.has('status')) && (
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="ml-auto text-sm text-gray-500 hover:text-gray-700 
                     disabled:opacity-50 underline decoration-dotted"
        >
          필터 초기화
        </button>
      )}

      {/* 🔹 로딩 인디케이터 (선택사항) */}
      {isPending && (
        <div className="ml-2 flex items-center gap-1 text-sm text-gray-500">
          <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <span>필터 적용 중...</span>
        </div>
      )}
    </div>
  );
}

// 🔹 재사용 가능한 필터 버튼 컴포넌트
interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}

function FilterButton({ label, isActive, onClick, disabled, testId }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors border ${
        isActive
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}