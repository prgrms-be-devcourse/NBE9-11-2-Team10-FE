"use client";
// src/components/stores/FeedItem.tsx

import { useState, useCallback } from "react";
import Image from "next/image";
import { Feed, CommentResponse } from "@/types/feed.type";
import { fetchCommentList } from "@/lib/services/feed.service";
import { CommentList } from "./FeedCommentList";
import { FeedActions } from "./FeedActions";
import { SellerPublicResponse } from "@/types/auth";
import { toggleFeedLikeAction } from "@/lib/actions/feed.action";

interface Props {
  feed: Feed;
  sellerId: string;
  isMine?: boolean;
  seller: SellerPublicResponse;
}

export function FeedItem({ feed, sellerId, isMine, seller }: Props) {
  // ✅ 댓글 관련 상태는 이 컴포넌트에서 관리
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isCommentsLoaded, setIsCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikeState, setLocalLikeState] = useState({
    isLiked: feed.isLiked,
    likeCount: feed.likeCount,
  });

  // ✅ 댓글 로드 함수 (최초 1 페이지만)
  const loadComments = useCallback(async () => {
    if (isCommentsLoaded || isLoadingComments) return;

    setIsLoadingComments(true);
    try {
      const response = await fetchCommentList(
        sellerId,
        feed.id,
        {
          page: 0,
          size: 10,
          sort: "createdAt,desc",
        },
      );
      setComments(response.data.comments);
      setIsCommentsLoaded(true);
      setShowComments(true);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [sellerId, feed.id, isCommentsLoaded, isLoadingComments]);

  // ✅ 댓글 토글 핸들러
  const toggleComments = () => {
    if (!isCommentsLoaded) {
      loadComments(); // ✅ 최초 열람 시에만 실제 요청
    } else {
      setShowComments((prev) => !prev);
    }
  };

  const handleFeedLikeToggle = async () => {
    if (!feed.id) {
      alert("피드 정보를 확인할 수 없습니다.");
      return;
    }

    const prevState = localLikeState;
    const optimisticState = {
      isLiked: !prevState.isLiked,
      likeCount: prevState.isLiked
        ? Math.max(0, prevState.likeCount - 1)
        : prevState.likeCount + 1,
    };
    setLocalLikeState(optimisticState);

    try {
      const result = await toggleFeedLikeAction({
        sellerId,
        feedId: feed.id,
      });

      if (!result.success || !result.data) {
        setLocalLikeState(prevState);
        alert(result.error || "좋아요 처리 중 오류가 발생했습니다.");
        return;
      }

      setLocalLikeState({
        isLiked: result.data.isLiked,
        likeCount: result.data.likeCount,
      });
    } catch (error) {
      console.error("[FeedItem] Feed like toggle failed:", error);
      setLocalLikeState(prevState);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  /* ToDo : ✅ 새 댓글 추가 시 목록에 반영 (CommentForm 에서 호출)
  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
  };
  */

  return (
    <article className="bg-white rounded-lg p-4 shadow-sm">
      {/* 👇 피드 헤더 (작성자/시간) */}
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
            {seller.imageUrl ? (
              <Image
                src={seller.imageUrl}
                alt="profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                👤
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">{seller.nickname}</p>
            <time className="text-xs text-gray-500">
              {new Date(feed.createdAt).toLocaleDateString("ko-KR")}
            </time>
          </div>
        </div>

        {/* 👈 소유자일 경우 액션 버튼 표시 */}
        <FeedActions
          sellerId={sellerId}
          feedId={feed.id}
          isMine={isMine ?? false}
          onEdit={() => {
            // 수정 페이지로 이동 (Next.js App Router)
            window.location.href = `/stores/${sellerId}/feeds/${feed.id}/edit`;
          }}
          onDelete={() => {
            // 삭제 후 페이지 새로고침
            window.location.reload();
          }}
        />
      </header>

      {/* 👇 피드 콘텐츠 */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap line-clamp-3">
          {feed.content}
        </p>
      </div>

      {feed.imageUrl && feed.imageUrl.startsWith("http") && (
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
          <Image
            src={feed.imageUrl}
            alt="feed image"
            fill
            className="object-contain"
          />
        </div>
      )}

      {/* 👇 미디어 (이미지/동영상) - 여러개일 경우 (추후) */}
      
      {/* {feed.mediaUrls?.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {feed.mediaUrls.slice(0, 3).map((url, idx) => (
            <div
              key={idx}
              className="aspect-square relative rounded-md overflow-hidden bg-gray-100"
            >
              <Image src={url} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )} */}

      {/* 👇 액션 버튼 (좋아요/댓글) */}
      <footer className="border-t pt-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <button
            type="button"
            onClick={handleFeedLikeToggle}
            className={`flex items-center gap-1 transition-colors ${
              localLikeState.isLiked
                ? "text-red-500 hover:text-red-600"
                : "hover:text-red-500"
            }`}
          >
            ❤️ {localLikeState.likeCount}
          </button>

          {/* ✅ 댓글 버튼: 클릭 시 댓글 로딩 트리거 */}
          <button
            onClick={toggleComments}
            className="flex items-center gap-1 hover:text-blue-600"
          >
            💬 {feed.commentCount}
            {isLoadingComments && <span className="ml-1 animate-spin">⏳</span>}
          </button>
        </div>

        {/* 👇 댓글 섹션 (토글 방식으로 표시) */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            {/* ✅ 댓글 목록 컴포넌트 */}
            <CommentList
              comments={comments}
              sellerId={sellerId}
              feedId={feed.id}
              onLoadMore={(newComments) => {
                setComments((prev) => [...prev, ...newComments]);
              }}
            />
          </div>
        )}
      </footer>
    </article>
  );
}
