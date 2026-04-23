"use client";
// src/components/feed/FeedForm.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createFeedSchema,
  CreateFeedInput,
  UpdateFeedInput,
} from "@/schemas/feed.schema";
import { Feed } from "@/types/feed.type";
import { createFeedAction, updateFeedAction } from "@/lib/actions/feed.action";

interface Props {
  mode: "create" | "edit";
  sellerId: string;
  feedId?: string;
  initialData?: Feed;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function FeedForm({
  mode,
  sellerId,
  feedId,
  initialData,
  onCancel,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
  const [content, setContent] = useState(initialData?.content || "");
  const [imageUrl, setImageUrl] = useState<string>(
    initialData?.imageUrl || "",
  );
  const [isNotice, setIsNotice] = useState(initialData?.isNotice || false);
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // Zod 스키마 기반 검증
  const validate = (): { valid: boolean; errors?: Record<string, string> } => {
    const schema = createFeedSchema;
    const result = schema.safeParse({ content, imageUrl, isNotice });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        errors[field] = issue.message;
      });
      return { valid: false, errors };
    }
    return { valid: true };
  };

  // 미디어 URL 추가
  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    try {
      new URL(newMediaUrl); // 유효한 URL 인지 확인
    
      setImageUrl(newMediaUrl.trim());
      setNewMediaUrl("");
      setError(null);
    } catch {
      setError("유효한 URL 형식이 아닙니다.");
    }
  };

  // 미디어 URL 제거
  const handleRemoveMediaUrl = () => {
    setImageUrl("");
  };

  // 폼 제출
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validate();
    if (!validation.valid) {
      setError(Object.values(validation.errors!)[0]);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateFeedInput | UpdateFeedInput = {
        content,
        imageUrl: imageUrl || null,
        isNotice,
      };

      let result;
      if (mode === "create") {
        result = await createFeedAction(payload);
      } else {
        if (!feedId) throw new Error("피드 ID가 필요합니다.");
        result = await updateFeedAction(sellerId, feedId, payload);
      }

      if (result.success) {
        onSuccess?.();
        router.push(`/stores/${sellerId}`);
        router.refresh();
      } else {
        setError(result.error || "요청 처리 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error(`[FeedForm] ${mode} error:`, err);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="feed-form">
      {/* 🔔 공지사항 체크박스 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isNotice"
          checked={isNotice}
          onChange={(e) => setIsNotice(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300"
          data-testid="notice-checkbox"
        />
        <label htmlFor="isNotice" className="text-sm font-medium text-gray-700">
          공지사항으로 설정
        </label>
      </div>

      {/* 📝 콘텐츠 입력 */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="피드 내용을 입력하세요 (최대 2000자)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          data-testid="content-input"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {content.length}/2000
        </p>
      </div>

      {/* 🖼️ 미디어 URL 관리 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          미디어 URL (선택, 최대 1개)
        </label>

        {/* URL 입력 필드 */}
        <div className="flex gap-2 mb-3">
          <input
            type="url"
            value={newMediaUrl}
            onChange={(e) => setNewMediaUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMediaUrl())}
          />
          <button
            type="button"
            onClick={handleAddMediaUrl}
            disabled={!newMediaUrl.trim()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            추가
          </button>
        </div>

        {/* 업로드된 미디어 미리보기 */}
        {imageUrl && (
          <div className="relative w-full h-[220px] rounded-lg overflow-hidden border">

            <img
              src={imageUrl}
              alt="preview"
              className="w-full h-full object-cover"
            />

            <button
              type="button"
              onClick={handleRemoveMediaUrl}
              className="absolute top-2 right-2 bg-red-500 text-white px-2"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {/* ⚠️ 에러 메시지 */}
      {error && (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          role="alert"
          data-testid="form-error"
        >
          {error}
        </div>
      )}

      {/* 🔘 액션 버튼 */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          data-testid="submit-button"
        >
          {isSubmitting
            ? "처리 중..."
            : mode === "create"
            ? "피드 등록"
            : "수정 완료"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}