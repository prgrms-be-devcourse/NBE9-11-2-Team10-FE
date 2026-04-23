"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmOrderAction } from "@/lib/actions/order.actions";
import type { ConfirmOrderRequest } from "@/schemas/order.schema";

type ConfirmStatus = "confirming" | "success" | "timeout" | "failed";

interface ConfirmPaymentClientProps {
  initialStatus: ConfirmStatus;
  initialMessage: string;
  orderId: string;
  paymentKey?: string;
  amount?: number;
}

export default function ConfirmPaymentClient({
  initialStatus,
  initialMessage,
  orderId,
  paymentKey,
  amount,
}: ConfirmPaymentClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ConfirmStatus>(initialStatus);
  const [message, setMessage] = useState(initialMessage);
  const [elapsedTime, setElapsedTime] = useState(0);

  // ⏱️ 경과 시간 측정
  useEffect(() => {
    if (status === "confirming") {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status]);

  // ✅ 결제 확인 로직 (초기 상태가 'confirming' 일 때만 실행)
  useEffect(() => {
    if (initialStatus !== "confirming" || !paymentKey || !amount) {
      return;
    }

    const confirmPayment = async () => {
      try {
        const payload: ConfirmOrderRequest = {
          paymentKey,
          orderId,
          amount,
        };

        const result = await confirmOrderAction(payload);

        if (result.success) {
          setStatus("success");
          setMessage("결제가 완료되었습니다!");
          
          // 2 초 후 주문 상세로 자동 이동
          setTimeout(() => {
            router.push(`/orders/${result.data.orderId}`);
          }, 2000);
        } else {
          // 타임아웃 처리
          if (result.error.errorCode === "CONFIRM_TIMEOUT" || result.error.isTimeout) {
            setStatus("timeout");
            setMessage("결제 확인이 지연되고 있습니다.");
          } else {
            setStatus("failed");
            setMessage(result.error.detail || "결제 확인에 실패했습니다.");
          }
        }
      } catch (err) {
        console.error("결제 확인 중 오류:", err);
        setStatus("failed");
        setMessage("예상치 못한 오류가 발생했습니다.");
      }
    };

    confirmPayment();
  }, [initialStatus, paymentKey, amount, orderId, router]);

  // 🔹 확인 중 (로딩)
  if (status === "confirming") {
    const isLongWait = elapsedTime > 10;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            {isLongWait && (
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto opacity-20"></div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">결제를 확인하고 있습니다</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          {isLongWait && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⏳ 외부 결제 시스템과 연동 중입니다.<br />
                최대 15 초까지 소요될 수 있습니다.
              </p>
            </div>
          )}

          <div className="text-sm text-gray-400">
            경과 시간: {elapsedTime} 초
          </div>
        </div>
      </div>
    );
  }

  // ✅ 성공
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border max-w-md mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h2>
            <p className="text-gray-600">주문이 정상적으로 처리되었습니다.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">주문번호</p>
            <p className="font-mono font-semibold text-gray-900">{orderId}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              주문 상세보기
            </button>
            <button
              onClick={() => router.push("/orders")}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              주문 목록
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⏰ 타임아웃
  if (status === "timeout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm border max-w-md mx-4">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 확인 중</h2>
            <p className="text-gray-600">{message}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 안내사항</p>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• 결제는 성공적으로 처리되었을 수 있습니다</li>
              <li>• 주문 목록에서 주문 상태를 확인해 주세요</li>
              <li>• 중복 결제는 발생하지 않습니다</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/orders")}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              주문 목록 확인
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ❌ 실패 (initial 상태 또는 에러)
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
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            이전으로 돌아가기
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            주문 목록
          </button>
        </div>
      </div>
    </div>
  );
}