// e2e/mock-server/routes/store-profiles.routes.ts
import { Router, Request, Response } from "express";
import {
  createErrorResponse,
  ProblemDetailResponse,
} from "../lib/mock-common-data";
import {
  mockAuthMiddleware,
  mockSellerMiddleware,
  verifyOwnership,
} from "../lib/mock-auth-middleware";
import {
  StoreProfileStore,
  BusinessInfo,
  QueriedStoreProfile,
} from "../lib/mock-store-profile-data";
import { MOCK_USERS } from "../lib/mock-user-data";
import { FeaturedProductStore } from "../lib/mock-featured-product";

export const router = Router();

// ============================================================================
// 🔍 헬퍼: URL 형식 검증
// ============================================================================
const isValidUrl = (url: string): boolean => {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// ✅ 검증: 프로필 업데이트 요청
// ============================================================================
const validateProfileUpdate = (
  body: any,
  path: string,
): ProblemDetailResponse | null => {
  const errors: Array<{ field: string; message: string }> = [];

  // nickname 검증 (선택)
  if (body.nickname !== undefined) {
    if (typeof body.nickname !== "string") {
      errors.push({
        field: "nickname",
        message: "닉네임은 문자열이어야 합니다.",
      });
    } else {
      const trimmed = body.nickname.trim();
      if (trimmed.length < 2 || trimmed.length > 20) {
        errors.push({
          field: "nickname",
          message: "닉네임은 2~20 자 이내여야 합니다.",
        });
      }
      // 허용 문자 체크: 영문/숫자/한글/_
      if (!/^[\wㄱ-ㅎ가-힣]+$/.test(trimmed)) {
        errors.push({
          field: "nickname",
          message: "닉네임은 영문, 숫자, 한글, _ 만 사용할 수 있습니다.",
        });
      }
    }
  }

  // bio 검증 (선택)
  if (body.bio !== undefined && typeof body.bio !== "string") {
    errors.push({ field: "bio", message: "소소개는 문자열이어야 합니다." });
  } else if (body.bio?.length > 500) {
    errors.push({
      field: "bio",
      message: "소소개는 500 자를 초과할 수 없습니다.",
    });
  }

  // profileImageUrl 검증 (선택)
  if (
    body.profileImageUrl !== undefined &&
    body.profileImageUrl !== null &&
    body.profileImageUrl !== ""
  ) {
    if (!isValidUrl(body.profileImageUrl)) {
      errors.push({
        field: "profileImageUrl",
        message: "올바른 이미지 URL 형식이어야 합니다.",
      });
    }
  }

  // businessInfo 검증 (선택, 존재 시 내부 필드 체크)
  if (body.businessInfo !== undefined) {
    if (typeof body.businessInfo !== "object") {
      errors.push({
        field: "businessInfo",
        message: "사업자 정보는 객체 형식이어야 합니다.",
      });
    } else {
      const { businessName, ceoName } = body.businessInfo;
      if (businessName !== undefined && businessName?.length > 100) {
        errors.push({
          field: "businessInfo.businessName",
          message: "상호명은 100 자를 초과할 수 없습니다.",
        });
      }
      if (ceoName !== undefined && ceoName?.length > 50) {
        errors.push({
          field: "businessInfo.ceoName",
          message: "대표자명은 50 자를 초과할 수 없습니다.",
        });
      }
    }
  }

  if (errors.length > 0) {
    return {
      ...createErrorResponse(
        400,
        "VALIDATION_FAILED",
        "입력값 검증에 실패했습니다.",
        path,
      ),
      validationErrors: errors,
    };
  }
  return null;
};
// ============================================================================
// 🔹 GET /check-nickname - 닉네임 중복 체크 (한글 안전 버전)
// ============================================================================
router.get("/check-nickname", (req: Request, res: Response) => {
  try {
    // 1. 쿼리 파라미터 추출
    const nickname = req.query.nickname;

    if (!nickname || typeof nickname !== "string") {
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            "INVALID_NICKNAME_FORMAT",
            "닉네임 파라미터가 필요합니다.",
            "/api/v1/stores/check-nickname",
          ),
        );
    }

    // 2. 공백 제거 및 기본 길이 체크 (트림 후 2~20 글자)
    const trimmed = nickname.trim();

    // ✅ 한글 포함 문자열 길이 체크: 배열로 변환하여 정확한 글자 수 계산
    const charCount = [...trimmed].length;

    if (charCount < 2 || charCount > 20) {
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            "INVALID_NICKNAME_FORMAT",
            "닉네임은 2~20 자 이내여야 합니다.",
            "/api/v1/stores/check-nickname",
          ),
        );
    }

    // 3. 허용 문자 검증 (안전한 방식: 부정 논리로 특수문자 차단)
    // ✅ 영문, 숫자, 한글, 언더바(_) 이외의 문자가 있으면 거부
    //    [\w] 는 [a-zA-Z0-9_] 를 포함하므로, 한글을 제외한 허용 문자를 명시적으로 차단
    const hasInvalidChar = /[^a-zA-Z0-9_\uAC00-\uD7A3\u3131-\uD31E]/.test(
      trimmed,
    );

    if (hasInvalidChar) {
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            "INVALID_NICKNAME_FORMAT",
            "닉네임은 영문, 숫자, 한글, _ 만 사용할 수 있습니다.",
            "/api/v1/stores/check-nickname",
          ),
        );
    }

    // 4. 중복 체크 로직 (예외 처리 포함)
    const currentUser = (req as any).mockUser;
    const excludeId = currentUser?.id?.toString();

    let isAvailable = false;
    try {
      isAvailable = StoreProfileStore.checkNickname(trimmed, excludeId);
    } catch (storeErr) {
      console.error(
        "[ERROR] StoreProfileStore.checkNickname failed:",
        storeErr,
      );
      // 저장소 에러 시 일단 사용 불가능으로 처리 (또는 500 에러 반환)
      isAvailable = false;
    }

    // 5. 응답 생성
    const responseData: any = {
      isAvailable,
      message: isAvailable
        ? "사용 가능한 닉네임입니다."
        : "이미 사용 중인 닉네임입니다.",
    };

    if (!isAvailable) {
      responseData.suggestions = [
        `${trimmed}_${Math.floor(Math.random() * 100)}`,
        `${trimmed}_shop`,
        `${trimmed}_official`,
      ];
    }

    console.log("[DEBUG] Response:", responseData);
    return res.status(200).json(responseData);
  } catch (err) {
    // ✅ 최상단 예외 핸들러: 어떤 에러든 항상 응답을 반환
    console.error("[CRITICAL] /check-nickname unhandled error:", err);

    // 에러 발생 시에도 클라이언트에게 명확한 응답 반환
    return res
      .status(500)
      .json(
        createErrorResponse(
          500,
          "INTERNAL_ERROR",
          "서버 내부 오류가 발생했습니다.",
          "/api/v1/stores/check-nickname",
        ),
      );
  }
});
// ============================================================================
// 🔹 PUT /me/profile - 내 프로필 수정 (판매자 전용)
// ============================================================================
router.put(
  "/me/profile",
  mockSellerMiddleware,
  (req: Request, res: Response) => {
    const user = req.mockUser!;
    const sellerId = user.id.toString();

    // 1. 요청값 검증
    const validationError = validateProfileUpdate(
      req.body,
      "/api/v1/stores/me/profile",
    );
    if (validationError) {
      return res.status(400).json(validationError);
    }

    // 2. 닉네임 중복 체크 (본인 제외)
    if (req.body.nickname) {
      const isAvailable = StoreProfileStore.checkNickname(
        req.body.nickname.trim(),
        sellerId,
      );
      if (!isAvailable) {
        return res
          .status(409)
          .json(
            createErrorResponse(
              409,
              "NICKNAME_ALREADY_TAKEN",
              "이미 사용 중인 닉네임입니다.",
              "/api/v1/stores/me/profile",
            ),
          );
      }
    }

    // 3. 프로필 업데이트
    // businessInfo 는 전체 교체 (명세서 기준)
    const updateData: any = { ...req.body };
    if (updateData.nickname) updateData.nickname = updateData.nickname.trim();
    if (updateData.bio) updateData.bio = updateData.bio.trim();

    const updatedProfile = StoreProfileStore.update(sellerId, updateData);

    if (!updatedProfile) {
      return res
        .status(500)
        .json(
          createErrorResponse(
            500,
            "INTERNAL_ERROR",
            "프로필 수정 중 오류가 발생했습니다.",
            "/api/v1/stores/me/profile",
          ),
        );
    }

    // 4. 응답 반환 (GET 응답 DTO 와 동일 포맷)
    return res.status(200).json({
      ...updatedProfile,
      isFollowing: true, // 본인이므로 항상 true (또는 논리적 배제)
    });
  },
);

