// src/lib/actions/store.actions.ts
"use server";

import { redirect } from "next/navigation";
import {
  updateStoreProfile,
  checkNicknameAvailability,
} from "@/lib/services/store.service";
import { ProfileUpdateRequest } from "@/schemas/store.schema";
import { ApiError, ValidationError } from "@/utils/error/stores.error";

// ============================================================================
// 🔹 프로필 수정 액션 (폼 제출용)
// ============================================================================
export async function handleUpdateProfile(
  prevState: { error?: string; fieldErrors?: Record<string, string> },
  formData: FormData,
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  try {
    const data: ProfileUpdateRequest = {
      nickname: (formData.get("nickname") as string) || undefined,
      bio: (formData.get("bio") as string) || undefined,
      profileImageUrl: (formData.get("profileImageUrl") as string) || null,
      businessInfo: formData.get("businessInfo")
        ? {
            businessName: formData.get("businessName") as string,
            ceoName: formData.get("ceoName") as string,
          }
        : undefined,
    };

    // ✅ 빈 문자열 정제
    if (data.nickname === "") data.nickname = undefined;
    if (data.bio === "") data.bio = undefined;
    if (data.profileImageUrl === "") data.profileImageUrl = null;

    // ✅ 서비스 호출 (성공 시 순수 데이터 반환)
    const result = await updateStoreProfile(data);

    // ✅ 성공 시 리다이렉트
    redirect(`/stores/${result.sellerId}`);

    // unreachable, but for type safety
    return {};
  } catch (error) {
    // ✅ ValidationError: 필드별 에러 반환
    if (error instanceof ValidationError) {
      return {
        error: "입력값을 확인해 주세요.",
        fieldErrors: error.fields.reduce(
          (acc, err) => ({ ...acc, [err.field]: err.message }),
          {} as Record<string, string>,
        ),
      };
    }

    // ✅ ApiError: 백엔드에서 온 에러 메시지 반환
    if (error instanceof ApiError) {
      return {
        error: error.detail,
        // errorCode 에 따라 추가 처리 가능
      };
    }

    // ✅ 기타 예상치 못한 에러
    console.error("[handleUpdateProfile] Unhandled Error:", error);
    return {
      error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}

// ============================================================================
// 🔹 닉네임 실시간 중복 체크 액션
// ============================================================================
export async function checkNicknameAction(
  nickname: string,
): Promise<{ isAvailable: boolean; message: string; suggestions?: string[] }> {
  try {
    const result = await checkNicknameAvailability({ nickname });
    return {
      isAvailable: result.isAvailable,
      message: result.message,
      suggestions: result.suggestions,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        isAvailable: false,
        message: error.detail,
      };
    }
    return {
      isAvailable: false,
      message: "닉네임 확인 중 오류가 발생했습니다.",
    };
  }
}
