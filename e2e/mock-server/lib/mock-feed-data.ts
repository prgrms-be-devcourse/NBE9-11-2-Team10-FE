// e2e/mock-server/lib/mock-feed-data.ts
import { MOCK_USERS, MockUser } from "./mock-user-data";

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

export interface FeaturedProduct {
  productId: string; // UUID
  productName: string; // 최대 100 자
  thumbnailUrl: string; // URL
  price: number;
  discountRate?: number; // 0~100
  isSoldOut: boolean;
  displayOrder: number; // 1~10
  sellerId: string;
}

// ============================================================================
// 🗄️ In-Memory Stores
// ============================================================================
const feeds: Map<string, Feed> = new Map();
const comments: Map<number, Comment> = new Map();
const featuredProducts: Map<string, FeaturedProduct> = new Map();

let nextCommentId = 1;

// ============================================================================
// 🔄 초기 데이터 생성
// ============================================================================
export const initFeedData = () => {
  feeds.clear();
  comments.clear();
  featuredProducts.clear();
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
      writerProfileImageUrl: "https://example.com/avatars/default.png",
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

  // 🔥 초기 강조 상품 데이터 (최대 10 개)
  const featured1: FeaturedProduct = {
    productId: "prod-001",
    productName: "스프링 입문",
    thumbnailUrl: "https://example.com/images/spring-intro.jpg",
    price: 18000,
    discountRate: 10,
    isSoldOut: false,
    displayOrder: 1,
    sellerId,
  };

  const featured2: FeaturedProduct = {
    productId: "prod-002",
    productName: "타입스크립트 마스터",
    thumbnailUrl: "https://example.com/images/ts-master.jpg",
    price: 25000,
    discountRate: 0,
    isSoldOut: false,
    displayOrder: 2,
    sellerId,
  };

  const featured3: FeaturedProduct = {
    productId: "prod-003",
    productName: "디자인 패턴의 이해",
    thumbnailUrl: "https://example.com/images/design-patterns.jpg",
    price: 32000,
    discountRate: 20,
    isSoldOut: true,
    displayOrder: 3,
    sellerId,
  };

  featuredProducts.set(featured1.productId, featured1);
  featuredProducts.set(featured2.productId, featured2);
  featuredProducts.set(featured3.productId, featured3);
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

  // ❤️ 좋아요 토글 (테스트용)
  toggleLike: (feedId: string, isLiked: boolean): Feed | null => {
    const feed = feeds.get(feedId);
    if (!feed) return null;

    const updated = {
      ...feed,
      likeCount: isLiked ? feed.likeCount + 1 : Math.max(0, feed.likeCount - 1),
    };
    feeds.set(feedId, updated);
    return updated;
  },

  // 🔄 데이터 초기화
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
    let result = Array.from(comments.values()).filter(
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
    return comments.delete(commentId);
  },

  // ❤️ 댓글 좋아요 토글
  toggleLike: (commentId: number, isLiked: boolean): Comment | null => {
    const comment = comments.get(commentId);
    if (!comment) return null;

    const updated = {
      ...comment,
      likeCount: isLiked
        ? comment.likeCount + 1
        : Math.max(0, comment.likeCount - 1),
    };
    comments.set(commentId, updated);
    return updated;
  },

  // 🔄 데이터 초기화
  reset: () => {
    initFeedData();
  },
};

// ============================================================================
// 🛠️ FeaturedProduct Store 헬퍼
// ============================================================================
export const FeaturedProductStore = {
  // 🔍 판매자별 강조 상품 조회 (displayOrder 오름차순)
  findBySellerId: (sellerId: string): FeaturedProduct[] => {
    return Array.from(featuredProducts.values())
      .filter((p) => p.sellerId === sellerId)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, 10); // 최대 10 개
  },

  // 🔍 단일 상품 조회
  findById: (productId: string): FeaturedProduct | undefined => {
    return featuredProducts.get(productId);
  },

  // ➕ 강조 상품 등록/수정 (upsert)
  upsert: (data: FeaturedProduct): FeaturedProduct => {
    featuredProducts.set(data.productId, data);
    return data;
  },

  // ❌ 강조 상품 해제
  remove: (productId: string): boolean => {
    return featuredProducts.delete(productId);
  },

  // 🔄 데이터 초기화
  reset: () => {
    initFeedData();
  },
};

// 서버 부팅 시 초기 데이터 로드
initFeedData();
