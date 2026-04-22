// app/(seller)/seller/orders/page.tsx
import { fetchSellerOrders } from "@/lib/services/order.service";
import { ProblemDetailError } from "@/types/common";
import { OrderApiError } from "@/utils/error/orders.error";
import Link from "next/link";

function SellerOrderTable({ orders }: { orders: any[] }) {
  const statusColors: Record<string, string> = {
    READY: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    READY: "결제 대기",
    PAID: "결제 완료",
    CANCELLED: "취소됨",
  };

  if (orders.length === 0) {
    return (
      <div 
        className="bg-white rounded-lg shadow p-12 text-center"
        data-testid="seller-orders-empty"
      >
        <p className="text-gray-500" data-testid="seller-orders-empty-message">
          판매 내역이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden"
      data-testid="seller-orders-table-container"
    >
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="seller-orders-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                주문번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                구매자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                상품
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                수량
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                주문일
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                상세
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200" data-testid="seller-orders-tbody">
            {orders.map((order, index) => (
              <tr 
                key={order.orderNumber} 
                className="hover:bg-gray-50"
                data-testid={`seller-order-row-${index}`}
                data-order-number={order.orderNumber}
              >
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  data-testid={`seller-order-number-${index}`}
                >
                  {order.orderNumber}
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  data-testid={`seller-order-buyer-${index}`}
                >
                  {order.buyerName}
                </td>
                <td 
                  className="px-6 py-4 text-sm text-gray-700"
                  data-testid={`seller-order-product-${index}`}
                >
                  {order.productName}
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center"
                  data-testid={`seller-order-quantity-${index}`}
                >
                  {order.quantity}개
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium"
                  data-testid={`seller-order-amount-${index}`}
                >
                  {order.totalAmount.toLocaleString()}원
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100"}`}
                    data-testid={`seller-order-status-${index}`}
                    data-status={order.status}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  data-testid={`seller-order-date-${index}`}
                >
                  {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <Link 
                    href={`/orders/${order.orderNumber}`}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    data-testid={`seller-order-detail-link-${index}`}
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function SellerOrdersPage() {
  // ✅ Service 직접 호출 (조회 연산)
  let ordersData: { sellerName: string; orders: any[] } | null = null;
  let error: ProblemDetailError | null = null;

  try {
    ordersData = await fetchSellerOrders();
  } catch (err) {
    if (err instanceof OrderApiError) {
      error = err.problemDetail;
    } else {
      error = {
        type: "https://api.example.com/errors/INTERNAL_ERROR",
        title: "서버 내부 오류",
        status: 500,
        detail: "판매 내역을 불러오는 중 오류가 발생했습니다.",
        errorCode: "INTERNAL_ERROR",
      };
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6" data-testid="seller-orders-page-title">판매 내역 관리</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" data-testid="seller-orders-error">
          <p className="text-red-600">판매 내역을 불러올 수 없습니다</p>
          <p className="text-sm text-red-500 mt-1">{error.detail}</p>
        </div>
      </div>
    );
  }

  const { sellerName, orders } = ordersData!;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" data-testid="seller-orders-page-title">판매 내역 관리</h1>
        <p className="text-gray-600 mt-1" data-testid="seller-name">{sellerName}님의 판매 현황</p>
      </div>
      
      <SellerOrderTable orders={orders} />
    </div>
  );
}