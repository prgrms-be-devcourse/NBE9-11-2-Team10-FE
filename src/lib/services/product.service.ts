"use server";

import { revalidateTag } from "next/cache";
import {
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductListQuery,
  productCreateSchema,
  productUpdateSchema,
  productListQuerySchema,
} from "@/schemas/product.schema";
import {
  ProductListResult,
  ProductDetailResult,
  ProductCreateResult,
  ProductUpdateResult,
  ProductDeactivateResult,
  ProductActionState,
  Product,
} from "@/types/product";
import {
  getForwardedHeaders,
  handleApiError,
  parseProblemDetail,
} from "@/utils/helper";

// ============================================================================
// ⚙️ 설정
// ============================================================================
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const PRODUCT_CACHE_TAG = "products";

// ============================================================================
// 🔹 GET /api/v1/products - 상품 목록 조회 (공용)
// ============================================================================
export async function fetchProductList(
  query: ProductListQuery,
): Promise<ProductListResult> {
  try {
    const validated = productListQuerySchema.safeParse(query);
    if (!validated.success) {
      return {
        success: false,
        detail: "요청 파라미터가 올바르지 않습니다.",
        errorCode: "VALIDATION_FAILED",
        status: 400,
        validationErrors: validated.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }

    const { page, size, type, status, sellerId } = validated.data;

    // ✅ [ADAPTER] 1-based (FE) → 0-based (BE) 변환
    const apiPage = page; // ⭐ 사용자 1 → 백엔드 0

    const params = new URLSearchParams({
      page: String(apiPage), // ✅ 변환된 값으로 요청
      size: String(size),
    });
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (sellerId) params.append("sellerId", String(sellerId));

    const response = await fetch(`${API_BASE_URL}/api/v1/products?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      return { success: false, ...parseProblemDetail(error) };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        content: data.content,
        page: data.page,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      },
    };
  } catch (error) {
    console.error("[fetchProductList] Network Error:", error);
    return {
      success: false,
      detail: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
      errorCode: "NETWORK_ERROR",
      status: 503,
    };
  }
}

// ============================================================================
// 🔹 GET /api/v1/products/:productId - 상품 상세 조회 (공용)
// ============================================================================
export async function fetchProductDetail(
  productId: number,
): Promise<ProductDetailResult> {
  try {
    if (!Number.isInteger(productId) || productId < 1) {
      return {
        success: false,
        detail: "유효한 상품 ID가 필요합니다.",
        errorCode: "INVALID_ID",
        status: 400,
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/products/${productId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", // ✅ 동적 처리 보장
      },
    );

    if (!response.ok) {
      const error = await handleApiError(response);
      return {
        success: false,
        ...parseProblemDetail(error),
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data as Product,
    };
  } catch (error) {
    console.error("[fetchProductDetail] Network Error:", error);
    return {
      success: false,
      detail: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
      errorCode: "NETWORK_ERROR",
      status: 503,
    };
  }
}

// ============================================================================
// 🔹 POST /api/v1/stores/me/products - 상품 등록 (판매자 전용)
// ============================================================================
export async function createProduct(
  data: ProductCreateRequest,
  mockUserId?: string,
): Promise<ProductCreateResult> {
  try {
    // ✅ 요청값 검증
    const validated = productCreateSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        detail: "입력값 검증에 실패했습니다.",
        errorCode: "VALIDATION_FAILED",
        status: 400,
        validationErrors: validated.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }

    const headers = await getForwardedHeaders(
      mockUserId && process.env.NODE_ENV === "test"
        ? { "X-Mock-User-Id": mockUserId }
        : undefined,
    );

    const response = await fetch(`${API_BASE_URL}/api/v1/stores/me/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(validated.data),
      cache: "no-store", // ✅ 민감한 쓰기 작업
    });

    if (!response.ok) {
      const error = await handleApiError(response);
      return {
        success: false,
        ...parseProblemDetail(error),
      };
    }

    const result = await response.json();

    // ✅ 캐시 무효화: 상품 목록 갱신
    revalidateTag(PRODUCT_CACHE_TAG, "max");

    return {
      success: true,
      data: result as Product,
    };
  } catch (error) {
    console.error("[createProduct] Network Error:", error);
    return {
      success: false,
      detail: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
      errorCode: "NETWORK_ERROR",
      status: 503,
    };
  }
}

// ============================================================================
// 🔹 PUT /api/v1/stores/me/products/:productId - 상품 수정 (판매자 전용)
// ============================================================================
export async function updateProduct(
  productId: number,
  data: ProductUpdateRequest,
  mockUserId?: string,
): Promise<ProductUpdateResult> {
  try {
    // ✅ ID 검증
    if (!Number.isInteger(productId) || productId < 1) {
      return {
        success: false,
        detail: "유효한 상품 ID가 필요합니다.",
        errorCode: "INVALID_ID",
        status: 400,
      };
    }

    // ✅ 요청값 검증 (productId 제외)
    const { productId: _, ...updateData } = data;
    const validated = productUpdateSchema.safeParse({
      productId,
      ...updateData,
    });

    if (!validated.success) {
      return {
        success: false,
        detail: "입력값 검증에 실패했습니다.",
        errorCode: "VALIDATION_FAILED",
        status: 400,
        validationErrors: validated.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }

    const headers = await getForwardedHeaders(
      mockUserId && process.env.NODE_ENV === "test"
        ? { "X-Mock-User-Id": mockUserId }
        : undefined,
    );

    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/me/products/${productId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await handleApiError(response);
      return {
        success: false,
        ...parseProblemDetail(error),
      };
    }

    const result = await response.json();

    // ✅ 캐시 무효화
    revalidateTag(PRODUCT_CACHE_TAG, "max");

    return {
      success: true,
      data: result as Product,
    };
  } catch (error) {
    console.error("[updateProduct] Network Error:", error);
    return {
      success: false,
      detail: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
      errorCode: "NETWORK_ERROR",
      status: 503,
    };
  }
}

// ============================================================================
// 🔹 PATCH /api/v1/stores/me/products/:productId/inactive - 상품 비활성화
// ============================================================================
export async function deactivateProduct(
  productId: number,
  mockUserId?: string,
): Promise<ProductDeactivateResult> {
  try {
    if (!Number.isInteger(productId) || productId < 1) {
      return {
        success: false,
        detail: "유효한 상품 ID가 필요합니다.",
        errorCode: "INVALID_ID",
        status: 400,
      };
    }

    const headers = await getForwardedHeaders(
      mockUserId && process.env.NODE_ENV === "test"
        ? { "X-Mock-User-Id": mockUserId }
        : undefined,
    );

    const response = await fetch(
      `${API_BASE_URL}/api/v1/stores/me/products/${productId}/inactive`,
      {
        method: "PATCH",
        headers,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await handleApiError(response);
      return {
        success: false,
        ...parseProblemDetail(error),
      };
    }

    const result = await response.json();

    // ✅ 캐시 무효화
    revalidateTag(PRODUCT_CACHE_TAG, "max");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[deactivateProduct] Network Error:", error);
    return {
      success: false,
      detail: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
      errorCode: "NETWORK_ERROR",
      status: 503,
    };
  }
}
