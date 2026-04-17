// src/components/products/ProductForm.tsx
'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductActionState, initialProductState } from '@/types/product';

type ProductAction = (
  prevState: ProductActionState,
  formData: FormData
) => Promise<ProductActionState>;

interface ProductFormProps {
  action: ProductAction;
  mode: 'create' | 'edit';
  initialData?: Partial<Product>;
}

export default function ProductForm({ action, mode, initialData = {} }: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialProductState);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-6 max-w-2xl" noValidate>

      {/* 🔴 1. 전역 에러 메시지 (상단) */}
      {!state.success && state.message && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-800">입력 오류</h3>
              <p className="text-sm text-red-700 mt-1">{state.message}</p>
              {state.errorCode && (
                <p className="text-xs text-red-600 mt-1">코드: {state.errorCode}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 상품명 */}
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
          상품명
          <span className="text-red-600 ml-1" aria-label="required">*</span>
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          defaultValue={initialData.productName ?? ''}
          maxLength={100}
          required
          aria-required="true"
          aria-invalid={!!state.errors?.productName}
          aria-describedby={state.errors?.productName ? 'productName-error' : undefined}
          className={`w-full px-4 py-2.5 border rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${state.errors?.productName
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            text-gray-900 placeholder:text-gray-400`}
          placeholder="상품명을 입력하세요"
        />
        {/* 🔴 2. 필드별 에러 메시지 */}
        {state.errors?.productName && (
          <p id="productName-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.errors.productName}
          </p>
        )}
      </div>

      {/* 가격 & 재고 (2열) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 가격 */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            가격
            <span className="text-red-600 ml-1" aria-label="required">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="price"
              name="price"
              defaultValue={initialData.price?.toString() ?? ''}
              min="0"
              step="500"
              required
              aria-required="true"
              aria-invalid={!!state.errors?.price}
              aria-describedby={state.errors?.price ? 'price-error' : undefined}
              className={`w-full px-4 py-2.5 border rounded-lg transition-colors pr-12
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${state.errors?.price
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
        text-gray-900 placeholder:text-gray-400`}  // ✅ 입력값: 진한 회색
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              원
            </span>
          </div>
          {state.errors?.price && (
            <p id="price-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {state.errors.price}
            </p>
          )}
        </div>

        {/* 재고 */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
            재고
            <span className="text-red-600 ml-1" aria-label="required">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="stock"
              name="stock"
              defaultValue={initialData.stock?.toString() ?? ''}
              min="0"
              step="1"  // ✅ 개수는 1씩 증가
              required
              aria-required="true"
              aria-invalid={!!state.errors?.stock}
              aria-describedby={state.errors?.stock ? 'stock-error' : undefined}
              className={`w-full px-4 py-2.5 border rounded-lg transition-colors pr-12
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${state.errors?.stock
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
        text-gray-900 placeholder:text-gray-400`}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              개
            </span>
          </div>
          {state.errors?.stock && (
            <p id="stock-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {state.errors.stock}
            </p>
          )}
        </div>
      </div>

      {/* 상품 유형 */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          상품 유형
          <span className="text-red-600 ml-1" aria-label="required">*</span>
        </label>
        <select
          id="type"
          name="type"
          defaultValue={initialData.type ?? 'BOOK'}
          required
          aria-required="true"
          aria-invalid={!!state.errors?.type}
          aria-describedby={state.errors?.type ? 'type-error' : undefined}
          className={`w-full px-4 py-2.5 border rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${state.errors?.type
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            text-gray-900`}
        >
          <option value="BOOK">실물 도서</option>
          <option value="EBOOK">전자책</option>
        </select>
        {state.errors?.type && (
          <p id="type-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.errors.type}
          </p>
        )}
      </div>

      {/* 이미지 URL */}
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
          이미지 URL
        </label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          defaultValue={initialData.imageUrl ?? ''}
          aria-invalid={!!state.errors?.imageUrl}
          aria-describedby={state.errors?.imageUrl ? 'imageUrl-error' : 'imageUrl-help'}
          className={`w-full px-4 py-2.5 border rounded-lg transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${state.errors?.imageUrl
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            text-gray-900 placeholder:text-gray-400`}
          placeholder="https://example.com/image.jpg"
        />
        <p id="imageUrl-help" className="mt-1.5 text-sm text-gray-900">
          상품 이미지의 URL 을 입력하세요. (선택사항)
        </p>
        {state.errors?.imageUrl && (
          <p id="imageUrl-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.errors.imageUrl}
          </p>
        )}
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initialData.description ?? ''}
          maxLength={1000}
          aria-invalid={!!state.errors?.description}
          aria-describedby={state.errors?.description ? 'description-error' : 'description-help'}
          className={`w-full px-4 py-2.5 border rounded-lg transition-colors resize-y
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${state.errors?.description
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
            text-gray-900 placeholder:text-gray-400`}
          placeholder="상품에 대한 상세 설명을 입력하세요"
        />
        <div className="flex justify-between items-center mt-1.5">
          <p id="description-help" className="text-sm text-gray-900">
            최대 1000 자까지 입력할 수 있습니다. (선택사항)
          </p>
          <span className="text-sm text-gray-400">
            {(initialData.description ?? '').length}/1000
          </span>
        </div>
        {state.errors?.description && (
          <p id="description-error" className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.errors.description}
          </p>
        )}
      </div>

      {/* ✅ productId (edit 모드에서만) */}
      {mode === 'edit' && initialData.productId && (
        <input type="hidden" name="productId" value={initialData.productId} />
      )}

      {/* 버튼 그룹 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex justify-center items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
            transition-colors min-w-[120px]"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              처리 중...
            </>
          ) : (
            mode === 'create' ? '등록하기' : '수정하기'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="inline-flex justify-center items-center px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors min-w-[120px]"
        >
          취소
        </button>
      </div>
    </form>
  );
}