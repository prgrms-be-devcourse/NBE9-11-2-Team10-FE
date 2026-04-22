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
      PAYMENT_PROCESS_CANCELED: "결제가 취소되었습니다.",
      CARD_PROCESS_FAILED: "카드 결제에 실패했습니다. 다른 카드를 사용해주세요.",
      INVALID_PAYMENT: "유효하지 않은 결제 정보입니다.",
      REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다.",
      STOPPED_CARD: "정지된 카드입니다.",
      EXPIRED_CARD: "유효기간이 만료된 카드입니다.",
      OVER_LIMIT: "한도 초과로 결제가 불가능합니다.",
      PASSWORD_ERROR: "비밀번호가 일치하지 않습니다.",
      SUSPECT_UNAUTHORIZED: "부정 거래가 의심됩니다.",
      TEMPORARY_ERROR: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
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