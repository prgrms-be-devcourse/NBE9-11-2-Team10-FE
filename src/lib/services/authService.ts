"use server";

import {
  LoginFormValues,
  loginSchema,
  RegisterRequest,
} from "@/schemas/auth.schema";
import { LoginResponse, RegisterResponse } from "@/types/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";

export async function registerService(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  try {
    const fullAddress = `${data.roadAddress} ${data.detailAddress}`.trim();

    // 서버가 기대하는 포맷으로 변환
    const payload = {
      ...data,
      address: fullAddress,
    };

    const { roadAddress, detailAddress, ...serverPayload } = payload;

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serverPayload),
      // Next.js fetch 캐시 비활성화 (민감한 회원가입 데이터)
      cache: "no-store",
    });

    const result = await response.json();

    // 성공 응답 처리
    if (response.ok && result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    // 실패 응답 처리 (RFC 7807 포맷 매핑)
    return {
      success: false,
      detail: result.detail || "회원가입에 실패했습니다.",
      errorCode: result.errorCode,
      validationErrors: result.validationErrors,
      status: response.status,
    };
  } catch (error) {
    console.error("[registerService] Network Error:", error);
    return {
      success: false,
      detail: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
    };
  }
}
