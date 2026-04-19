// src/lib/services/store.service.ts
"use server";

import { revalidateTag } from "next/cache";
import {
  ProfileUpdateRequest,
  NicknameCheckQuery,
  CommentListQuery,
  profileUpdateSchema,
  nicknameCheckQuerySchema,
  commentListQuerySchema,
} from "@/schemas/store.schema";
import {
  StoreProfileResponse,
  FeedListResponse,
  CommentListResponse,
  FeaturedProductListResponse,
  NicknameCheckResponse,
} from "@/types/store";
import { getForwardedHeaders, handleApiError } from "@/utils/helper";
import { ApiError, ValidationError } from "@/utils/error/stores.error";
// ============================================================================
// ⚙️ 설정
// ============================================================================
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const STORE_CACHE_TAG = "store-profile";

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
// 🔹 GET /api/v1/stores/{sellerId}/feeds - 피드 목록 조회
// ============================================================================
export async function fetchFeedList(
  sellerId: string,
  mockUserId?: string,
): Promise<FeedListResponse> {
  if (!sellerId || typeof sellerId !== "string") {
    throw new Error("유효한 판매자 ID 가 필요합니다.");
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<FeedListResponse>;
}

// ============================================================================
// 🔹 GET /api/v1/stores/{sellerId}/feeds/{feedId}/comments - 댓글 목록 조회
// ============================================================================
export async function fetchCommentList(
  sellerId: string,
  feedId: string,
  query?: CommentListQuery,
  mockUserId?: string,
): Promise<CommentListResponse> {
  if (!sellerId || !feedId) {
    throw new Error("유효한 판매자 ID 와 피드 ID 가 필요합니다.");
  }

  const validatedQuery = commentListQuerySchema.safeParse(query);

  if (!validatedQuery.success) {
    throw new ValidationError(
      validatedQuery.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const { page, size, sort } = validatedQuery.data;

  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/comments?${params}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<CommentListResponse>;
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

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/featured-products`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<FeaturedProductListResponse>;
}