// ============================================================================
// 🔹 GET /{sellerId}/profile - 전용 스토어 프로필
// ============================================================================
router.get("/:sellerId/profile", (req: Request, res: Response) => {
  const rawSellerId = req.params.sellerId;

  // ✅ 타입 가드: 배열이면 첫 번째 요소 사용, 아니면 그대로 사용
  const sellerId = Array.isArray(rawSellerId) ? rawSellerId[0] : rawSellerId;

  // 1. 프로필 데이터 조회
  const profile = StoreProfileStore.findBySellerId(sellerId);

  if (!profile) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "STORE_001",
          "존재하지 않는 스토어입니다.",
          `/api/v1/stores/${sellerId}/profile`,
        ),
      );
  }

  // 2. isFollowing 로직 (Mock: 쿠키/헤더 에 현재 로그인 유저가 팔로우 목록에 있는지 체크)
  // 실제 구현 시: DB 에서 Follow 관계 조회
  let isFollowing = false;
  const currentUser = (req as any).mockUser; // mockAuthMiddleware 를 거치지 않았을 수 있으므로 직접 접근 시도

  // [Mock Logic] 간단히 테스트용 헤더로 팔로우 여부 시뮬레이션
  if (req.headers["x-mock-following"] === "true") {
    isFollowing = true;
  }

  // 3. 응답 DTO 구성
  const responseDto = {
    ...profile,
    isFollowing,
    // 비회원 접근 시에도 민감 정보 (businessInfo 등) 는 노출 정책 확인 후 반환 (명세서상 선택사항이므로 그대로 반환)
  };

  return res.status(200).json(responseDto);
});



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

export default router;
