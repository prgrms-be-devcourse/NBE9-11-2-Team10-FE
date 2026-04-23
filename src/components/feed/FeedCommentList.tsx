// src/components/stores/CommentList.tsx
"use client";

import { useEffect, useState } from "react";
import { CommentResponse } from "@/types/feed.type";
import { fetchCommentList } from "@/lib/services/feed.service";
import { CommentItem } from "./FeedCommentItem";
import { CommentForm } from "./FeedCommentForm";

interface Props {
  comments: CommentResponse[];
  sellerId: string;
  feedId: string;
  onLoadMore?: (comments: CommentResponse[]) => void;
}

export function CommentList({
  comments,
  sellerId,
  feedId,
  onLoadMore,
}: Props) {
  const [page, setPage] = useState(1); // 0 은 이미 로드됨
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [localComments, setLocalComments] = useState<CommentResponse[]>(comments);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // ✅ 새 댓글 추가 시 목록에 반영
  const handleCommentAdded = (newComment: CommentResponse) => {
    console.log(newComment);
    setLocalComments((prev) => [newComment, ...prev]);
  };

  // ✅ 댓글 삭제 시 목록에서 제거
  const handleCommentDeleted = (commentId: number) => {
    setLocalComments((prev) => prev.filter((c) => c.commentId !== commentId));
  };

  const handleCommentLiked = (commentId: number, newLikeCount: number, newIsLiked: boolean) => {
    setLocalComments(prev => prev.map(c => 
      c.commentId === commentId 
        ? { ...c, likeCount: newLikeCount, isLiked: newIsLiked }
        : c
    ));
  };

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
      );

      if (response.data.comments.length > 0) {
        onLoadMore?.(response.data.comments);
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
      <ul className="space-y-1" data-testid="comments-list">
        {localComments.map((comment) => (
          <CommentItem
            key={comment.commentId}
            comment={comment}
            sellerId={sellerId}
            feedId={feedId}
            onCommentDeleted={handleCommentDeleted}
            onCommentLiked={handleCommentLiked}
          />
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

      <CommentForm
        sellerId={sellerId}
        feedId={feedId}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}
