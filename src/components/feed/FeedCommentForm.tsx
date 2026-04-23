// src/components/stores/CommentForm.tsx
"use client";

import { useState, useRef } from "react";
import { createCommentAction } from "@/lib/actions/feed.action";
import { CreateCommentInput } from "@/schemas/feed.schema";
import { CommentResponse } from "@/types/feed.type";

interface Props {
  sellerId: string;
  feedId: string;
  onCommentAdded?: (newComment: CommentResponse) => void;
  onCancel?: () => void;
}

export function CommentForm({
  sellerId,
  feedId,
  onCommentAdded,
  onCancel,
}: Props) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ 핵심 로직을 별도 함수로 분리 (이벤트 독립적)
  const submitComment = async () => {
    // 클라이언트 검증
    if (!content.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return false;
    }
    if (content.length > 500) {
      setError("댓글은 500자 이내로 작성해주세요.");
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const input: CreateCommentInput = { content: content.trim() };
      const result = await createCommentAction(sellerId, feedId, input);

      if (result.success && result.data) {
        onCommentAdded?.(result.data);
        setContent("");
        textareaRef.current?.focus();
        return true;
      } else {
        setError(result.error || "댓글 작성 중 오류가 발생했습니다.");
        return false;
      }
    } catch (err) {
      console.error("[CommentForm] Unexpected error:", err);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 폼 제출 핸들러 (SubmitEvent 전용)
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitComment();
  };

  // ✅ 키보드 핸들러 (KeyboardEvent 전용)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter: 줄바꿈, Enter: 제출
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting) {
        await submitComment();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t" data-testid="comment-form">
      {error && (
        <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 rounded" role="alert" data-testid="comment-form-error">
          {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="댓글을 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={2}
          maxLength={500}
          disabled={isSubmitting}
          data-testid="comment-input"
        />
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-testid="comment-submit-button"
          >
            {isSubmitting ? "전송 중..." : "등록"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-1 text-xs text-gray-400 text-right">
        {content.length}/500
      </div>
    </form>
  );
}