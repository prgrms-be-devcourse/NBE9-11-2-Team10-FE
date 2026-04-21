// e2e/mock-server/routes/store-feeds.routes.ts
import { Router, Request, Response } from "express";
import { createErrorResponse } from "../lib/mock-common-data";
import { mockAuthMiddleware } from "../lib/mock-auth-middleware";
import {
  FeedStore,
  CommentStore,
} from "../lib/mock-feed-data";
import { MOCK_USERS } from "../lib/mock-user-data";
import { z } from "zod";

// 🔹 댓글 생성 요청 스키마
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "댓글 내용을 입력해주세요.")
    .max(500, "댓글은 500자 이내로 작성 가능합니다.")
    .refine((val) => val.trim().length > 0, {
      message: "공백만 입력할 수 없습니다.",
    }),
  // 🔥 대댓글 미지원으로 인해 스키마에서 제외
});

// 🔹 피드/댓글 좋아요 토글 파라미터 검증 (Path 변수용)
// body 가 없으므로 파라미터만 검증
export const likeToggleParamSchema = z.object({
  sellerId: z.string().min(1),
  feedId: z.string().min(1),
  commentId: z.string().refine((val) => !isNaN(Number(val)), {
    message: "commentId 는 숫자여야 합니다.",
  }),
});

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

  return res.status(200).json({
    feeds: responseFeeds
  });
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
      isLiked: currentUser
        ? CommentStore.isLikedByUser(comment.commentId, currentUser.id.toString(), feedId)
        : false,
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

// ============================================================================
// 🔹 POST /{sellerId}/feeds/{feedId}/comments - 댓글 생성
// ============================================================================
router.post(
  "/:sellerId/feeds/:feedId/comments",
  mockAuthMiddleware,
  (req: Request, res: Response) => {
    // ✅ 인증 사용자 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUser = (req as any).mockUser;
    if (!currentUser) {
      return res.status(401).json(
        createErrorResponse(401, "UNAUTHORIZED", "로그인 후 이용 가능합니다.", req.path)
      );
    }

    const rawSellerId = req.params.sellerId;
    const rawFeedId = req.params.feedId;
    const sellerId = Array.isArray(rawSellerId) ? rawSellerId[0] : rawSellerId;
    const feedId = Array.isArray(rawFeedId) ? rawFeedId[0] : rawFeedId;

    // ✅ 피드 존재 여부 확인
    const feed = FeedStore.findById(feedId);
    if (!feed || feed.sellerId !== sellerId) {
      return res.status(404).json(
        createErrorResponse(404, "FEED_NOT_FOUND", "존재하지 않는 피드입니다.", req.path)
      );
    }

    // ✅ 2. Zod 를 이용한 요청 바디 검증
    const parseResult = createCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(
        createErrorResponse(
          400,
          "INVALID_COMMENT_CONTENT",
          parseResult.error.issues[0]?.message || "댓글 형식이 올바르지 않습니다.",
          req.path
        )
      );
    }
    const { content } = parseResult.data;

    // ✅ 댓글 생성 (대댓글 미지원: parentCommentId 무시)
    try {
      const newComment = CommentStore.create({
        feedId,
        writerId: currentUser.id.toString(),
        writerNickname: currentUser.nickname,
        writerProfileImageUrl: currentUser.profileImageUrl,
        content: content.trim(),
      });

      // ✅ 응답 DTO 매핑 (명세서 준수)
      const response = {
        commentId: newComment.commentId,
        writer: {
          userId: newComment.writerId,
          nickname: newComment.writerNickname,
          profileImageUrl: newComment.writerProfileImageUrl,
        },
        content: newComment.content,
        likeCount: newComment.likeCount,
        isLiked: false, // 신규 댓글이므로 기본 false
        isMine: true,   // 작성자 본인
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
      };

      return res.status(201).json(response);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "INVALID_COMMENT_CONTENT") {
        return res.status(400).json(
          createErrorResponse(400, "INVALID_COMMENT_CONTENT", "댓글 내용이 올바르지 않습니다.", req.path)
        );
      }
      console.error("[POST comments] Error:", error);
      return res.status(500).json(
        createErrorResponse(500, "INTERNAL_ERROR", "서버 내부 오류가 발생했습니다.", req.path)
      );
    }
  }
);

