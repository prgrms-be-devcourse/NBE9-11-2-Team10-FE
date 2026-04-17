'use server';

import { redirect } from 'next/navigation';  // ✅ redirect 임포트
import { createProduct } from '@/lib/services/product.service';
import { ProductCreateRequest } from '@/schemas/product.schema';
import { ProductActionState } from '@/types/product';

export async function handleCreateProduct(
  prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  let productId: number = -1;
  try {
    const data: ProductCreateRequest = {
      productName: formData.get('productName') as string,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      type: formData.get('type') as 'BOOK' | 'EBOOK',
      description: formData.get('description') as string || undefined,
      imageUrl: formData.get('imageUrl') as string || null,
    };

    const result = await createProduct(data);
    
    // ❌ 실패 시: 에러 상태를 반환하여 폼에 표시
    if (!result.success) {
      return {
        success: false,
        message: result.detail,
        errorCode: result.errorCode,
        errors: result.validationErrors?.reduce((acc, err) => ({
          ...acc,
          [err.field]: err.message,
        }), {}),
      };
    }

    productId = result.data.productId;
    
  } catch (error) {
    return {
      success: false,
      message: '서버 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  // ✅ 성공 시: 서버에서 직접 리다이렉트
  redirect(`/products/${productId}`);
}