import { ProductCreateRequest } from "@/schemas/product.schema";
import { createProduct } from "../services/product.service";
import { Product, ProductActionState } from "@/types/product";

export async function createProductAction(
    prevState: ProductActionState,
    formData: FormData
  ): Promise<ProductActionState<Product>> {
    try {
      const rawData = Object.fromEntries(formData.entries());
      
      // ✅ FormData → 객체 변환 및 타입 캐스팅
      const payload: ProductCreateRequest = {
        productName: String(rawData.productName || ''),
        price: Number(rawData.price),
        stock: Number(rawData.stock),
        type: String(rawData.type) as any,
        description: String(rawData.description || ''),
        imageUrl: rawData.imageUrl ? String(rawData.imageUrl) : null,
      };
  
      // ✅ 서버 액션 호출
      const result = await createProduct(payload);
  
      if (result.success) {
        return {
          success: true,
          message: '상품이 등록되었습니다.',
          data: result.data,
          errors: {},
        };
      }
  
      // ✅ 필드별 에러 매핑
      const fieldErrors: Record<string, string> = {};
      if (result.validationErrors) {
        for (const err of result.validationErrors) {
          fieldErrors[err.field] = err.message;
        }
      }
  
      return {
        success: false,
        message: result.detail,
        errorCode: result.errorCode,
        errors: fieldErrors,
      };
    } catch (error) {
      console.error('[createProductAction] Error:', error);
      return {
        success: false,
        message: '예기치 못한 오류가 발생했습니다.',
        errors: {},
      };
    }
  }