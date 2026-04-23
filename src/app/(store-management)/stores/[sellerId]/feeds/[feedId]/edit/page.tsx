// src/app/stores/[sellerId]/feeds/[feedId]/edit/page.tsx
import { fetchFeedList } from "@/lib/services/feed.service";
import { FeedForm } from "@/components/feed/FeedForm";
import { ApiError } from "@/utils/error/stores.error";

interface PageProps {
  params: Promise<{ sellerId: string; feedId: string }>;
}

export default async function EditFeedPage({ params }: PageProps) {
  const { sellerId, feedId } = await params;

  // ✨ 기존 피드 데이터 조회 (초기값 채우기용)
  let initialFeed;
  try {
    const feedList = await fetchFeedList(sellerId);
    initialFeed = feedList.data.feeds.find(
      (f) => String(f.id).trim() === String(feedId).trim()
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">
          피드를 찾을 수 없습니다.
        </div>
      );
    }
    throw error;
  }

  if (!initialFeed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">
        피드를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          피드 수정
        </h1>
        <FeedForm
          mode="edit"
          sellerId={sellerId}
          feedId={feedId}
          initialData={initialFeed}
        />
      </div>
    </div>
  );
}