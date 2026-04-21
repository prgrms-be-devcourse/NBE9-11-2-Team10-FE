"use client";
// src/components/stores/FeedActions.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFeedAction } from "@/lib/actions/feed.action";

interface Props {
  sellerId: string;
  feedId: string;
  isMine: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FeedActions({
  sellerId,
  feedId,
  isMine,
  onEdit,
  onDelete,
}: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isMine) return null;

  const handleDelete = async () => {
    if (!confirm("정말 이 피드를 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const result = await deleteFeedAction(feedId, `/stores/${sellerId}/feeds`);
      if (result.success) {
        onDelete?.();
        router.refresh();
      } else {
        alert(result.error || "삭제 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("[FeedActions] Delete error:", err);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2" data-testid="feed-actions">
      <button
        onClick={onEdit}
        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        aria-label="수정"
        disabled={isDeleting}
      >
        ✏️
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
        aria-label="삭제"
      >
        {isDeleting ? "⏳" : "🗑️"}
      </button>
    </div>
  );
}