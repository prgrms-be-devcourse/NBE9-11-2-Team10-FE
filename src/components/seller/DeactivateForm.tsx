"use client";

import { useActionState } from "react";
import { deactivateProductAction } from "@/lib/actions/product.actions";

interface DeactivateFormProps {
  productId: number;
}

export default function DeactivateForm({ productId }: DeactivateFormProps) {
  // ✅ [state, formAction, isPending] 반환
  const [state, formAction, isPending] = useActionState(
    deactivateProductAction,
    null,
  );

  // ✅ 제출 전 확인 다이얼로그
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !confirm(
        "정말 이 상품을 비활성화하시겠습니까?\n활성화는 별도 관리 페이지에서만 가능합니다.",
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex-1">
      {/* ✅ productId 를 hidden input 으로 전달 */}
      <input type="hidden" name="productId" value={productId} />

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 px-6 border-2 border-red-200 text-red-600 font-semibold rounded-xl 
                   hover:border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed 
                   transition-all"
      >
        {isPending ? "처리 중..." : "🗑️ 비활성화"}
      </button>

      {/* ✅ 에러 메시지 표시 (선택사항) */}
      {state?.error && state.error !== "cancelled" && (
        <p className="mt-2 text-xs text-red-500">
          {state.error === "invalid_id"
            ? "잘못된 상품 ID 입니다."
            : "처리 중 오류가 발생했습니다."}
        </p>
      )}
    </form>
  );
}
