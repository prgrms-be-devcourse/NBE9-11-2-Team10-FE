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
// 🔹 POST /me/feeds - 피드 생성 (판매자 본인만)
// ============================================================================
router.post("/me/feeds", mockAuthMiddleware, (req: Request, res: Response) => {
  // ✅ 인증 사용자 확인
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = (req as any).mockUser;
  if (!currentUser) {
    return res
      .status(401)
      .json(
        createErrorResponse(
          401,
          "UNAUTHORIZED",
          "로그인 후 이용 가능합니다.",
          "/api/v1/stores/me/feeds",
        ),
      );
  }

  // ✅ 판매자 권한 확인
  if (currentUser.role !== "SELLER") {
    return res.status(403).json(
      createErrorResponse(
        403,
        "FORBIDDEN_SELLER_ONLY",
        "판매자 전용 기능입니다.",
        "/api/v1/stores/me/feeds",
        { storeApplyUrl: "/stores/apply" }, // ✅ extra 파라미터 활용
      ),
    );
  }

  // ✅ 요청 바디 파싱 및 검증
  const { content, mediaUrls = [], isNotice = false } = req.body;

  // 콘텐츠 검증 (1~2000자)
  if (
    !content ||
    typeof content !== "string" ||
    content.length < 1 ||
    content.length > 2000
  ) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          "CONTENT_LENGTH_INVALID",
          "피드 내용은 1자 이상 2000자 이하로 입력해야 합니다.",
          "/api/v1/stores/me/feeds",
        ),
      );
  }

  // 미디어 URL 검증 (최대 10개)
  if (!Array.isArray(mediaUrls) || mediaUrls.length > 10) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          "MAX_MEDIA_LIMIT_EXCEEDED",
          "이미지/영상은 최대 10개까지 업로드 가능합니다.",
          "/api/v1/stores/me/feeds",
        ),
      );
  }

  // URL 형식 검증
  const invalidUrl = mediaUrls.find((url: string) => {
    try {
      new URL(url);
      return false;
    } catch {
      return true;
    }
  });
  if (invalidUrl) {
    return res
      .status(400)
      .json(
        createErrorResponse(
          400,
          "INVALID_URL_FORMAT",
          "유효하지 않은 미디어 URL 형식입니다.",
          "/api/v1/stores/me/feeds",
        ),
      );
  }

  // ✅ 피드 생성
  try {
    const newFeed = FeedStore.create({
      sellerId: currentUser.id.toString(),
      content,
      mediaUrls,
      isNotice,
    } as any);

    const response = {
      feedId: newFeed.feedId,
      content: newFeed.content,
      mediaUrls: newFeed.mediaUrls,
      createdAt: newFeed.createdAt,
      isNotice: newFeed.isNotice,
    };

    return res.status(201).json(response);
  } catch (error: unknown) {
    // Store 레이어에서 던진 에러 처리
    if (error instanceof Error) {
      if (error.message === "MAX_MEDIA_LIMIT_EXCEEDED") {
        return res
          .status(400)
          .json(
            createErrorResponse(
              400,
              "MAX_MEDIA_LIMIT_EXCEEDED",
              "이미지/영상은 최대 10개까지 업로드 가능합니다.",
              "/api/v1/stores/me/feeds",
            ),
          );
      }
      if (error.message === "CONTENT_LENGTH_INVALID") {
        return res
          .status(400)
          .json(
            createErrorResponse(
              400,
              "CONTENT_LENGTH_INVALID",
              "피드 내용은 1자 이상 2000자 이하로 입력해야 합니다.",
              "/api/v1/stores/me/feeds",
            ),
          );
      }
    }
    console.error("[POST /me/feeds] Error:", error);
    return res
      .status(500)
      .json(
        createErrorResponse(
          500,
          "INTERNAL_ERROR",
          "서버 내부 오류가 발생했습니다.",
          "/api/v1/stores/me/feeds",
        ),
      );
  }
});

