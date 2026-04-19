// src/components/store/FeedItem.tsx
"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Feed, Comment } from "@/types/store";
import { fetchCommentList } from "@/lib/services/store.service";
import { CommentList } from "./CommentList";

interface Props {
  feed: Feed;
  sellerId: string;
  mockUserId?: string;
}

export function FeedItem({ feed, sellerId, mockUserId }: Props) {
  // ✅ 댓글 관련 상태는 이 컴포넌트에서 관리
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsLoaded, setIsCommentsLoaded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // ✅ 댓글 로드 함수 (최초 1 페이지만)
  const loadComments = useCallback(async () => {
    if (isCommentsLoaded || isLoadingComments) return;

    setIsLoadingComments(true);
    try {
      const response = await fetchCommentList(
        sellerId,
        feed.feedId,
        {
          page: 0,
          size: 10,
          sort: "createdAt,desc",
        },
        mockUserId,
      );
      setComments(response.comments);
      setIsCommentsLoaded(true);
      setShowComments(true);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [sellerId, feed.feedId, isCommentsLoaded, isLoadingComments, mockUserId]);

  // ✅ 댓글 토글 핸들러
  const toggleComments = () => {
    if (!isCommentsLoaded) {
      loadComments(); // ✅ 최초 열람 시에만 실제 요청
    } else {
      setShowComments((prev) => !prev);
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
      <header className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
          {/* 프로필 이미지 */}
        </div>
        <div>
          <p className="font-medium text-gray-800">판매자 닉네임</p>
          <time className="text-xs text-gray-500">
            {new Date(feed.createdAt).toLocaleDateString("ko-KR")}
          </time>
        </div>
      </header>

      {/* 👇 피드 콘텐츠 */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap line-clamp-3">
          {feed.content}
        </p>
      </div>

      {/* 👇 미디어 (이미지/동영상) */}
      {feed.mediaUrls?.length > 0 && (
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
      )}

      {/* 👇 액션 버튼 (좋아요/댓글) */}
      <footer className="border-t pt-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <button className="flex items-center gap-1 hover:text-red-500">
            ❤️ {feed.likeCount}
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
              feedId={feed.feedId}
              mockUserId={mockUserId}
              onLoadMore={(newComments) => {
                setComments((prev) => [...prev, ...newComments]);
              }}
            />

            {/* ToDo : ✅ 댓글 작성 폼 
            <CommentForm
              sellerId={sellerId}
              feedId={feed.feedId}
              mockUserId={mockUserId}
              onCommentAdded={handleCommentAdded}
            />
            */}
          </div>
        )}
      </footer>
    </article>
  );
}
