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
  ProductListResponse,
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

type ProductListRawPayload = {
  content?: unknown[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

function normalizePageForApi(page: number): number {
  // FE/BE 모두 1-based 페이지를 사용한다.
  return Math.max(1, page);
}

function normalizePageForUi(page: number): number {
  // 응답이 0-based면 1-based로 변환
  return page <= 0 ? 1 : page;
}

function normalizeProductListResult(
  payload: unknown,
): ProductListResult {
  const raw = payload as
    | ProductListResult
    | ProductListRawPayload
    | { data?: ProductListRawPayload };

  // 1) 이미 기존 성공/실패 포맷이면 그대로 처리
  if (typeof raw === "object" && raw && "success" in raw) {
    return raw as ProductListResult;
  }

  // 2) success 래퍼가 없는 순수 페이지네이션 응답 처리
  const data = (
    typeof raw === "object" && raw && "data" in raw
      ? (raw as { data?: ProductListRawPayload }).data
      : raw
  ) as ProductListRawPayload;

  if (!data || !Array.isArray(data.content)) {
    return {
      success: false,
      detail: "상품 목록 응답 형식이 올바르지 않습니다.",
      errorCode: "INVALID_RESPONSE",
      status: 500,
    };
  }

  return {
    success: true,
    data: {
      content: data.content as ProductListResponse["data"]["content"],
      page: normalizePageForUi(Number(data.page ?? 1)),
      size: Number(data.size ?? 10),
      totalElements: Number(data.totalElements ?? data.content.length),
      totalPages: Number(data.totalPages ?? 1),
    },
  };
}

function resolveSellerId(payload: unknown): number | null {
  const raw = payload as {
    id?: number;
    sellerId?: number;
    data?: { id?: number; sellerId?: number };
  };
  const rootId = raw.id ?? raw.sellerId;
  if (Number.isInteger(rootId) && Number(rootId) > 0) return Number(rootId);

  const nestedId = raw.data?.id ?? raw.data?.sellerId;
  if (Number.isInteger(nestedId) && Number(nestedId) > 0) return Number(nestedId);

  return null;
}

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
    const apiPage = normalizePageForApi(page);

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
    return normalizeProductListResult(data);
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
// 🔹 GET /api/v1/stores/me/products - 내 상품 목록 조회 (판매자 전용)
// ============================================================================
export async function fetchMyProductList(
  query: Omit<ProductListQuery, "sellerId">,
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

    const { page, size, type, status } = validated.data;
    const headers = await getForwardedHeaders();

    // 1) 현재 로그인한 판매자 정보 조회
    const meResponse = await fetch(`${API_BASE_URL}/api/v1/sellers/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!meResponse.ok) {
      const error = await handleApiError(meResponse);
      return { success: false, ...parseProblemDetail(error) };
    }

    const meResult = await meResponse.json();
    const sellerId = resolveSellerId(meResult);

    if (sellerId === null) {
      return {
        success: false,
        detail: "판매자 정보를 확인할 수 없습니다.",
        errorCode: "INVALID_SELLER",
        status: 400,
      };
    }

    const params = new URLSearchParams({
      page: String(normalizePageForApi(page)),
      size: String(size),
      sellerId: String(sellerId),
    });
    if (type) params.append("type", type);
    if (status) params.append("status", status);

    const response = await fetch(
      `${API_BASE_URL}/api/v1/products?${params}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const error = await handleApiError(response);
      return { success: false, ...parseProblemDetail(error) };
    }

    const data = await response.json();
    return normalizeProductListResult(data);
  } catch (error) {
    console.error("[fetchMyProductList] Network Error:", error);
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

    const data = await response.json() as ProductDetailResult;

    return data;
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
