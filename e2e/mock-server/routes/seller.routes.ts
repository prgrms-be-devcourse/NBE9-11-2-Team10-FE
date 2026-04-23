// e2e/mock-server/routes/store-profiles.routes.ts
import { Router, Request, Response } from "express";
import {
    createErrorResponse,
} from "../lib/mock-common-data";
import {
    StoreProfileStore,
    QueriedStoreProfile,
} from "../lib/mock-store-profile-data";

const router = Router();


// ============================================================================
// 🔹 GET /{sellerId} - 공개 프로필 조회 (공용)
// ============================================================================
router.get("/:sellerId", (req: Request, res: Response) => {
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

    // 3. 응답 DTO 구성
    const responseDto = {
        name: profile.nickname,
        nickname: profile.nickname,
        imageUrl: profile?.profileImageUrl,
        bio: profile?.bio
    } satisfies QueriedStoreProfile;

    return res.status(200).json(responseDto);
});

export default router;