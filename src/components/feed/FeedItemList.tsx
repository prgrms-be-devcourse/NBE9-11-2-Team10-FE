"use client";
// src/components/stores/FeedItemList.tsx

import { Feed } from "@/types/feed.type";
import { FeedItem } from "./FeedItem";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
  feeds: Feed[];
  sellerId: string;
  mockUserId?: string;
}

export function FeedItemList({ feeds, sellerId, mockUserId }: Props) {
  // 👇 Zustand 에서 현재 사용자 정보 가져오기
  const { user } = useAuthStore();
  
  // ✅ 우선순위: mockUserId (서버 전달) > Zustand user.id > null
  const currentUserId = mockUserId ?? user?.id?.toString();
  const isMine = currentUserId === sellerId;

  return (
    <div className="space-y-6" data-testid="feeds-list">
      {feeds.map((feed) => (
        <FeedItem
          key={feed.feedId}
          feed={feed}
          sellerId={sellerId}
          isMine={isMine}  // 👈 계산된 값 전달
          mockUserId={mockUserId}
        />
      ))}
    </div>
  );
}