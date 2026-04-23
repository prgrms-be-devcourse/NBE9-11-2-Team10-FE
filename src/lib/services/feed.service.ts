"use server";
// src/lib/services/store.service.ts
import {
  CommentLikeToggleInput,
  commentLikeToggleSchema,
  CommentListQuery,
  commentListQuerySchema,
  CreateCommentInput,
  createCommentSchema,
  CreateFeedInput,
  createFeedSchema,
  deleteCommentSchema,
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
  CommentLikeToggleResponse,
  CreateCommentRequest,
  CommentResponse,
} from "@/types/feed.type";
import { ApiError, ValidationError } from "@/utils/error/stores.error";
import { getForwardedHeaders, handleApiError } from "@/utils/helper";

// ============================================================================
// 🔹 GET /api/v1/stores/{sellerId}/feeds - 피드 목록 조회
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeFeedListResponse(payload: unknown): FeedListResponse {
  const raw = asRecord(payload);
  const rawData = asRecord(raw?.data);
  const directFeeds = raw?.feeds;
  const nestedFeeds = rawData?.feeds;
  const sourceFeeds = Array.isArray(directFeeds)
    ? directFeeds
    : Array.isArray(nestedFeeds)
      ? nestedFeeds
      : [];

  const feeds = sourceFeeds.map((item: unknown) => {
    const feed = asRecord(item);
    const mediaUrls = Array.isArray(feed?.mediaUrls)
      ? (feed.mediaUrls as unknown[])
      : [];
    const firstMedia = mediaUrls[0];
    const normalizedImageUrl =
      typeof feed?.imageUrl === "string"
        ? feed.imageUrl
        : typeof firstMedia === "string"
          ? firstMedia
          : undefined;

    return {
      id: String(feed?.id ?? feed?.feedId ?? ""),
      content: typeof feed?.content === "string" ? feed.content : "",
      imageUrl: normalizedImageUrl,
      likeCount: Number(feed?.likeCount ?? 0),
      commentCount: Number(feed?.commentCount ?? 0),
      isLiked: Boolean(feed?.isLiked),
      createdAt:
        typeof feed?.createdAt === "string"
          ? feed.createdAt
          : new Date().toISOString(),
      isNotice: Boolean(feed?.isNotice),
    };
  });

  return {
    data: { feeds },
    pagination: raw?.pagination as FeedListResponse["pagination"] | undefined,
  };
}

function normalizeCommentListResponse(payload: unknown): CommentListResponse {
  const raw = asRecord(payload);
  const rawData = asRecord(raw?.data);
  const directComments = raw?.comments;
  const nestedComments = rawData?.comments;
  const comments = (
    Array.isArray(directComments)
      ? directComments
      : Array.isArray(nestedComments)
        ? nestedComments
        : []
  ) as CommentResponse[];

  return {
    data: { comments },
    pagination: (raw?.pagination as CommentListResponse["pagination"] | undefined) ?? {
      currentPage: 0,
      totalPages: comments.length > 0 ? 1 : 0,
      totalElements: comments.length,
    },
  };
}

function normalizeLikeToggleResponse<T extends { isLiked: boolean; likeCount: number }>(
  payload: unknown,
): T {
  const raw = payload as T | { data?: T };
  return (raw as { data?: T }).data ?? (raw as T);
}

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

  const data = await response.json();
  return normalizeFeedListResponse(data);
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

  const data = await response.json();
  return normalizeCommentListResponse(data);
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
    imageUrl: validated.data.imageUrl || "",
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

  const data = await response.json() as CreateFeedResponse;

  return data;
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
    imageUrl: validated.data.imageUrl,
    isNotice: validated.data.isNotice,
  };

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/me/feeds/${feedId}`,
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

  const data = await response.json() as CreateFeedResponse;

  return data;
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

  const candidates = [
    `${API_BASE_URL}/api/v1/stores/me/feeds/${feedId}/like`,
    `${API_BASE_URL}/api/v1/stores/me/feeds/${feedId}/likes`,
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/like`,
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/likes`,
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/like/toggle`,
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/likes/toggle`,
    `${API_BASE_URL}/api/v1/feeds/${feedId}/like`,
    `${API_BASE_URL}/api/v1/feeds/${feedId}/likes`,
    `${API_BASE_URL}/api/v1/feeds/${feedId}/like/toggle`,
    `${API_BASE_URL}/api/v1/feeds/${feedId}/likes/toggle`,
  ];
  const methods: Array<"POST" | "PATCH" | "PUT"> = ["POST", "PATCH", "PUT"];

  let lastErrorResponse: Response | null = null;

  for (const endpoint of candidates) {
    for (const method of methods) {
      const response = await fetch(endpoint, {
        method,
        headers,
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return normalizeLikeToggleResponse<FeedLikeToggleResponse>(data);
      }

      lastErrorResponse = response;
      if (response.status !== 404 && response.status !== 405) {
        const error = await handleApiError(response);
        throw ApiError.fromProblemDetail(error);
      }
    }
  }

  if (lastErrorResponse) {
    const error = await handleApiError(lastErrorResponse);
    throw ApiError.fromProblemDetail(error);
  }

  throw new Error("피드 좋아요 엔드포인트를 찾을 수 없습니다.");
}

// ============================================================================
// 🔹 POST /api/v1/stores/{sellerId}/feeds/{feedId}/comments - 댓글 생성
// ============================================================================

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export async function createComment(
  sellerId: string,
  feedId: string,
  input: CreateCommentInput,
  mockUserId?: string,
): Promise<CommentResponse> {
  // 1. 스키마 검증
  const validated = createCommentSchema.safeParse(input);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  // 2. 요청 데이터 구성
  const body: CreateCommentRequest = {
    content: validated.data.content
  };

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  // 3. API 호출
  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/comments`,
    {
      method: "POST",
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

  const data = await response.json() as
    | ApiResponse<CommentResponse>
    | CommentResponse;

  return "data" in data ? data.data : data;
}

// ============================================================================
// 🔹 DELETE /api/v1/stores/{sellerId}/feeds/{feedId}/comments/{commentId} - 댓글 삭제
// ============================================================================

export async function deleteComment(
  sellerId: string,
  feedId: string,
  commentId: string,
  mockUserId?: string,
): Promise<void> {
  // Path 변수 기본 검증
  if (!sellerId || !feedId || !commentId) {
    throw new Error("유효한 ID 들이 필요합니다.");
  }

  // 상세 스키마 검증 (필요시)
  const validated = deleteCommentSchema.safeParse({ sellerId, feedId, commentId });
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
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/comments/${commentId}`,
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
// 🔹 POST /api/v1/stores/{sellerId}/feeds/{feedId}/comments/{commentId}/like - 좋아요 토글
// ============================================================================

export async function toggleCommentLike(
  input: CommentLikeToggleInput,
  mockUserId?: string,
): Promise<CommentLikeToggleResponse> {
  // 1. 스키마 검증
  const validated = commentLikeToggleSchema.safeParse(input);
  if (!validated.success) {
    throw new ValidationError(
      validated.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const { sellerId, feedId, commentId } = validated.data;

  const headers = await getForwardedHeaders(
    mockUserId && process.env.NODE_ENV === "test"
      ? { "X-Mock-User-Id": mockUserId, "X-E2E-User-Id": mockUserId }
      : undefined,
  );

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stores/${sellerId}/feeds/${feedId}/comments/${commentId}/like`,
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

  const data = await response.json();
  return normalizeLikeToggleResponse<CommentLikeToggleResponse>(data);
}