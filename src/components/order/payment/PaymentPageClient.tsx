"use client";

import { useState } from "react";
import Script from "next/script";
import type { TossPaymentsSDK, PaymentInstance, TossPaymentRequestOptions } from "@/types/tosspayments";

interface PaymentPageClientProps {
  orderId: string;
  totalAmount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  customerMobilePhone: string;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: string;
}

// ------ 상수 ------
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
const TOSS_CUSTOMER_KEY = process.env.NEXT_PUBLIC_TOSS_CUSTOMER_KEY || "";

export default function PaymentPageClient({
  orderId,
  totalAmount,
  orderName,
  customerName,
  customerEmail,
  customerMobilePhone,
  orderItems,
  deliveryAddress,
}: PaymentPageClientProps) {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = customerMobilePhone.replace(/[^0-9]/g, '');

  // ✅ SDK 로드 완료 핸들러 (타입 안전성 확보)
  const handleSdkLoad = () => {
    // ✅ optional chaining 으로 안전하게 접근
    if (typeof window !== "undefined" && window.TossPayments) {
      setIsSdkLoaded(true);
    }
  };

  // ✅ 결제 요청 함수
  const requestPayment = async () => {
    if (!isSdkLoaded || isRequesting) return;

    // ✅ 타입 가드: SDK 가 로드되었는지 재확인
    const tossPaymentsFn = window.TossPayments;
    if (!tossPaymentsFn) {
      setError("결제 시스템이 준비되지 않았습니다.");
      return;
    }

    setIsRequesting(true);
    setError(null);

    try {
      // ✅ 1. SDK 초기화 (함수 호출)
      const tossPayments = tossPaymentsFn(TOSS_CLIENT_KEY);
      
      // ✅ 2. payment 인스턴스 생성
      //    - ANONYMOUS 는 정적 프로퍼티로 접근
      const customerKey = TOSS_CUSTOMER_KEY || tossPaymentsFn.ANONYMOUS;
      const payment: PaymentInstance = tossPayments.payment({ customerKey });

      // ✅ 3. 결제 요청 옵션 구성 (타입 안전)
      const paymentOptions: TossPaymentRequestOptions = {
        method: "CARD",
        amount: {
          currency: "KRW",
          value: totalAmount,
        },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/orders/payment/confirm`,
        failUrl: `${window.location.origin}/orders/payment/fail`,
        customerEmail,
        customerName,
        customerMobilePhone: cleanPhone,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      };

      // ✅ 4. 결제 실행
      await payment.requestPayment(paymentOptions);
      
    } catch (err) {
      console.error("결제 요청 실패:", err);
      setError("결제 요청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      {/* ✅ 토스페이먼츠 SDK 로드 */}
      <Script
        src="https://js.tosspayments.com/v2/standard"
        strategy="afterInteractive"
        onLoad={handleSdkLoad}
        onError={() => setError("결제 시스템을 로드할 수 없습니다.")}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">결제하기</h1>
            <p className="text-gray-600 mt-1">주문번호: {orderId}</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 주문 정보 */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 정보</h2>
            
            <div className="space-y-3">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity} 개</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {(item.price * item.quantity).toLocaleString()} 원
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">총 결제금액</span>
                <span className="text-2xl font-bold text-blue-600">
                  {totalAmount.toLocaleString()} 원
                </span>
              </div>
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">배송 정보</h2>
            <p className="text-sm text-gray-600">{deliveryAddress}</p>
          </div>

          {/* 결제하기 버튼 */}
          <button
            onClick={requestPayment}
            disabled={!isSdkLoaded || isRequesting}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl 
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed 
                     transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            {isRequesting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                결제 처리 중...
              </>
            ) : !isSdkLoaded ? (
              "결제 시스템 로딩 중..."
            ) : (
              "결제하기"
            )}
          </button>

          {/* 안내 문구 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔒 토스페이먼츠를 통한 안전한 결제입니다.<br />
              테스트 키 사용 시 실제 결제되지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}