import { queryStoreProfile } from "@/lib/services/store.service";
import { ApiError } from "@/utils/error/stores.error";
import Image from "next/image";

interface Props {
  sellerId: string;
}

export async function StoreProfile({ sellerId }: Props) {
  let profile;

  try {
    profile = await queryStoreProfile(sellerId);
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
            {profile.data.imageUrl ? (
              <Image
                src={profile.data.imageUrl}
                alt={profile.data.nickname}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                <span className="text-3xl font-bold text-white">
                  {profile.data.nickname.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h1
            className="text-xl font-bold text-gray-800 mb-1"
            data-testid="profile-nickname"
          >
            {profile.data.nickname}
          </h1>

          {profile.data.bio && (
            <p
              className="text-sm text-gray-600 mb-4 line-clamp-2"
              data-testid="profile-bio"
            >
              {profile.data.bio}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
