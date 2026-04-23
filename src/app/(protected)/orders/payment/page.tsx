import PaymentPageClient from "@/components/order/payment/PaymentPageClient";
import { fetchOrderDetail } from "@/lib/services/order.service";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    orderId?: string;
    amount?: string;
    name?: string;
    phone?: string;
    email?: string;
    testMode?: string;
  }>;
}

export default async function PaymentPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!params.orderId || !params.amount || !params.name || !params.phone || !params.email) {
    return <div className="text-center py-20 text-red-600">결제 정보가 누락되었습니다.</div>;
  }

  // ✅ [E2E 전용] 테스트 모드: 토스페이먼트 스킵하고 바로 확인 페이지로
  if (params.testMode === "skip-toss" && process.env.NODE_ENV !== "production") {
    const mockPaymentKey = `pay_test_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    redirect(
      `/orders/payment/confirm?paymentKey=${mockPaymentKey}&orderId=${params.orderId}&amount=${params.amount}`
    );
  }

  const orderId = params.orderId;

  // ✅ 주문 정보 조회 (Server 에서 미리 페칭)
  try {
    const order = await fetchOrderDetail(orderId);

    // ✅ 결제 가능한 상태인지 검증
    if (order.paymentStatus !== "READY") {
      redirect(`/orders/${orderId}`);
    }

    // ✅ 클라이언트 컴포넌트에 필요한 데이터만 전달
    const clientProps = {
      orderId: order.orderNumber,
      totalAmount: order.totalAmount,
      orderName: order.orderItems[0]?.productName || "주문 상품",
      customerName: decodeURIComponent(params.name),
      customerMobilePhone: decodeURIComponent(params.phone),
      customerEmail: decodeURIComponent(params.email),
      orderItems: order.orderItems.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.orderPrice,
      })),
      deliveryAddress: order.delivery.deliveryAddress,
    };

    return <PaymentPageClient {...clientProps} />;

  } catch (error) {
    console.error("결제 페이지 데이터 파싱 실패:", error);
    notFound();
  }
}