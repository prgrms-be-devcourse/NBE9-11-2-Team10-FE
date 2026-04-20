"use server";
// src/lib/services/store.service.ts
import {
  CommentListQuery,
  commentListQuerySchema,
  CreateFeedInput,
  createFeedSchema,
  FeedLikeToggleInput,
  feedLikeToggleSchema,
  UpdateFeedInput,
  updateFeedSchema,
} from "@/schemas/feed.schema";
import {
  FeedListResponse,
  CommentListResponse,
  FeedLikeToggleResponse,
  CreateFeedRequest,
  CreateFeedResponse,
} from "@/types/feed.type";
import { ApiError, ValidationError } from "@/utils/error/stores.error";
import { getForwardedHeaders, handleApiError } from "@/utils/helper";

// ============================================================================
// 🔹 GET /api/v1/stores/{sellerId}/feeds - 피드 목록 조회
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

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
// 🔹 POST /api/v1/stores/me/feeds - 피드 생성
// ============================================================================

export async function createFeed(
  input: CreateFeedInput,
  mockUserId?: string,
): Promise<CreateFeedResponse> {
  // 1. 스키마 검증
  const validated = createFeedSchema.safeParse(input);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  // 2. 요청 데이터 구성
  const body: CreateFeedRequest = {
    content: validated.data.content,
    mediaUrls: validated.data.mediaUrls,
    isNotice: validated.data.isNotice,
  };

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  // 3. API 호출
  const response = await fetch(`${API_BASE_URL}/api/v1/stores/me/feeds`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<CreateFeedResponse>;
}

// ============================================================================
// 🔹 PATCH /api/v1/stores/{sellerId}/feeds/{feedId} - 피드 수정
// ============================================================================

export async function updateFeed(
  sellerId: string,
  feedId: string,
  input: UpdateFeedInput,
  mockUserId?: string,
): Promise<CreateFeedResponse> {
  if (!sellerId || !feedId) {
    throw new Error("유효한 판매자 ID 와 피드 ID 가 필요합니다.");
  }

  const validated = updateFeedSchema.safeParse(input);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const body: CreateFeedRequest = {
    content: validated.data.content,
    mediaUrls: validated.data.mediaUrls,
    isNotice: validated.data.isNotice,
  };

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<CreateFeedResponse>;
}

// ============================================================================
// 🔹 DELETE /api/v1/stores/me/feeds/{feedId} - 피드 삭제
// ============================================================================

export async function deleteFeed(
  feedId: string,
  mockUserId?: string,
): Promise<void> {
  if (!feedId) {
    throw new Error("피드 ID 가 필요합니다.");
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/me/feeds/${feedId}`,
    {
      method: "DELETE",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }
}

// ============================================================================
// 🔹 POST /api/v1/stores/{sellerId}/feeds/{feedId}/like - 좋아요 토글
// ============================================================================

export async function toggleFeedLike(
  input: FeedLikeToggleInput,
  mockUserId?: string,
): Promise<FeedLikeToggleResponse> {
  const validated = feedLikeToggleSchema.safeParse(input);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const { feedId, sellerId } = validated.data;

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/like`,
    {
      method: "POST",
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<FeedLikeToggleResponse>;
}
