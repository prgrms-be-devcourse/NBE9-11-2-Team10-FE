"use client";

import { useRouter } from "next/navigation";

interface FailPaymentClientProps {
  errorCode: string | null;
  errorMessage: string | null;
  orderId: string | null;
}

export default function FailPaymentClient({
  errorCode,
  errorMessage,
  orderId,
}: FailPaymentClientProps) {
  const router = useRouter();

  // 에러 코드별 메시지 매핑
  const getErrorMessage = (code: string | null, message: string | null) => {
    const errorMessages: Record<string, string> = {
      PAYMENT_PROCESS_CANCELED: "사용자에 의해 결제가 취소되었습니다.",
      PAY_PROCESS_ABORTED: "결제 진행 중 승인에 실패하여 결제가 중단되었습니다.",
      REJECT_CARD_COMPANY: "결제 승인이 거절되었습니다."
    };

    return message || errorMessages[code || ""] || "결제 처리 중 오류가 발생했습니다.";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border max-w-md mx-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h2>
          <p className="text-gray-600 mb-4">
            {getErrorMessage(errorCode, errorMessage)}
          </p>
          
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500 mb-1">주문번호</p>
              <p className="font-mono text-sm text-gray-900">{orderId}</p>
            </div>
          )}
        </div>

        {errorCode && (
          <div className="text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium mb-1">에러 코드</p>
            <p className="text-sm font-mono text-yellow-900">{errorCode}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            다시 결제하기
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            주문 목록
          </button>
        </div>
      </div>
    </div>
  );
}