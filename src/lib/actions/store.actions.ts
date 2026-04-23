"use server";
// src/lib/actions/store.actions.ts


import { redirect } from "next/navigation";
import {
  updateStoreProfile,
  checkNicknameAvailability,
} from "@/lib/services/store.service";
import { ApiError, ValidationError } from "@/utils/error/stores.error";
import { profileUpdateSchema } from "@/schemas/store.schema";

// ============================================================================
// 🔹 프로필 수정 액션 (폼 제출용)
// ============================================================================

export async function handleUpdateProfile(
  prevState: { error?: string; fieldErrors?: Record<string, string> },
  formData: FormData,
): Promise<{ error?: string; fieldErrors?: Record<string, string> }> {
  let result;
  try {
    // 1️⃣ FormData 에서 원시 데이터 추출
    const rawData: Record<string, any> = {
      nickname: formData.get("nickname") as string,
      bio: formData.get("bio") as string,
      profileImageUrl: formData.get("profileImageUrl") as string,
    };

    // businessInfo 는 트리거 필드 존재 시만 파싱
    if (formData.get("businessInfo")) {
      rawData.businessInfo = {
        businessName: formData.get("businessName") as string,
        ceoName: formData.get("ceoName") as string,
      };
    }

    // 2️⃣ ✅ 빈 문자열 정규화 (스키마 검증 전에 반드시 실행!)
    if (rawData.nickname === "") rawData.nickname = undefined;
    if (rawData.bio === "") rawData.bio = undefined;
    if (rawData.profileImageUrl === "") rawData.profileImageUrl = null;
    
    if (rawData.businessInfo) {
      if (rawData.businessInfo.businessName === "") {
        rawData.businessInfo.businessName = undefined;
      }
      if (rawData.businessInfo.ceoName === "") {
        rawData.businessInfo.ceoName = undefined;
      }
      // 둘 다 비어있으면 businessInfo 자체를 제거 (선택사항)
      if (
        !rawData.businessInfo.businessName && 
        !rawData.businessInfo.ceoName
      ) {
        delete rawData.businessInfo;
      }
    }

    // 3️⃣ ✅ Zod 스키마로 검증
    const validated = profileUpdateSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        error: "입력값을 확인해 주세요.",
        fieldErrors: validated.error.issues.reduce(
          (acc, issue) => ({
            ...acc,
            [issue.path.join(".")]: issue.message,
          }),
          {} as Record<string, string>,
        ),
      };
    }

    // 4️⃣ ✅ 검증 통과한 데이터로 서비스 호출
    result = await updateStoreProfile(validated.data);

  } catch (error) {
    // ✅ ValidationError: Zod 검증 실패는 위에서 처리하므로 여기선 서비스 레이어 에러만 처리
    if (error instanceof ValidationError) {
      return {
        error: "입력값을 확인해 주세요.",
        fieldErrors: error.fields.reduce(
          (acc, err) => ({ ...acc, [err.field]: err.message }),
          {} as Record<string, string>,
        ),
      };
    }

    // ✅ ApiError: 백엔드에서 온 에러 (예: 닉네임 중복 409)
    if (error instanceof ApiError) {
      return {
        error: error.detail,
      };
    }

    // ✅ 기타 예상치 못한 에러
    console.error("[handleUpdateProfile] Unhandled Error:", error);
    return {
      error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }


    // 5️⃣ ✅ 성공 시 리다이렉트
    redirect(`/stores/${result.sellerId}`);
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
