// app/(public)/orders/[orderNumber]/page.tsx
import Link from "next/link";
import { ProblemDetailError } from "@/types/common";
import { fetchOrderDetail } from "@/lib/services/order.service";
import { OrderApiError } from "@/utils/error/orders.error";

// 주문 상품 테이블 컴포넌트
function OrderItemTable({ items }: { items: any[] }) {
  return (
    <div className="border-t pt-4" data-testid="order-items-section">
      <h2 className="font-bold mb-4" data-testid="order-items-title">주문 상품</h2>
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="order-items-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상품명</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">수량</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">단가</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y" data-testid="order-items-tbody">
            {items.map((item, index) => (
              <tr key={`${item.productId}-${index}`} data-testid={`order-item-${index}`}>
                <td 
                  className="px-4 py-3 text-sm text-gray-900"
                  data-testid={`order-item-name-${index}`}
                >
                  {item.productName}
                </td>
                <td 
                  className="px-4 py-3 text-sm text-gray-700 text-center"
                  data-testid={`order-item-quantity-${index}`}
                >
                  {item.quantity}개
                </td>
                <td 
                  className="px-4 py-3 text-sm text-gray-700 text-right"
                  data-testid={`order-item-price-${index}`}
                >
                  {item.orderPrice.toLocaleString()}원
                </td>
                <td 
                  className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                  data-testid={`order-item-total-${index}`}
                >
                  {(item.orderPrice * item.quantity).toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 상태 뱃지 컴포넌트
function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    READY: { label: "결제 대기", color: "bg-yellow-100 text-yellow-800" },
    PAID: { label: "결제 완료", color: "bg-green-100 text-green-800" },
    CANCELLED: { label: "취소됨", color: "bg-red-100 text-red-800" },
    REFUNDED: { label: "환불됨", color: "bg-gray-100 text-gray-800" },
  };

  const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" };

  return (
    <span 
      className={`px-4 py-2 rounded-full text-sm font-medium ${config.color}`}
      data-testid="order-status-badge"
      data-status={status}
    >
      {config.label}
    </span>
  );
}

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}

export default async function OrderDetailPage(props: OrderDetailPageProps) {
  // ✅ Promise 해제
  const { orderNumber } = await props.params;
  const { cancelled } = await props.searchParams;

  let order: any = null;
  let error: ProblemDetailError | null = null;

  try {
    // ✅ 이제 orderNumber 는 정상적인 문자열
    order = await fetchOrderDetail(orderNumber);
  } catch (err) {
    if (err instanceof OrderApiError) {
      error = err.problemDetail;
    } else {
      error = {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "주문 상세 정보를 불러오는 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      };
    }
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/orders" className="text-blue-600 hover:underline" data-testid="back-to-orders-link">
            ← 주문 목록으로
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" data-testid="order-detail-error">
          <p className="text-red-600 font-medium mb-2">주문 상세 정보를 불러올 수 없습니다</p>
          <p className="text-sm text-red-500">{error.detail}</p>
          {error.errorCode === "ACCESS_DENIED" && (
            <p className="text-sm text-red-500 mt-2">본인의 주문만 조회할 수 있습니다.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/orders" 
          className="text-blue-600 hover:underline"
          data-testid="back-to-orders-link"
        >
          ← 주문 목록으로
        </Link>
      </div>

      {/* 취소 완료 알림 */}
      {cancelled === "true" && (
        <div 
          className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"
          data-testid="cancel-success-message"
        >
          <p className="text-green-800 font-medium">주문이 취소되었습니다.</p>
          <p className="text-sm text-green-600">환불은 3~5 영업일 내에 처리됩니다.</p>
        </div>
      )}

      <div 
        className="bg-white rounded-lg shadow p-6 space-y-6"
        data-testid="order-detail-container"
        data-order-number={order.orderNumber}
      >
        {/* 주문 상태 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
            <h1 
              className="text-xl font-bold mb-1"
              data-testid="order-number"
            >
              주문번호: {order.orderNumber}
            </h1>
            <p 
              className="text-sm text-gray-500"
              data-testid="order-created-at"
            >
              주문일: {new Date(order.createdAt).toLocaleString("ko-KR")}
            </p>
          </div>
          <OrderStatusBadge status={order.paymentStatus} />
        </div>

        {/* 주문 상품 목록 */}
        <OrderItemTable items={order.orderItems} />

        {/* 배송 정보 */}
        <div className="border-t pt-4" data-testid="delivery-info-section">
          <h2 className="font-bold mb-3" data-testid="delivery-info-title">배송 정보</h2>
          <div className="bg-gray-50 rounded-lg p-4" data-testid="delivery-address">
            <p className="text-gray-700">{order.delivery.deliveryAddress}</p>
            {order.delivery.trackingNumber && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">송장번호</p>
                <p 
                  className="font-mono font-medium"
                  data-testid="tracking-number"
                >
                  {order.delivery.trackingNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 총 금액 */}
        <div className="border-t pt-4" data-testid="total-amount-section">
          <div className="flex justify-between items-center bg-blue-50 rounded-lg p-4">
            <span className="font-medium text-gray-700">총 결제금액</span>
            <span 
              className="text-2xl font-bold text-blue-600"
              data-testid="total-amount"
            >
              {order.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
        
        {/* 배송 중일 경우 안내 */}
        {order.paymentStatus === "PAID" && order.delivery.trackingNumber && (
          <div 
            className="border-t pt-4"
            data-testid="shipping-in-progress-message"
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-medium">이미 배송이 시작된 주문입니다</p>
              <p className="text-sm text-yellow-600 mt-1">
                취소가 어려우니 판매자에게 문의해주세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}