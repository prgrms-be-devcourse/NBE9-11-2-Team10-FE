"use client";

import { useState } from "react";
import { deleteCommentAction, toggleCommentLikeAction } from "@/lib/actions/feed.action"; // 👈 추가
import { CommentResponse } from "@/types/feed.type";
import Image from "next/image";

interface Props {
  comment: CommentResponse;
  sellerId: string;
  feedId: string;
  onCommentDeleted?: (commentId: number) => void;
  onCommentLiked?: (commentId: number, newLikeCount: number, newIsLiked: boolean) => void; // 👈 추가 (선택)
}

export function CommentItem({
  comment,
  sellerId,
  feedId,
  onCommentDeleted,
  onCommentLiked, // 👈 추가
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // 👇 좋아요 상태 로컬 관리 (낙관적 업데이트용)
  const [localLikeState, setLocalLikeState] = useState({
    isLiked: comment.isLiked,
    likeCount: comment.likeCount,
  });

  const handleDelete = async () => {
    if (!comment.isMine) return;
    setIsDeleting(true);
    try {
      const result = await deleteCommentAction(sellerId, feedId, String(comment.commentId));
      if (result.success) {
        onCommentDeleted?.(comment.commentId);
      } else {
        alert(result.error || "댓글 삭제 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("[CommentItem] Delete error:", err);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  // 👇 새로 추가: 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    // 낙관적 업데이트: 즉시 UI 반영
    setLocalLikeState(prev => ({
      isLiked: !prev.isLiked,
      likeCount: prev.isLiked ? Math.max(0, prev.likeCount - 1) : prev.likeCount + 1,
    }));

    try {
      const result = await toggleCommentLikeAction({
        sellerId,
        feedId,
        commentId: String(comment.commentId),
      });

      if (!result.success) {
        // 실패 시 롤백
        setLocalLikeState({
          isLiked: comment.isLiked,
          likeCount: comment.likeCount,
        });
        alert(result.error || "좋아요 처리 중 오류가 발생했습니다.");
      } else {
        // 상위 컴포넌트에 동기화 알림 (선택사항)
        onCommentLiked?.(
          comment.commentId, 
          result.data?.likeCount ?? localLikeState.likeCount,
          result.data?.isLiked ?? localLikeState.isLiked
        );
      }
    } catch (err) {
      console.error("[CommentItem] Like toggle error:", err);
      // 에러 시 롤백
      setLocalLikeState({
        isLiked: comment.isLiked,
        likeCount: comment.likeCount,
      });
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <li 
      className="group flex items-start gap-3 py-2 px-2 rounded hover:bg-gray-50 transition-colors"
      data-testid={`comment-item-${comment.commentId}`}
    >
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
          {comment.writer.profileImageUrl ? (
            <Image
              src={comment.writer.profileImageUrl}
              alt={comment.writer.nickname}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              {comment.writer.nickname.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* 댓글 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-800">
            {comment.writer.nickname}
            {comment.isMine && (
              <span className="ml-1 text-xs text-blue-600">(나)</span>
            )}
          </span>
          <time className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString("ko-KR", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
        
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* 액션 버튼 (좋아요 + 삭제) */}
        <div className="mt-2 flex items-center gap-3">
          {/* 👇 수정된 좋아요 버튼 */}
          <button 
            onClick={handleLikeToggle} // 👈 클릭 핸들러 연결
            className={`flex items-center gap-1 text-xs transition-colors ${
              localLikeState.isLiked 
                ? "text-red-500 hover:text-red-600" 
                : "text-gray-400 hover:text-red-500"
            }`}
            disabled={isDeleting} // 삭제 중일 때는 좋아요도 비활성화 (선택사항)
            data-testid={`comment-like-button-${comment.commentId}`} // 👈 테스트용 ID 추가
          >
            ❤️ {localLikeState.likeCount}
          </button>
          
          {/* 삭제 버튼 - 본인 댓글일 때만 표시 */}
          {comment.isMine && !showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              data-testid={`comment-delete-button-${comment.commentId}`}
            >
              삭제
            </button>
          )}
          
          {/* 삭제 확인 UI */}
          {comment.isMine && showConfirm && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600">정말 삭제하시겠습니까?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-0.5 text-red-600 font-medium hover:bg-red-50 rounded disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "확인"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}