// e2e/mock-server/routes/store-feeds.routes.ts
import { Router, Request, Response } from "express";
import { createErrorResponse } from "../lib/mock-common-data";
import { mockAuthMiddleware } from "../lib/mock-auth-middleware";
import {
  FeedStore,
  CommentStore,
  FeaturedProductStore,
} from "../lib/mock-feed-data";
import { MOCK_USERS } from "../lib/mock-user-data";

export const router = Router();

// ============================================================================
// 🔹 GET /{sellerId}/feeds - 피드 목록 조회 (공용)
// ============================================================================
router.get("/:sellerId/feeds", (req: Request, res: Response) => {
  const rawSellerId = req.params.sellerId;

  // ✅ 타입 가드: 배열이면 첫 번째 요소 사용, 아니면 그대로 사용
  const sellerId = Array.isArray(rawSellerId) ? rawSellerId[0] : rawSellerId;

  // ✅ 판매자 존재 여부 간단 체크 (실제 구현 시 DB 조회)
  const seller = Object.values(MOCK_USERS).find(
    (u) => u.id.toString() === sellerId && u.role === "SELLER",
  );

  if (!seller) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "STORE_001",
          "존재하지 않는 스토어입니다.",
          `/api/v1/stores/${sellerId}/feeds`,
        ),
      );
  }

  // ✅ 피드 목록 조회 (최신순)
  const feedList = FeedStore.findBySellerId(sellerId);

  // ✅ isLiked 로직 (Mock: 헤더로 시뮬레이션)
  const isLikedByRequester = req.headers["x-mock-liked"] === "true";

  // ✅ 응답 DTO 매핑
  const responseFeeds = feedList.map((feed) => ({
    feedId: feed.feedId,
    content: feed.content,
    mediaUrls: feed.mediaUrls,
    likeCount: feed.likeCount,
    commentCount: feed.commentCount,
    isLiked: isLikedByRequester,
    createdAt: feed.createdAt,
  }));

  return res.status(200).json({ feeds: responseFeeds });
});

// ============================================================================
// 🔹 GET /{sellerId}/feeds/{feedId}/comments - 댓글 목록 조회 (페이징)
// ============================================================================
router.get(
  "/:sellerId/feeds/:feedId/comments",
  (req: Request, res: Response) => {
    const rawSellerId = req.params.sellerId;
    const rawFeedId = req.params.feedId;

    // ✅ 타입 가드: 배열이면 첫 번째 요소 사용, 아니면 그대로 사용
    const sellerId = Array.isArray(rawSellerId) ? rawSellerId[0] : rawSellerId;
    const feedId = Array.isArray(rawFeedId) ? rawFeedId[0] : rawFeedId;

    const { page = "0", size = "20", sort = "createdAt,desc" } = req.query;

    // ✅ 파라미터 파싱 및 검증
    const pageNum = Math.max(0, parseInt(page as string, 10) || 0);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(size as string, 10) || 20),
    );
    const sortDir = (sort as string).includes("asc") ? "asc" : "desc";

    // ✅ 피드 존재 여부 확인
    const feed = FeedStore.findById(feedId);
    if (!feed || feed.sellerId !== sellerId) {
      return res
        .status(404)
        .json(
          createErrorResponse(
            404,
            "FEED_001",
            "존재하지 않는 피드입니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}/comments`,
          ),
        );
    }

    // ✅ 댓글 목록 조회 (페이징 적용)
    const { comments: commentList, total } = CommentStore.findByFeedId(
      feedId,
      pageNum,
      pageSize,
      sortDir,
    );

    // ✅ 현재 로그인 사용자 정보 (선택적)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = (req as any).mockUser;
    const currentUserId = currentUser?.id?.toString();

    // ✅ 응답 DTO 매핑
    const responseComments = commentList.map((comment) => ({
      commentId: comment.commentId,
      writer: {
        userId: comment.writerId,
        nickname: comment.writerNickname,
        profileImageUrl: comment.writerProfileImageUrl,
      },
      content: comment.content,
      likeCount: comment.likeCount,
      isLiked: req.headers["x-mock-comment-liked"] === "true",
      isMine: currentUserId === comment.writerId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return res.status(200).json({
      comments: responseComments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalElements: total,
      },
    });
  },
);

// ============================================================================
// 🔹 GET /{sellerId}/featured-products - 강조 상품 목록 조회 (공용)
// ============================================================================
router.get("/:sellerId/featured-products", (req: Request, res: Response) => {
  const rawSellerId = req.params.sellerId;

  // ✅ 타입 가드: 배열이면 첫 번째 요소 사용, 아니면 그대로 사용
  const sellerId = Array.isArray(rawSellerId) ? rawSellerId[0] : rawSellerId;

  // ✅ 판매자 존재 여부 체크
  const seller = Object.values(MOCK_USERS).find(
    (u) => u.id.toString() === sellerId && u.role === "SELLER",
  );

  if (!seller) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "STORE_001",
          "존재하지 않는 스토어입니다.",
          `/api/v1/stores/${sellerId}/featured-products`,
        ),
      );
  }

  // ✅ 강조 상품 목록 조회 (displayOrder 기준 정렬, 최대 10 개)
  const productList = FeaturedProductStore.findBySellerId(sellerId);

  // ✅ 응답 DTO 매핑
  const responseProducts = productList.map((product) => ({
    productId: product.productId,
    productName: product.productName,
    thumbnailUrl: product.thumbnailUrl,
    price: product.price,
    discountRate: product.discountRate,
    isSoldOut: product.isSoldOut,
    displayOrder: product.displayOrder,
  }));

  return res.status(200).json({ products: responseProducts });
});

// ============================================================================
// 🔹 [E2E 전용] POST /__reset - 데이터 초기화
// ============================================================================
router.post("/__reset", (req: Request, res: Response) => {
  FeedStore.reset();
  CommentStore.reset();
  FeaturedProductStore.reset();

  return res.status(200).json({
    success: true,
    message: "Feed/Comment/FeaturedProduct data has been reset.",
    resetAt: new Date().toISOString(),
  });
});

export default router;
