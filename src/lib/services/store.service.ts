"use server";
// src/lib/services/store.service.ts

import { revalidateTag } from "next/cache";
import {
  ProfileUpdateRequest,
  NicknameCheckQuery,
  profileUpdateSchema,
  nicknameCheckQuerySchema,
} from "@/schemas/store.schema";
import {
  StoreProfileResponse,
  FeaturedProductListResponse,
  NicknameCheckResponse,
  FeaturedProduct,
  QueriedStoreProfile,
} from "@/types/store";
import { getForwardedHeaders, handleApiError } from "@/utils/helper";
import { ApiError, ValidationError } from "@/utils/error/stores.error";
import { fetchProductList } from "./product.service";
import { ProblemDetailError } from "@/types/common";
// ============================================================================
// ⚙️ 설정
// ============================================================================
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const STORE_CACHE_TAG = "store-profile";

// ============================================================================
// 🔹 GET /api/v1/sellers/{sellerId} - 프로필 조회 (all)
// ============================================================================
export async function queryStoreProfile(
  sellerId: string,
  mockUserId?: string,
): Promise<QueriedStoreProfile> {
  if (!sellerId || typeof sellerId !== "string") {
    throw new Error("유효한 판매자 ID 가 필요합니다.");
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/sellers/${sellerId}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error); // ✅ 에러는 throw 로 처리
  }

  return response.json() as Promise<QueriedStoreProfile>;
}

// ============================================================================
// 🔹 GET /api/v1/stores/{sellerId}/profile - 프로필 조회
// ============================================================================
export async function fetchStoreProfile(
  sellerId: string,
  mockUserId?: string,
): Promise<StoreProfileResponse> {
  if (!sellerId || typeof sellerId !== "string") {
    throw new Error("유효한 판매자 ID 가 필요합니다.");
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/profile`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error); // ✅ 에러는 throw 로 처리
  }

  return response.json() as Promise<StoreProfileResponse>;
}

// ============================================================================
// 🔹 PUT /api/v1/stores/me/profile - 프로필 수정 (판매자 전용)
// ============================================================================
export async function updateStoreProfile(
  data: ProfileUpdateRequest,
  mockUserId?: string,
): Promise<StoreProfileResponse> {
  // ✅ 요청값 검증
  const validated = profileUpdateSchema.safeParse(data);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? {
          "X-Mock-User-Id": mockUserId,
          "X-E2E-User-Id": mockUserId,
          "Content-Type": "application/json",
        }
      : undefined,
  );

  // ✅ null/빈값 정제
  const cleanData = { ...validated.data };
  if (cleanData.profileImageUrl === "") cleanData.profileImageUrl = null;
  if (cleanData.bio === "") cleanData.bio = undefined;

  const response = await fetch(`${API_BASE_URL}/api/v1/stores/me/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify(cleanData),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  // ✅ 캐시 무효화
  revalidateTag(STORE_CACHE_TAG, "max");

  return response.json() as Promise<StoreProfileResponse>;
}

// ============================================================================
// 🔹 GET /api/v1/stores/check-nickname - 닉네임 중복 체크
// ============================================================================
export async function checkNicknameAvailability(
  query: NicknameCheckQuery,
): Promise<NicknameCheckResponse> {
  const validated = nicknameCheckQuerySchema.safeParse(query);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const params = new URLSearchParams({
    nickname: validated.data.nickname,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/check-nickname?${params}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<NicknameCheckResponse>;
}

// ============================================================================
// 🔹 GET /api/v1/stores/{sellerId}/featured-products - 강조 상품 조회
// ============================================================================
export async function fetchFeaturedProducts(
  sellerId: string,
  mockUserId?: string,
): Promise<FeaturedProductListResponse> {
  if (!sellerId || typeof sellerId !== "string") {
    throw new Error("유효한 판매자 ID 가 필요합니다.");
  }

  const result = await fetchProductList({
    page: 1,
    size: 3,
    sellerId: Number(sellerId), 
  });

  if (!result.success) {
    // ✅ ProblemDetailError 구조에 맞춰 필수 필드 포함
    const problemDetail: ProblemDetailError = {
      type: "https://api.example.com/errors/FEATURED_PRODUCTS_FETCH_FAILED",
      title: "강조 상품 조회 실패",
      status: result.status,
      detail: result.detail,
      errorCode: result.errorCode,
      validationErrors: result.validationErrors,
    };
    
    // ✅ ApiError 생성 (fromProblemDetail 메서드 또는 생성자 사용)
    throw new ApiError(problemDetail);
  }

  const products: FeaturedProduct[] = result.data.content.map((item: any, index) => ({
    productId: String(item.productId),        // number → string (필요시)
    productName: item.productName,
    thumbnailUrl: item.imageUrl || item.thumbnailUrl || "", // 필드명 확인 필요
    price: item.price,
    discountRate: item.discountRate,
    isSoldOut: item.status === "SOLD_OUT",    // status 기반 변환
    displayOrder: index,                      // 목록 순서를 displayOrder 로 활용
  }));

  return { products };
}
