// app/(public)/orders/page.tsx
import { fetchBuyerOrders } from "@/lib/services/order.service";
import { ProblemDetailError } from "@/types/common";
import { OrderApiError } from "@/utils/error/orders.error";
import Link from "next/link";

// 컴포넌트는 나중에 분리
function OrderCard({ order, index }: { order: any; index: number }) {
  const statusColors: Record<string, string> = {
    READY: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    READY: "결제 대기",
    PAID: "결제 완료",
    CANCELLED: "취소됨",
    REFUNDED: "환불됨",
  };

  return (
    <Link 
      href={`/orders/${order.orderNumber}`}
      data-testid={`order-card-${index}`}
      data-order-number={order.orderNumber}
    >
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p 
              className="text-sm text-gray-600 mb-1"
              data-testid={`order-number-${index}`}
            >
              {order.orderNumber}
            </p>
            <p 
              className="text-xs text-gray-500"
              data-testid={`order-date-${index}`}
            >
              {new Date(order.createdAt).toLocaleString("ko-KR")}
            </p>
          </div>
          <span 
            className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100"}`}
            data-testid={`order-status-${index}`}
            data-status={order.status}
          >
            {statusLabels[order.status] || order.status}
          </span>
        </div>
        
        <div className="border-t border-b py-3 mb-3">
          <p 
            className="font-medium text-gray-900"
            data-testid={`order-product-name-${index}`}
          >
            {order.representativeProductName}
          </p>
          <p 
            className="text-sm text-gray-500"
            data-testid={`order-quantity-${index}`}
          >
            총 {order.totalQuantity}개
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <p 
            className="font-bold text-lg"
            data-testid={`order-total-amount-${index}`}
          >
            {order.totalAmount.toLocaleString()}원
          </p>
          <p className="text-sm text-blue-600">상세보기 →</p>
        </div>
      </div>
    </Link>
  );
}

export default async function OrdersPage() {
  // ✅ Service 직접 호출 (조회 연산)
  let ordersData: { userName: string; orders: any[] } | null = null;
  let error: ProblemDetailError | null = null;

  try {
    ordersData = await fetchBuyerOrders();
  } catch (err) {
    if (err instanceof OrderApiError) {
      error = err.problemDetail;
    } else {
      error = {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "주문 목록을 불러오는 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      };
    }
  }

  // 에러 처리
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="orders-page-title">
          주문 내역
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" data-testid="orders-error-message">
          <p className="text-red-600 font-medium mb-2">주문 내역을 불러올 수 없습니다</p>
          <p className="text-sm text-red-500">{error.detail}</p>
          {error.errorCode === "AUTH_REQUIRED" && (
            <Link href="/login" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" data-testid="login-button">
              로그인하기
            </Link>
          )}
        </div>
      </div>
    );
  }

  const { userName, orders } = ordersData!;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="orders-page-title">주문 내역</h1>
        <p className="text-gray-600 mt-1" data-testid="orders-user-name">{userName}님의 주문 목록</p>
      </div>
      
      {orders?.length ? (
        <div className="space-y-4" data-testid="orders-list" data-order-count={orders.length}>
          {orders.map((order, index) => (
            <OrderCard key={order.orderNumber} order={order} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center" data-testid="orders-empty-state">
          <div className="text-gray-400 mb-4" data-testid="orders-empty-icon">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2" data-testid="orders-empty-message">주문 내역이 없습니다</p>
          <p className="text-gray-400 text-sm mb-6">첫 번째 주문을 만들어보세요!</p>
          <Link href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" data-testid="browse-products-button">
            상품 구경하기 →
          </Link>
        </div>
      )}
    </div>
  );
}