"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitOrder, updateOrderField } from "@/lib/actions/order.actions";
import { initialOrderState } from "@/types/order";
import Image from "next/image";
import { AddressSearchInput } from "../common/AddressSearchInput";

interface OrderInfo {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  sellerNickname: string;
  imageUrl?: string | null;
}

interface OrderFormProps {
  orderInfo: OrderInfo;
}

export default function OrderForm({ orderInfo }: OrderFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    roadAddress: "",
    detailAddress: "",
    recipientName: "",
    recipientPhone: "",
    customerEmail: "",
    requestMessage: "",
  });

  const [state, formAction, isPending] = useActionState(submitOrder, {
    ...initialOrderState,
    formData: {
      orderProducts: [
        {
          productId: orderInfo.productId,
          quantity: orderInfo.quantity,
        }
      ],
      deliveryAddress: "",
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /*
  // ✅ 주소 변경 핸들러 (AddressSearchInput 연동용)
  const handleAddressChange = useCallback((value: string) => {
    const formData = new FormData();
    formData.set('field', 'deliveryAddress');
    formData.set('value', value);
    updateOrderField(state, formData);
  }, [state]);


  // ✅ 입력 필드 변경 핸들러 (공통)
  const handleFieldChange = useCallback((field: string, value: string) => {
    const formData = new FormData();
    formData.set('field', field);
    formData.set('value', value);
    updateOrderField(state, formData);
  }, [state]);
  */


  // ✅ 주문 성공 시 결제 페이지로 이동
  useEffect(() => {
    if (state.success && state.data?.orderNumber) {
      const { orderNumber } = state.data;

      const params = new URLSearchParams({
        orderId: orderNumber,
        amount: orderInfo.totalPrice.toString(),
        name: encodeURIComponent(formData.recipientName),
        phone: encodeURIComponent(formData.recipientPhone),
        email: encodeURIComponent(formData.customerEmail),
      });

      router.push(`/orders/payment?${params.toString()}`);
      router.refresh();
    }
  }, [state.success, state.data, formData, router, orderInfo.totalPrice]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {/* 🔹 주문 상품 정보 (읽기 전용) */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">주문 상품</h2>

        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {orderInfo.imageUrl ? (
              <Image
                src={orderInfo.imageUrl}
                alt={orderInfo.productName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-gray-900 line-clamp-2">
              {orderInfo.productName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">판매자: {orderInfo.sellerNickname}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-600">{orderInfo.quantity}개</span>
              <span className="text-gray-300">|</span>
              <span className="font-semibold text-gray-900">
                {orderInfo.price.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">총 주문금액</span>
            <span className="text-xl font-bold text-blue-600">
              {orderInfo.totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 🔹 배송 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">배송 정보</h2>

        <div className="space-y-4">
          <AddressSearchInput
            value={formData.roadAddress}
            onChange={(val) => handleChange("roadAddress", val)}
            error={state.errors.roadAddress}
            disabled={isPending}
            placeholder="도로명 주소"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세주소</label>
            <input
              name="detailAddress"
              value={formData.detailAddress}
              onChange={(e) => handleChange("detailAddress", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="동/호수, 층"
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수령인 <span className="text-red-500">*</span></label>
              <input
                name="recipientName"
                value={formData.recipientName}
                onChange={(e) => handleChange("recipientName", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 <span className="text-red-500">*</span></label>
              <input
                name="recipientPhone"
                value={formData.recipientPhone}
                onChange={(e) => handleChange("recipientPhone", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="010-0000-0000"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일 <span className="text-red-500">*</span></label>
            <input
              name="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleChange("customerEmail", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="결제 영수증 발송용"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요청사항</label>
            <textarea
              name="requestMessage"
              value={formData.requestMessage}
              onChange={(e) => handleChange("requestMessage", e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none"
              placeholder="배송 시 요청사항을 입력해주세요"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* 🔹 결제 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 정보</h2>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">토스페이먼트 결제</p>
              <p className="text-sm text-blue-700 mt-1">
                안전하고 빠른 결제를 위해 토스페이먼트를 사용합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">상품금액</span>
            <span className="text-gray-900">{orderInfo.totalPrice.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">배송비</span>
            <span className="text-green-600 font-medium">무료</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">총 결제금액</span>
            <span className="text-blue-600">{orderInfo.totalPrice.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 🔹 메시지 표시 */}
      {
        state.message && (
          <div className={`p-3 rounded-lg text-sm ${state.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
            {state.message}
          </div>
        )
      }

      {/* 🔹 제출 버튼 */}
      <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">총 결제금액</p>
            <p className="text-xl font-bold text-gray-900">
              {orderInfo.totalPrice.toLocaleString()}원
            </p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 max-w-xs py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-xl 
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed 
                     transition-all active:scale-[0.98]"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                처리 중...
              </span>
            ) : (
              "주문하기"
            )}
          </button>
        </div>
      </div>
    </form >
  );
}