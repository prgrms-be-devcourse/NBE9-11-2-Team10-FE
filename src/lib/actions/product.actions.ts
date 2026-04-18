"use server";

import { redirect } from "next/navigation"; // ✅ redirect 임포트
import {
  createProduct,
  deactivateProduct,
  updateProduct,
} from "@/lib/services/product.service";
import {
  ProductCreateRequest,
  ProductUpdateRequest,
} from "@/schemas/product.schema";
import { ProductActionState } from "@/types/product";

export async function handleCreateProduct(
  prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  let productId: number = -1;
  try {
    const data: ProductCreateRequest = {
      productName: formData.get("productName") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      type: formData.get("type") as "BOOK" | "EBOOK",
      description: (formData.get("description") as string) || undefined,
      imageUrl: (formData.get("imageUrl") as string) || null,
    };

    const result = await createProduct(data);

    // ❌ 실패 시: 에러 상태를 반환하여 폼에 표시
    if (!result.success) {
      return {
        success: false,
        message: result.detail,
        errorCode: result.errorCode,
        errors: result.validationErrors?.reduce(
          (acc, err) => ({
            ...acc,
            [err.field]: err.message,
          }),
          {},
        ),
      };
    }

    productId = result.data.productId;
  } catch (error) {
    return {
      success: false,
      message: "서버 오류가 발생했습니다.",
      errorCode: "UNKNOWN_ERROR",
    };
  }

  // ✅ 성공 시: 서버에서 직접 리다이렉트
  redirect(`/products/${productId}`);
}

export async function handleUpdateProduct(
  prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const productId = Number(formData.get("productId"));

  if (!Number.isInteger(productId) || productId < 1) {
    return {
      success: false,
      message: "유효하지 않은 상품 ID입니다.",
      errorCode: "INVALID_ID",
    };
  }

  try {
    const data: ProductUpdateRequest = {
      productId,
      productName: formData.get("productName") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      type: formData.get("type") as "BOOK" | "EBOOK",
      description: (formData.get("description") as string) || undefined,
      imageUrl: (formData.get("imageUrl") as string) || null,
      // status는 별도 액션으로 관리하므로 여기선 제외
    };

    const result = await updateProduct(productId, data);

    if (!result.success) {
      return {
        success: false,
        message: result.detail,
        errorCode: result.errorCode,
        errors: result.validationErrors?.reduce(
          (acc, err) => ({
            ...acc,
            [err.field]: err.message,
          }),
          {},
        ),
      };
    }
  } catch (error) {
    console.error("[handleUpdateProduct] Error:", error);
    return {
      success: false,
      message: "서버 오류가 발생했습니다.",
      errorCode: "UNKNOWN_ERROR",
    };
  }
  // ✅ 수정 성공 시 상세 페이지로 리다이렉트
  redirect(`/seller/products/${productId}`);
}

// ============================================================================
// 🔹 상품 비활성화 (삭제) 액션
// ============================================================================
export async function deactivateProductAction(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const productId = Number(formData.get("productId"));

  // ✅ ID 유효성 검증
  if (!Number.isInteger(productId) || productId < 1) {
    return { error: "invalid_id" };
  }

  const result = await deactivateProduct(productId);

  // ✅ 에러 처리
  if (!result.success) {
    return { error: result.detail || "unknown_error" };
  }

  // ✅ 성공 시 리다이렉트
  redirect("/seller/dashboard");
}
