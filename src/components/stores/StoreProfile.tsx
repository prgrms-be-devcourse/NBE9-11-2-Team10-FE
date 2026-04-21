import { fetchStoreProfile } from "@/lib/services/store.service";
import { ApiError } from "@/utils/error/stores.error";
import Image from "next/image";

interface Props {
  sellerId: string;
}

export async function StoreProfile({ sellerId }: Props) {
  let profile;

  try {
    profile = await fetchStoreProfile(sellerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
            <div className="text-center py-8 text-gray-500">
              판매자 프로필을 찾을 수 없습니다.
            </div>
          </div>
        </aside>
      );
    }

    return (
      <aside className="lg:col-span-1">
        <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
          <div className="text-center py-8 text-red-500">
            프로필을 불러올 수 없습니다.
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="lg:col-span-1" data-testid="store-profile-sidebar">
      <div className="bg-white rounded-lg p-6 shadow-sm sticky top-6">
        <div className="text-center mb-6">
          <div
            className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200"
            data-testid="profile-avatar"
          >
            {profile.profileImageUrl ? (
              <Image
                src={profile.profileImageUrl}
                alt={profile.nickname}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <span className="text-3xl font-bold text-white">
                  {profile.nickname.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h1
            className="text-xl font-bold text-gray-800 mb-1"
            data-testid="profile-nickname"
          >
            {profile.nickname}
          </h1>

          {profile.bio && (
            <p
              className="text-sm text-gray-600 mb-4 line-clamp-2"
              data-testid="profile-bio"
            >
              {profile.bio}
            </p>
          )}

          <div
            className="flex justify-center gap-6 text-sm mb-4"
            data-testid="profile-stats"
          >
            <div className="text-center" data-testid="stat-followers">
              <div
                className="font-bold text-gray-900"
                data-testid="stat-value-followers"
              >
                {profile.stats.followerCount}
              </div>
              <div className="text-gray-500">구독자</div>
            </div>
            <div className="text-center" data-testid="stat-products">
              <div
                className="font-bold text-gray-900"
                data-testid="stat-value-products"
              >
                {profile.stats.productCount}
              </div>
              <div className="text-gray-500">상품</div>
            </div>
            <div className="text-center" data-testid="stat-feeds">
              <div
                className="font-bold text-gray-900"
                data-testid="stat-value-feeds"
              >
                {profile.stats.feedCount}
              </div>
              <div className="text-gray-500">피드</div>
            </div>
          </div>

          {profile.businessInfo && (
            <div className="text-xs text-gray-500 space-y-1 mb-4">
              {profile.businessInfo.businessName && (
                <p>{profile.businessInfo.businessName}</p>
              )}
              {profile.businessInfo.ceoName && (
                <p>대표: {profile.businessInfo.ceoName}</p>
              )}
            </div>
          )}

          <div className="text-xs text-gray-400">
            {new Date(profile.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            가입
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 mb-1">판매자 ID</div>
          <div className="text-sm font-mono text-gray-700 break-all">
            {profile.sellerId}
          </div>
        </div>
      </div>
    </aside>
  );
}
