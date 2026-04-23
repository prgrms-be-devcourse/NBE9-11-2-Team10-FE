import ConfirmPaymentClient from "@/components/order/payment/ConfirmPaymentClient";

interface PageProps {
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  }>;
}

export default async function ConfirmPaymentPage({ searchParams }: PageProps) {
  // ✅ Next.js 15+: searchParams 는 Promise
  const params = await searchParams;

  // ✅ 필수 파라미터 검증
  const { paymentKey, orderId, amount } = params;
  
  if (!paymentKey || !orderId || !amount) {
    // 파라미터 누락 시 실패 페이지로 리다이렉트
    return (
      <ConfirmPaymentClient
        initialStatus="failed"
        initialMessage="결제 정보가 올바르지 않습니다."
        orderId=""
      />
    );
  }

  // ✅ amount 는 숫자로 변환 (보안: 서버에서 재검증 권장)
  const amountValue = Number(amount);
  if (isNaN(amountValue) || amountValue <= 0) {
    return (
      <ConfirmPaymentClient
        initialStatus="failed"
        initialMessage="결제 금액이 올바르지 않습니다."
        orderId={orderId}
      />
    );
  }

  // ✅ 클라이언트 컴포넌트에 파라미터 전달
  return (
    <ConfirmPaymentClient
      initialStatus="confirming"
      initialMessage="결제를 확인하고 있습니다..."
      orderId={orderId}
      paymentKey={paymentKey}
      amount={amountValue}
    />
  );
}