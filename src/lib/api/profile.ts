import {
  ApiEnvelope,
  SellerProfileResponse,
  UserInfo,
  UserProfileResponse,
} from "@/types/auth";
import { uploadImageFile } from "@/lib/api/image-upload";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface MyProfile {
  businessNumber: string;
  email: string;
  name: string;
  nickname: string;
  phoneNumber: string;
  address: string;
  imageUrl: string | null;
  bio: string;
}

export interface MyProfileUpdateInput {
  nickname: string;
  phoneNumber: string;
  address: string;
  businessNumber?: string;
  bio?: string;
}

export function parseCachedMyProfile(raw: string): MyProfile | null {
  try {
    const parsed = JSON.parse(raw) as Partial<MyProfile>;
    if (!parsed || typeof parsed !== "object") return null;

    if (
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.nickname !== "string" ||
      typeof parsed.phoneNumber !== "string" ||
      typeof parsed.address !== "string"
    ) {
      return null;
    }

    return {
      email: parsed.email,
      name: parsed.name,
      nickname: parsed.nickname,
      phoneNumber: parsed.phoneNumber,
      address: parsed.address,
      imageUrl:
        typeof parsed.imageUrl === "string" || parsed.imageUrl === null
          ? parsed.imageUrl
          : null,
      businessNumber: typeof parsed.businessNumber === "string" ? parsed.businessNumber : "",
      bio: typeof parsed.bio === "string" ? parsed.bio : "",
    };
  } catch {
    return null;
  }
}

function normalizeEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data !== undefined
  ) {
    return payload.data;
  }

  return payload as T;
}

function normalizeProfile(
  raw: UserProfileResponse | SellerProfileResponse,
  fallbackUser: UserInfo,
): MyProfile {
  const rawAddress = "address" in raw ? raw.address?.trim() || "" : "";
  const roadAddress = "roadAddress" in raw ? raw.roadAddress?.trim() || "" : "";
  const detailAddress =
    "detailAddress" in raw ? raw.detailAddress?.trim() || "" : "";
  const mergedAddress = rawAddress || `${roadAddress} ${detailAddress}`.trim();
  const businessNumber =
    "businessNumber" in raw && typeof raw.businessNumber === "string"
      ? raw.businessNumber
      : "";
  const bio =
    "bio" in raw && typeof raw.bio === "string"
      ? raw.bio.trim()
      : "";

  return {
    email: raw.email || fallbackUser.email,
    name: raw.name?.trim() || raw.nickname?.replace(/\s*님$/, "") || fallbackUser.nickname,
    nickname: raw.nickname || fallbackUser.nickname,
    phoneNumber: raw.phoneNumber?.trim() || "-",
    address: mergedAddress || "-",
    imageUrl: raw.profileImageUrl || raw.imageUrl || null,
    businessNumber,
    bio,
  };
}

export async function fetchMyProfile(user: UserInfo): Promise<MyProfile> {
  const endpoints =
    user.role === "SELLER"
      ? ["/api/v1/sellers/me", "/api/v1/stores/me/profile"]
      : ["/api/v1/users/me"];

  let response: Response | null = null;
  for (const endpoint of endpoints) {
    const current = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (current.ok) {
      response = current;
      break;
    }

    // 인증 실패는 즉시 반환해야 하고, 엔드포인트 불일치(404/405)일 때만 다음 후보를 시도한다.
    if (![404, 405].includes(current.status)) {
      response = current;
      break;
    }

    response = current;
  }

  if (!response?.ok) {
    const error = new Error("내 프로필 정보를 불러오지 못했습니다.") as Error & {
      status?: number;
    };
    error.status = response?.status;
    throw error;
  }

  const result = (await response.json()) as
    | ApiEnvelope<UserProfileResponse>
    | ApiEnvelope<SellerProfileResponse>
    | UserProfileResponse
    | SellerProfileResponse;

  const data = normalizeEnvelope(result);
  return normalizeProfile(data, user);
}

export async function updateMyProfile(
  user: UserInfo,
  input: MyProfileUpdateInput,
): Promise<MyProfile> {
  const endpoint =
    user.role === "SELLER" ? "/api/v1/sellers/me" : "/api/v1/users/me";

  const basePayload = {
    nickname: input.nickname.trim(),
    phoneNumber: input.phoneNumber.trim(),
    address: input.address.trim(),
  };

  const payload =
    user.role === "SELLER"
      ? {
          ...basePayload,
          businessNumber: input.businessNumber?.trim() || "",
          bio: input.bio?.trim() ?? "",
        }
      : basePayload;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `개인 정보 수정에 실패했습니다. (${response.status}) ${errorText}`,
    );
  }

  const result = (await response.json()) as
    | ApiEnvelope<UserProfileResponse>
    | ApiEnvelope<SellerProfileResponse>
    | UserProfileResponse
    | SellerProfileResponse;

  const data = normalizeEnvelope(result);
  return normalizeProfile(data, user);
}

export async function updateMyProfileImage(
  user: UserInfo,
  imageUrl: string,
): Promise<MyProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/me/profile-image`, {
    method: "PUT",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl: imageUrl.trim() }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `프로필 이미지 수정에 실패했습니다. (${response.status}) ${errorText}`,
    );
  }

  const result = (await response.json()) as
    | ApiEnvelope<UserProfileResponse>
    | ApiEnvelope<SellerProfileResponse>
    | UserProfileResponse
    | SellerProfileResponse;

  const data = normalizeEnvelope(result);
  return normalizeProfile(data, user);
}

export async function uploadProfileImageFile(file: File): Promise<string> {
  return uploadImageFile(file, "profile");
}

export async function deleteMyProfileImage(user: UserInfo): Promise<MyProfile> {
  const response = await fetch(`${API_BASE_URL}/api/v1/me/profile-image`, {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `프로필 이미지 삭제에 실패했습니다. (${response.status}) ${errorText}`,
    );
  }

  const result = (await response.json()) as
    | ApiEnvelope<UserProfileResponse>
    | ApiEnvelope<SellerProfileResponse>
    | UserProfileResponse
    | SellerProfileResponse;

  const data = normalizeEnvelope(result);
  return normalizeProfile(data, user);
}
