// e2e/mock-server/lib/mock-feed-data.ts
import { MOCK_USERS } from "./mock-user-data";

// ============================================================================
// 📦 타입 정의
// ============================================================================
export interface Feed {
  feedId: string; // UUID
  sellerId: string; // 판매자 ID
  content: string; // 최대 2,000 자
  mediaUrls: string[]; // 최대 10 개, URL 배열
  likeCount: number;
  commentCount: number;
  createdAt: string; // ISO 8601
  isNotice?: boolean;
}

export interface Comment {
  commentId: number; // 자동 증가 ID
  feedId: string; // 피드 ID
  writerId: string; // 작성자 (구매자) ID
  writerNickname: string;
  writerProfileImageUrl?: string;
  content: string; // 1~500 자
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 🗄️ In-Memory Stores
// ============================================================================
const feeds: Map<string, Feed> = new Map();
const comments: Map<number, Comment> = new Map();
const commentLikes: Map<string, Set<string>> = new Map();

let nextCommentId = 1;

// ============================================================================
// 🔄 초기 데이터 생성
// ============================================================================
export const initFeedData = () => {
  feeds.clear();
  comments.clear();
  nextCommentId = 1;

  const sellerId = MOCK_USERS.SELLER?.id.toString() || "1002";
  const buyerId = MOCK_USERS.BUYER?.id.toString() || "1001";
  const now = new Date().toISOString();

  // 👥 초기 피드 데이터 (3 개)
  const feed1: Feed = {
    feedId: "feed-001",
    sellerId,
    content:
      "📚 이번 주 신규 입고 도서 소개합니다! 인기 베스트셀러부터 숨은 명작까지 다양하게 준비했어요.",
    mediaUrls: [
      "https://example.com/images/feed1-1.jpg",
      "https://example.com/images/feed1-2.jpg",
    ],
    likeCount: 24,
    commentCount: 5,
    createdAt: now,
  };

  const feed2: Feed = {
    feedId: "feed-002",
    sellerId,
    content: "✨ 독자 리뷰 이벤트 당첨자 발표! 축하드립니다 🎉",
    mediaUrls: [],
    likeCount: 89,
    commentCount: 12,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 어제
  };

  const feed3: Feed = {
    feedId: "feed-003",
    sellerId,
    content: "📖 독서의 계절, 가을을 맞이한 북스 스토어의 추천 리스트",
    mediaUrls: ["https://example.com/images/feed3-1.jpg"],
    likeCount: 156,
    commentCount: 28,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 일 전
  };

  feeds.set(feed1.feedId, feed1);
  feeds.set(feed2.feedId, feed2);
  feeds.set(feed3.feedId, feed3);

  // 💬 초기 댓글 데이터
  const addComment = (
    feedId: string,
    writerId: string,
    nickname: string,
    content: string,
  ) => {
    const comment: Comment = {
      commentId: nextCommentId++,
      feedId,
      writerId,
      writerNickname: nickname,
      writerProfileImageUrl: "https://example.com/images/avatars/default.png",
      content,
      likeCount: Math.floor(Math.random() * 10),
      createdAt: now,
      updatedAt: now,
    };
    comments.set(comment.commentId, comment);
    return comment;
  };

  addComment("feed-001", buyerId, "독서애호가", "기대됩니다! 언제 배송되나요?");
  addComment("feed-001", buyerId, "책벌레123", "이번 주 특가 정말 좋네요 👍");
  addComment(
    "feed-002",
    buyerId,
    "행운의주인공",
    "와 당첨됐어요! 감사합니다 🙏",
  );
};

// ============================================================================
// 🛠️ Feed Store 헬퍼
// ============================================================================
export const FeedStore = {
  // 🔍 판매자별 피드 목록 조회 (최신순)
  findBySellerId: (sellerId: string): Feed[] => {
    return Array.from(feeds.values())
      .filter((f) => f.sellerId === sellerId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  // 🔍 피드 단일 조회
  findById: (feedId: string): Feed | undefined => {
    return feeds.get(feedId);
  },

  // ➕ 피드 생성 (테스트용)
  create: (
    data: Omit<Feed, "feedId" | "createdAt" | "likeCount" | "commentCount">,
  ): Feed => {
    if (data.mediaUrls && data.mediaUrls.length > 10) {
      throw new Error("MAX_MEDIA_LIMIT_EXCEEDED");
    }
    if (
      !data.content ||
      data.content.length < 1 ||
      data.content.length > 2000
    ) {
      throw new Error("CONTENT_LENGTH_INVALID");
    }

    const newFeed: Feed = {
      ...data,
      feedId: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    feeds.set(newFeed.feedId, newFeed);
    return newFeed;
  },

  // ✏️ 피드 수정
  update: (
    feedId: string,
    data: Partial<
      Omit<
        Feed,
        "feedId" | "sellerId" | "createdAt" | "likeCount" | "commentCount"
      >
    >,
  ): Feed | null => {
    const feed = feeds.get(feedId);
    if (!feed) return null;

    if (data.mediaUrls && data.mediaUrls.length > 10) {
      throw new Error("MAX_MEDIA_LIMIT_EXCEEDED");
    }
    if (data.content !== undefined) {
      if (data.content.length < 1 || data.content.length > 2000) {
        throw new Error("CONTENT_LENGTH_INVALID");
      }
    }

    const updated: Feed = {
      ...feed,
      ...data,
      mediaUrls: data.mediaUrls !== undefined ? data.mediaUrls : feed.mediaUrls,
      isNotice: data.isNotice !== undefined ? data.isNotice : feed.isNotice,
    };
    feeds.set(feedId, updated);
    return updated;
  },

  // ❤️ 좋아요 토글 (반환값 개선)
  toggleLike: (feedId: string): { feed: Feed; isLiked: boolean } | null => {
    const feed = feeds.get(feedId);
    if (!feed) return null;

    // Mock: 랜덤으로 이전 상태 시뮬레이션 후 토글
    const wasLiked = Math.random() > 0.5;
    const newLikeCount = wasLiked
      ? Math.max(0, feed.likeCount - 1)
      : feed.likeCount + 1;

    const updated = { ...feed, likeCount: newLikeCount };
    feeds.set(feedId, updated);

    return { feed: updated, isLiked: !wasLiked };
  },

  // ❌ 피드 삭제 (신규)
  delete: (feedId: string): boolean => {
    return feeds.delete(feedId);
  },

  // 🔐 소유자 검증 헬퍼
  isOwner: (feedId: string, sellerId: string): boolean => {
    const feed = feeds.get(feedId);
    return feed?.sellerId === sellerId;
  },

  // 🔄 데이터 초기화 - [기존 유지]
  reset: () => {
    initFeedData();
  },
};

// ============================================================================
// 🛠️ Comment Store 헬퍼
// ============================================================================
export const CommentStore = {
  // 🔍 피드별 댓글 목록 조회 (페이징 지원)
  findByFeedId: (
    feedId: string,
    page: number,
    size: number,
    sort: "asc" | "desc" = "desc",
  ): { comments: Comment[]; total: number } => {
    const result = Array.from(comments.values()).filter(
      (c) => c.feedId === feedId,
    );

    // 정렬
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sort === "desc" ? timeB - timeA : timeA - timeB;
    });

    const total = result.length;
    const start = page * size;
    const paginated = result.slice(start, start + size);

    return { comments: paginated, total };
  },

  // 🔍 댓글 단일 조회 (신규)
  findById: (commentId: number): Comment | undefined => {
    return comments.get(commentId);
  },

  // ➕ 댓글 생성
  create: (
    data: Omit<Comment, "commentId" | "createdAt" | "updatedAt" | "likeCount">,
  ): Comment => {
    const now = new Date().toISOString();
    const newComment: Comment = {
      ...data,
      commentId: nextCommentId++,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // 피드의 댓글 카운트 증가
    const feed = feeds.get(data.feedId);
    if (feed) {
      feeds.set(data.feedId, { ...feed, commentCount: feed.commentCount + 1 });
    }

    comments.set(newComment.commentId, newComment);
    return newComment;
  },

  // ✏️ 댓글 수정
  update: (commentId: number, content: string): Comment | null => {
    const comment = comments.get(commentId);
    if (!comment) return null;

    const updated = {
      ...comment,
      content,
      updatedAt: new Date().toISOString(),
    };
    comments.set(commentId, updated);
    return updated;
  },

  // ❌ 댓글 삭제
  delete: (commentId: number): boolean => {
    const comment = comments.get(commentId);
    if (comment) {
      // 피드의 댓글 카운트 감소
      const feed = feeds.get(comment.feedId);
      if (feed) {
        feeds.set(comment.feedId, { 
          ...feed, 
          commentCount: Math.max(0, feed.commentCount - 1) 
        });
      }
      return comments.delete(commentId);
    }
    return false;
  },

  // ❤️ 댓글 좋아요 토글
  toggleLike: ({ commentId, userId, feedId }: { commentId: number; userId: string; feedId: string }): { comment: Comment; isLiked: boolean } | null => {
    const comment = comments.get(commentId);
    if (!comment) return null;

    const likeKey = `${feedId}_${commentId}`;
    let userLikes = commentLikes.get(likeKey);

    if (!userLikes) {
      userLikes = new Set<string>();
      commentLikes.set(likeKey, userLikes);
    }

    const isCurrentlyLiked = userLikes.has(userId);
    
    // 토글 로직
    if (isCurrentlyLiked) {
      userLikes.delete(userId); // 좋아요 취소
      comment.likeCount = Math.max(0, comment.likeCount - 1);
    } else {
      userLikes.add(userId); // 좋아요 추가
      comment.likeCount += 1;
    }

    comments.set(commentId, comment); // 변경사항 저장

    return { 
      comment, 
      isLiked: !isCurrentlyLiked // 변경된 상태 반환
    };
  },

  // 🔍 특정 사용자의 좋아요 상태 조회 (댓글 목록 조회 시 사용)
  isLikedByUser: (commentId: number, userId: string, feedId: string): boolean => {
    const likeKey = `${feedId}_${commentId}`;
    const userLikes = commentLikes.get(likeKey);
    return userLikes ? userLikes.has(userId) : false;
  },

  isWriter: (commentId: number, userId: string): boolean => {
    const comment = comments.get(commentId);
    return comment?.writerId === userId;
  },

  // 🔄 데이터 초기화
  reset: () => {
    initFeedData();
  },
};

// 서버 부팅 시 초기 데이터 로드
initFeedData();
