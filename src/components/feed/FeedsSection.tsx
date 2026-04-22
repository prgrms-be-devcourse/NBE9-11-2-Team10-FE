// src/components/stores/FeedsSection.tsx
import { fetchFeedList } from "@/lib/services/feed.service";
import { FeedItem } from "./FeedItem";
import { ApiError } from "@/utils/error/stores.error";
import Link from "next/link";
import { FeedItemList } from "./FeedItemList";

interface Props {
  sellerId: string;
}

export async function FeedsSection({ sellerId }: Props) {
  // ✅ 피드 목록만 서버에서 조회
  let feedList;

  try {
    feedList = await fetchFeedList(sellerId);
  } catch (error) {
    // 404 에러 처리
    if (error instanceof ApiError && error.status === 404) {
      return (
        <section className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Activity</h2>
          <div className="text-center py-8 text-gray-500">
            판매자 정보를 찾을 수 없습니다.
          </div>
        </section>
      );
    }

    // 기타 에러 처리
    return (
      <section className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Activity</h2>
        <div className="text-center py-8 text-red-500">
          피드를 불러올 수 없습니다.
          <button
            onClick={() => window.location.reload()}
            className="ml-2 text-sm underline hover:text-red-700"
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  if (!feedList.feeds.length) {
    return (
      <section className="bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Activity</h2>
        <div className="text-center py-8 text-gray-500">
          아직 등록된 피드가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-gray-50 rounded-lg p-6 mb-6"
      data-testid="feeds-section"
    >
      <h2
        className="text-xl font-bold mb-4 text-gray-800"
        data-testid="section-title"
      >
        Activity
      </h2>
      <Link
        href={`/stores/${sellerId}/feeds/new`}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        data-testid="create-feed-button"
      >
        + 피드 작성
      </Link>
      <FeedItemList
        feeds={feedList.feeds}
        sellerId={sellerId}
      />
    </section>
  );
}
