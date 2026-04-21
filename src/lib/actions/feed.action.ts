"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createFeed,
  updateFeed,
  deleteFeed,
  toggleFeedLike,
} from "@/lib/services/feed.service";
import {
  CreateFeedInput,
  UpdateFeedInput,
  FeedLikeToggleInput,
} from "@/schemas/feed.schema";
import { CreateFeedResponse, FeedLikeToggleResponse } from "@/types/feed.type";
import { ApiError } from "@/utils/error/stores.error";

// ============================================================================
// 🔹 액션: 피드 생성
// ============================================================================

export async function createFeedAction(
  input: CreateFeedInput,
): Promise<{ success: boolean; data?: CreateFeedResponse; error?: string }> {
  try {
    const result = await createFeed(input);

    // 피드 목록 페이지 캐시 무효화
    revalidatePath("/stores/[sellerId]");

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    console.error("[createFeedAction] Unexpected error:", error);
    return { success: false, error: "피드 생성 중 오류가 발생했습니다." };
  }
}

// ============================================================================
// 🔹 액션: 피드 수정
// ============================================================================

export async function updateFeedAction(
  sellerId: string,
  feedId: string,
  input: UpdateFeedInput,
): Promise<{ success: boolean; data?: CreateFeedResponse; error?: string }> {
  try {
    const result = await updateFeed(sellerId, feedId, input);

    revalidatePath(`/stores/${sellerId}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    console.error("[updateFeedAction] Unexpected error:", error);
    return { success: false, error: "피드 수정 중 오류가 발생했습니다." };
  }
}

// ============================================================================
// 🔹 액션: 피드 삭제
// ============================================================================

export async function deleteFeedAction(
  feedId: string,
  redirectPath?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteFeed(feedId);

    // 리다이렉트 경로가 제공되면 해당 경로로 이동 (예: 피드 목록)
    if (redirectPath) {
      revalidatePath(redirectPath);
    }

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    console.error("[deleteFeedAction] Unexpected error:", error);
    return { success: false, error: "피드 삭제 중 오류가 발생했습니다." };
  }
}

// ============================================================================
// 🔹 액션: 피드 좋아요 토글
// ============================================================================

export async function toggleFeedLikeAction(
  input: FeedLikeToggleInput,
): Promise<{
  success: boolean;
  data?: FeedLikeToggleResponse;
  error?: string;
}> {
  try {
    const result = await toggleFeedLike(input);

    // 좋아요 수 변경 시 해당 피드 페이지 캐시 무효화
    revalidatePath(`/stores/${input.sellerId}/feeds/${input.feedId}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ApiError) {
      // UNAUTHORIZED(401) 인 경우 로그인 페이지로 리다이렉트 고려
      if (error.status === 401) {
        // redirect("/login"); // 필요시 사용
        return { success: false, error: "로그인 후 이용 가능합니다." };
      }
      return { success: false, error: error.message };
    }
    console.error("[toggleFeedLikeAction] Unexpected error:", error);
    return { success: false, error: "좋아요 처리 중 오류가 발생했습니다." };
  }
}
