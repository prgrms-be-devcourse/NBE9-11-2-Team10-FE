// ============================================================================
// 📦 피드 관련 타입 (기존 유지 + 신규 추가)
// ============================================================================

export interface Feed {
  feedId: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  isNotice?: boolean;
}

export interface FeedListResponse {
  feeds: Feed[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
  };
}

// 🔹 피드 생성/수정 요청 DTO
export interface CreateFeedRequest {
  content: string;
  mediaUrls?: string[];
  isNotice?: boolean;
}

export type UpdateFeedRequest = CreateFeedRequest;

// 🔹 피드 생성 응답 DTO
export interface CreateFeedResponse {
  feedId: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  isNotice?: boolean;
}

// 🔹 피드 좋아요 토글 응답 DTO
export interface FeedLikeToggleResponse {
  isLiked: boolean;
  likeCount: number;
}

// ============================================================================
// 📦 댓글 관련 타입 (기존 유지)
// ============================================================================

export interface CommentWriter {
  userId: string;
  nickname: string;
  profileImageUrl?: string;
}

export interface CommentResponse {
  commentId: number;
  writer: CommentWriter;
  content: string;
  likeCount: number;
  isLiked: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface CommentListResponse {
  comments: CommentResponse[];
  pagination: PaginationInfo;
}

// ============================================================================
// 📦 댓글 관련 타입 (신규 추가)
// ============================================================================

// 🔹 댓글 작성 요청 DTO
export interface CreateCommentRequest {
  content: string;
}

// 🔹 댓글 좋아요 토글 응답 DTO
export interface CommentLikeToggleResponse {
  isLiked: boolean;
  likeCount: number;
}