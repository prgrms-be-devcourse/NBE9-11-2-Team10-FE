"use client";
// src/components/stores/FeedItemList.tsx

import { Feed } from "@/types/feed.type";
import { FeedItem } from "./FeedItem";
import { useAuthStore } from "@/stores/useAuthStore";
import { fetchSellerPulbicInfo } from "@/lib/services/userService";
import { SellerPublicResponse } from "@/types/auth";

interface Props {
  feeds: Feed[];
  sellerId: string;
  seller: SellerPublicResponse;
}

export function FeedItemList({ feeds, sellerId, seller }: Props) {
  // 👇 Zustand 에서 현재 사용자 정보 가져오기
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const isMine = currentUserId === Number(sellerId);

  return (
    <div className="space-y-6" data-testid="feeds-list">
      {feeds.map((feed) => (
        <FeedItem
          key={feed.id}
          feed={feed}
          sellerId={sellerId}
          seller={seller}
          isMine={isMine}  // 👈 계산된 값 전달
        />
      ))}
    </div>
  );
}