// e2e/mock-server/lib/mock-store-profile-data.ts
import { MOCK_USERS, MockUser } from "./mock-user-data";

// ============================================================================
// 📦 프로필 타입 정의
// ============================================================================
export interface BusinessInfo {
  businessName?: string; // 상호명 (최대 100 자)
  ceoName?: string; // 대표자명 (최대 50 자)
}

export interface StoreProfile {
  sellerId: string; // UUID 형식
  nickname: string; // 2~20 자
  profileImageUrl?: string | null; // URL 형식
  bio?: string; // 최대 500 자
  businessInfo?: BusinessInfo; // 선택 사항
  stats: {
    followerCount: number;
    productCount: number;
    feedCount: number;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ============================================================================
// 🗄️ In-Memory Store
// ============================================================================
const profiles: Map<string, StoreProfile> = new Map();

// 초기 데이터 생성 헬퍼
const createInitialProfile = (
  user: MockUser,
  overrides?: Partial<StoreProfile>,
): StoreProfile => {
  const now = new Date().toISOString();
  return {
    sellerId: user.id.toString(), // Mock 환경에서는 string 변환 처리
    nickname: user.nickname,
    profileImageUrl: null,
    bio: "",
    businessInfo: undefined,
    stats: {
      followerCount: 0,
      productCount: 0,
      feedCount: 0,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

// 초기화 함수
export const initStoreProfiles = () => {
  profiles.clear();
  // 판매자 계정인 경우에만 프로필 초기화
  if (MOCK_USERS.SELLER) {
    profiles.set(
      MOCK_USERS.SELLER.id.toString(),
      createInitialProfile(MOCK_USERS.SELLER, {
        nickname: "북스셀러_길동",
        bio: "좋은 책을 소개하는 스토어입니다.",
        stats: { followerCount: 128, productCount: 15, feedCount: 42 },
      }),
    );
  }
};

// 닉네임 중복 체크를 위한 임시 저장소 (실제 구현 시 프로필 데이터와 통합 또는 DB 조회)
const takenNicknames = new Set<string>(["북스셀러_길동", "admin", "test_user"]);

// ============================================================================
// 🛠️ CRUD 헬퍼 함수
// ============================================================================
export const StoreProfileStore = {
  // 🔍 프로필 조회
  findBySellerId: (sellerId: string): StoreProfile | undefined => {
    return profiles.get(sellerId);
  },

  // ✏️ 프로필 수정 (부분 업데이트 지원)
  update: (
    sellerId: string,
    updates: Partial<StoreProfile>,
  ): StoreProfile | null => {
    const profile = profiles.get(sellerId);
    if (!profile) return null;

    const updated = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
      // stats 는 별도 엔드포인트에서 관리하거나 여기에서 병합
      stats: { ...profile.stats, ...(updates.stats || {}) },
    };
    profiles.set(sellerId, updated);
    return updated;
  },

  // 🔍 닉네임 사용 가능 여부 체크
  checkNickname: (nickname: string, excludeSellerId?: string): boolean => {
    // 1. 기본 금지 닉네임 체크
    if (takenNicknames.has(nickname)) {
      // 본인 닉네임은 중복으로 간주하지 않음 (수정 시)
      if (excludeSellerId) {
        const myProfile = profiles.get(excludeSellerId);
        if (myProfile?.nickname === nickname) {
          return true;
        }
      }
      return false;
    }
    // 2. 기존 프로필 중 닉네임 중복 체크
    for (const profile of profiles.values()) {
      if (
        profile.nickname === nickname &&
        profile.sellerId !== excludeSellerId
      ) {
        return false;
      }
    }
    return true;
  },

  // 🔄 데이터 초기화 (E2E 테스트용)
  reset: () => {
    initStoreProfiles();
  },
};

// 서버 부팅 시 초기 데이터 로드
initStoreProfiles();