// ============================================================================
// 🔹 DELETE /{sellerId}/feeds/{feedId}/comments/{commentId} - 댓글 삭제
// ============================================================================
router.delete(
  "/:sellerId/feeds/:feedId/comments/:commentId",
  mockAuthMiddleware,
  (req: Request, res: Response) => {
    const currentUser = (req as any).mockUser;
    if (!currentUser) {
      return res.status(401).json(
        createErrorResponse(401, "UNAUTHORIZED", "로그인 후 이용 가능합니다.", req.path)
      );
    }

    const { sellerId, feedId, commentId } = req.params;
    const sId = Array.isArray(sellerId) ? sellerId[0] : sellerId;
    const fId = Array.isArray(feedId) ? feedId[0] : feedId;
    const cId = Array.isArray(commentId) ? Number(commentId[0]) : Number(commentId);

    // ✅ 댓글 존재 여부 확인
    const comment = CommentStore.findById(cId);
    if (!comment || comment.feedId !== fId) {
      return res.status(404).json(
        createErrorResponse(404, "COMMENT_NOT_FOUND", "존재하지 않는 댓글입니다.", req.path)
      );
    }

    // ✅ 권한 검사: 작성자 본인 또는 피드 소유자(판매자)
    const isWriter = comment.writerId === currentUser.id.toString();
    const isFeedOwner = FeedStore.isOwner(fId, sId) && currentUser.id.toString() === sId;

    if (!isWriter && !isFeedOwner) {
      return res.status(403).json(
        createErrorResponse(
          403,
          "COMMENT_ACCESS_DENIED",
          "본인의 댓글만 삭제할 수 있습니다.",
          req.path
        )
      );
    }

    // ✅ 삭제 수행
    const deleted = CommentStore.delete(cId);
    if (!deleted) {
      return res.status(500).json(
        createErrorResponse(500, "INTERNAL_ERROR", "댓글 삭제 중 오류가 발생했습니다.", req.path)
      );
    }

    return res.status(204).send(); // No Content
  }
);

// ============================================================================
// 🔹 POST /{sellerId}/feeds/{feedId}/comments/{commentId}/like - 좋아요 토글
// ============================================================================
router.post(
  "/:sellerId/feeds/:feedId/comments/:commentId/like",
  mockAuthMiddleware,
  (req: Request, res: Response) => {
    const currentUser = (req as any).mockUser;
    if (!currentUser) {
      return res.status(401).json(
        createErrorResponse(401, "UNAUTHORIZED", "로그인 후 이용 가능합니다.", req.path)
      );
    }

    const { sellerId, feedId, commentId } = req.params;
    const sId = Array.isArray(sellerId) ? sellerId[0] : sellerId;
    const fId = Array.isArray(feedId) ? feedId[0] : feedId;
    const cId = Array.isArray(commentId) ? Number(commentId[0]) : Number(commentId);

    if (isNaN(cId)) {
      return res.status(400).json(createErrorResponse(400, "INVALID_PARAMETER", "잘못된 댓글 ID 형식입니다.", req.path));
    }

    // ✅ 1. 피드 존재 여부 확인
    const feed = FeedStore.findById(fId);
    if (!feed || feed.sellerId !== sId) {
      return res.status(404).json(createErrorResponse(404, "FEED_NOT_FOUND", "존재하지 않는 피드입니다.", req.path));
    }

    // ✅ 2. 댓글 존재 여부 확인
    const comment = CommentStore.findById(cId);
    if (!comment || comment.feedId !== fId) {
      return res.status(404).json(createErrorResponse(404, "COMMENT_NOT_FOUND", "존재하지 않는 댓글입니다.", req.path));
    }

    // ✅ 3. 좋아요 토글 수행 (수정된 시그니처 적용)
    // 인자: { commentId: number, userId: string, feedId: string }
    const result = CommentStore.toggleLike({
      commentId: cId,
      userId: currentUser.id.toString(), // 🔥 현재 사용자 전달
      feedId: fId,
    });

    if (!result) {
      return res.status(500).json(createErrorResponse(500, "INTERNAL_ERROR", "좋아요 처리 중 오류가 발생했습니다.", req.path));
    }

    // ✅ 4. 응답 (명세서 준수)
    // result 는 { comment: Comment, isLiked: boolean } 구조를 반환함
    return res.status(200).json({
      isLiked: result.isLiked,      // 🔥 변경된 좋아요 상태
      likeCount: result.comment.likeCount, // 🔥 업데이트된 카운트
    });
  }
);

export default router;
