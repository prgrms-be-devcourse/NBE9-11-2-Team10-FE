// src/types/store.ts

// ============================================================================
// 📦 프로필 관련 타입 (백엔드 DTO 와 1:1 매핑)
// ============================================================================
export interface BusinessInfo {
  businessName?: string;
  ceoName?: string;
}

export interface QueriedStoreProfile {
  data: {
    name: string;
    nickname: string;
    imageUrl?: string | null;
    bio?: string;
  }
}

export interface StoreProfileResponse {
  sellerId: string;
  nickname: string;
  profileImageUrl?: string | null;
  bio?: string;
  businessInfo?: BusinessInfo;
  stats: {
    followerCount: number;
    productCount: number;
    feedCount: number;
  };
  createdAt: string;
  updatedAt: string;
  isFollowing: boolean; // ✅ 요청 사용자 기준 팔로우 여부
}

// ============================================================================
// 📦 강조 상품 관련 타입
// ============================================================================
export interface FeaturedProduct {
  productId: string;
  productName: string;
  thumbnailUrl: string;
  price: number;
  discountRate?: number;
  isSoldOut: boolean;
  displayOrder: number;
}

export interface FeaturedProductListResponse {
  products: FeaturedProduct[];
}

// ============================================================================
// 📦 닉네임 체크 응답 타입
// ============================================================================
export interface NicknameCheckResponse {
  isAvailable: boolean;
  message: string;
  suggestions?: string[];
}
