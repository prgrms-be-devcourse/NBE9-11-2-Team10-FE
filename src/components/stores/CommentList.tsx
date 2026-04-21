// src/components/stores/CommentList.tsx
"use client";

import { useState } from "react";
import { Comment } from "@/types/feed.type";
import { fetchCommentList } from "@/lib/services/feed.service";

interface Props {
  comments: Comment[];
  sellerId: string;
  feedId: string;
  mockUserId?: string;
  onLoadMore?: (comments: Comment[]) => void;
}

export function CommentList({
  comments,
  sellerId,
  feedId,
  mockUserId,
  onLoadMore,
}: Props) {
  const [page, setPage] = useState(1); // 0 은 이미 로드됨
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetchCommentList(
        sellerId,
        feedId,
        {
          page,
          size: 10,
          sort: "createdAt,desc",
        },
        mockUserId,
      );

      if (response.comments.length > 0) {
        onLoadMore?.(response.comments);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more comments:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 댓글 목록 */}
      <ul className="space-y-2">
        {comments.map((comment) => (
          <li key={comment.commentId} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700">
                {comment.writer.userId}
              </span>
              <span className="text-gray-600 flex-1">{comment.content}</span>
              <time className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {/* 더보기 버튼 */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoadingMore}
          className="w-full text-center text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {isLoadingMore ? "로딩 중..." : "이전 댓글 보기"}
        </button>
      )}
    </div>
  );
}
