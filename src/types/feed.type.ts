// ============================================================================
// 📦 피드 관련 타입
// ============================================================================

export interface Feed {
  feedId: string;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface FeedListResponse {
  feeds: Feed[];
}
// ============================================================================
// 📦 댓글 관련 타입
// ============================================================================

export interface CommentWriter {
  userId: string;
  nickname: string;
  profileImageUrl?: string;
}

export interface Comment {
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
  comments: Comment[];
  pagination: PaginationInfo;
}
