import { Suspense } from "react";
import Link from "next/link";
import { fetchStoreProfile } from "@/lib/services/store.service";
import { ApiError } from "@/utils/error/stores.error";
import { ProfileEditForm } from "@/components/stores/ProfileEditForm";

interface PageProps {
  params: Promise<{ sellerId: string }>;
}

function EditPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default async function ProfileEditPage({ params }: PageProps) {
  const { sellerId } = await params;

  let profile;
  try {
    profile = await fetchStoreProfile(sellerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">프로필을 찾을 수 없습니다.</p>
            <Link href="/stores" className="text-blue-600 hover:underline">스토어 목록으로 돌아가기</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center py-20">
          <p className="text-red-500 text-lg mb-4">프로필을 불러올 수 없습니다.</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">판매자 프로필 수정</h1>
          <Link
            href={`/stores/${sellerId}`}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition"
          >
            ← 프로필 보기
          </Link>
        </div>

        <Suspense fallback={<EditPageSkeleton />}>
          <ProfileEditForm initialData={profile} />
        </Suspense>
      </div>
    </div>
  );
}