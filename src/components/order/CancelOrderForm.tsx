import { cancelOrderAction } from "@/lib/actions/order.actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


// 취소 폼 컴포트 (Server Action 사용)
export function CancelOrderForm({ orderNumber }: { orderNumber: string}) {
    async function handleCancel(formData: FormData) {
    "use server";

    const result = await cancelOrderAction(orderNumber);

    if (result.success) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${orderNumber}`);
      redirect(`/orders/${orderNumber}?cancelled=true`);
    } else {
      // 에러 처리는 클라이언트 컴포넌트로 분리하는 것이 좋음
      console.error("주문 취소 실패:", result.error);
    }
  }

  return (
    <form
      action={handleCancel}
      className="border-t pt-4 flex justify-end"
      data-testid="cancel-order-form"
    >
      <button
        type="submit"
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        data-testid="cancel-order-button"
        onClick={(e) => {
          if (!confirm("정말로 주문을 취소하시겠습니까?")) {
            e.preventDefault();
          }
        } }
      >
        주문 취소
      </button>
    </form>
  );
}
