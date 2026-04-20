"use server";
// src/lib/services/store.service.ts
import { CommentListQuery, commentListQuerySchema } from "@/schemas/feed.schema";
import { FeedListResponse, CommentListResponse } from "@/types/feed.type";
import { ApiError, ValidationError } from "@/utils/error/stores.error";
import { getForwardedHeaders, handleApiError } from "@/utils/helper";

// ============================================================================
// 🔹 GET /api/v1/stores/{sellerId}/feeds - 피드 목록 조회
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

export async function fetchFeedList(
  sellerId: string,
  mockUserId?: string
): Promise<FeedListResponse> {
  if (!sellerId || typeof sellerId !== "string") {
    throw new Error("유효한 판매자 ID 가 필요합니다.");
  }

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
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
  mockUserId?: string
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
      }))
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
      : undefined
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/comments?${params}`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error = await handleApiError(response);
    throw ApiError.fromProblemDetail(error);
  }

  return response.json() as Promise<CommentListResponse>;
}