// ============================================================================
// 🔹 PATCH /{sellerId}/feeds/{feedId} - 피드 수정
// ============================================================================
router.patch(
  "/:sellerId/feeds/:feedId",
  mockAuthMiddleware,
  (req: Request, res: Response) => {
    const currentUser = (req as any).mockUser;
    if (!currentUser) {
      return res
        .status(401)
        .json(
          createErrorResponse(
            401,
            "UNAUTHORIZED",
            "로그인 후 이용 가능합니다.",
            `/api/v1/stores/${req.params.sellerId}/feeds/${req.params.feedId}`,
          ),
        );
    }

    if (currentUser.role !== "SELLER") {
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "FORBIDDEN_SELLER_ONLY",
            "판매자 전용 기능입니다.",
            `/api/v1/stores/${req.params.sellerId}/feeds/${req.params.feedId}`,
          ),
        );
    }

    const sellerId = Array.isArray(req.params.sellerId)
      ? req.params.sellerId[0]
      : req.params.sellerId;
    const feedId = Array.isArray(req.params.feedId)
      ? req.params.feedId[0]
      : req.params.feedId;

    // ✅ 타인 스토어 수정 시도 차단
    if (currentUser.id.toString() !== sellerId) {
      console.warn(
        `[SECURITY] User ${currentUser.id} attempted to modify store ${sellerId}`,
      );
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "RESOURCE_ACCESS_DENIED",
            "접근 권한이 없습니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}`,
          ),
        );
    }

    const feed = FeedStore.findById(feedId);
    if (!feed) {
      return res
        .status(404)
        .json(
          createErrorResponse(
            404,
            "FEED_NOT_FOUND",
            "존재하지 않는 피드입니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}`,
          ),
        );
    }

    if (!FeedStore.isOwner(feedId, sellerId)) {
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "FEED_ACCESS_DENIED",
            "본인의 피드만 수정할 수 있습니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}`,
          ),
        );
    }

    const { content, mediaUrls, isNotice } = req.body;

    // 검증 로직 (생성과 동일)
    if (content !== undefined) {
      if (
        typeof content !== "string" ||
        content.length < 1 ||
        content.length > 2000
      ) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              400,
              "CONTENT_LENGTH_INVALID",
              "피드 내용은 1자 이상 2000자 이하로 입력해야 합니다.",
              `/api/v1/stores/${sellerId}/feeds/${feedId}`,
            ),
          );
      }
    }

    if (mediaUrls !== undefined) {
      if (!Array.isArray(mediaUrls) || mediaUrls.length > 10) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              400,
              "MAX_MEDIA_LIMIT_EXCEEDED",
              "이미지/영상은 최대 10개까지 업로드 가능합니다.",
              `/api/v1/stores/${sellerId}/feeds/${feedId}`,
            ),
          );
      }
    }

    try {
      const updatedFeed = FeedStore.update(feedId, {
        ...(content !== undefined && { content }),
        ...(mediaUrls !== undefined && { mediaUrls }),
        ...(isNotice !== undefined && { isNotice }),
      });

      if (!updatedFeed) {
        return res
          .status(404)
          .json(
            createErrorResponse(
              404,
              "FEED_NOT_FOUND",
              "존재하지 않는 피드입니다.",
              `/api/v1/stores/${sellerId}/feeds/${feedId}`,
            ),
          );
      }

      return res.status(200).json({
        feedId: updatedFeed.feedId,
        content: updatedFeed.content,
        mediaUrls: updatedFeed.mediaUrls,
        createdAt: updatedFeed.createdAt,
        isNotice: updatedFeed.isNotice,
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "MAX_MEDIA_LIMIT_EXCEEDED"
      ) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              400,
              "MAX_MEDIA_LIMIT_EXCEEDED",
              "이미지/영상은 최대 10개까지 업로드 가능합니다.",
              `/api/v1/stores/${sellerId}/feeds/${feedId}`,
            ),
          );
      }
      console.error("[PATCH /feeds/:feedId] Error:", error);
      return res
        .status(500)
        .json(
          createErrorResponse(
            500,
            "INTERNAL_ERROR",
            "서버 내부 오류가 발생했습니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}`,
          ),
        );
    }
  },
);

// ============================================================================
// 🔹 DELETE /me/feeds/{feedId} - 피드 삭제
// ============================================================================
router.delete(
  "/me/feeds/:feedId",
  mockAuthMiddleware,
  (req: Request, res: Response) => {
    const currentUser = (req as any).mockUser;
    if (!currentUser) {
      return res
        .status(401)
        .json(
          createErrorResponse(
            401,
            "UNAUTHORIZED",
            "로그인 후 이용 가능합니다.",
            `/api/v1/stores/me/feeds/${req.params.feedId}`,
          ),
        );
    }

    if (currentUser.role !== "SELLER") {
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "FORBIDDEN_SELLER_ONLY",
            "판매자 전용 기능입니다.",
            `/api/v1/stores/me/feeds/${req.params.feedId}`,
          ),
        );
    }

    const feedId = Array.isArray(req.params.feedId)
      ? req.params.feedId[0]
      : req.params.feedId;
    const sellerId = currentUser.id.toString();

    const feed = FeedStore.findById(feedId);
    if (!feed) {
      return res
        .status(404)
        .json(
          createErrorResponse(
            404,
            "FEED_NOT_FOUND",
            "존재하지 않는 피드입니다.",
            `/api/v1/stores/me/feeds/${feedId}`,
          ),
        );
    }

    if (!FeedStore.isOwner(feedId, sellerId)) {
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "FEED_ACCESS_DENIED",
            "본인의 피드만 삭제할 수 있습니다.",
            `/api/v1/stores/me/feeds/${feedId}`,
          ),
        );
    }

    const deleted = FeedStore.delete(feedId);
    if (!deleted) {
      return res
        .status(500)
        .json(
          createErrorResponse(
            500,
            "INTERNAL_ERROR",
            "피드 삭제 중 오류가 발생했습니다.",
            `/api/v1/stores/me/feeds/${feedId}`,
          ),
        );
    }

    return res.status(204).send(); // No Content
  },
);

// ============================================================================
// 🔹 POST /{sellerId}/feeds/{feedId}/like - 좋아요 토글
// ============================================================================
router.post(
  "/:sellerId/feeds/:feedId/like",
  mockAuthMiddleware,
  (req: Request, res: Response) => {
    const currentUser = (req as any).mockUser;
    if (!currentUser) {
      return res
        .status(401)
        .json(
          createErrorResponse(
            401,
            "UNAUTHORIZED",
            "로그인 후 이용 가능합니다.",
            `/api/v1/stores/${req.params.sellerId}/feeds/${req.params.feedId}/like`,
          ),
        );
    }

    const sellerId = Array.isArray(req.params.sellerId)
      ? req.params.sellerId[0]
      : req.params.sellerId;
    const feedId = Array.isArray(req.params.feedId)
      ? req.params.feedId[0]
      : req.params.feedId;

    const feed = FeedStore.findById(feedId);
    if (!feed) {
      return res
        .status(404)
        .json(
          createErrorResponse(
            404,
            "FEED_NOT_FOUND",
            "존재하지 않는 피드입니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}/like`,
          ),
        );
    }

    if (feed.sellerId !== sellerId) {
      return res
        .status(403)
        .json(
          createErrorResponse(
            403,
            "FEED_ACCESS_DENIED",
            "접근할 수 없는 피드입니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}/like`,
          ),
        );
    }

    const result = FeedStore.toggleLike(feedId);
    if (!result) {
      return res
        .status(500)
        .json(
          createErrorResponse(
            500,
            "INTERNAL_ERROR",
            "좋아요 처리 중 오류가 발생했습니다.",
            `/api/v1/stores/${sellerId}/feeds/${feedId}/like`,
          ),
        );
    }

    return res.status(200).json({
      isLiked: result.isLiked,
      likeCount: result.feed.likeCount,
    });
  },
);

export default router;
